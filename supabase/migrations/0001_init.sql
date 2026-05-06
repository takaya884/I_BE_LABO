-- I.BE LABO 在庫管理システム 初期スキーマ
-- マルチテナント (tenant -> store) を最初から想定

create extension if not exists "pgcrypto";

-- ============ テナント / 店舗 ============
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists stores (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  address text,
  created_at timestamptz not null default now()
);
create index on stores (tenant_id);

-- ============ ユーザー (Supabase auth.users にひも付け) ============
create type user_role as enum ('tenant_admin', 'store_manager', 'staff');

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  store_id uuid references stores(id) on delete set null,
  role user_role not null default 'staff',
  display_name text,
  created_at timestamptz not null default now()
);
create index on profiles (tenant_id);
create index on profiles (store_id);

-- ============ 商品マスタ ============
create type tracking_type as enum ('individual', 'quantity');
create type item_category as enum ('coin', 'material', 'tool', 'finished');

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  store_id uuid not null references stores(id) on delete cascade,
  category item_category not null,
  tracking_type tracking_type not null,
  name text not null,
  sku text,
  country text,                    -- コインの場合: 国
  denomination text,               -- コインの場合: 額面
  unit text default '個',          -- 数量管理品の単位 (個 / 枚 / m / g)
  reorder_point int default 0,     -- 在庫切れ警告のしきい値
  unit_cost numeric(10,2),         -- 単価（仕入原価）
  notes text,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create index on items (tenant_id);
create index on items (store_id);
create index on items (category);

-- ============ 個体管理品 (コイン1枚 = 1レコード) ============
create type item_unit_status as enum ('in_stock', 'reserved', 'consumed', 'lost');

create table if not exists item_units (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  store_id uuid not null references stores(id) on delete cascade,
  serial text,                     -- 任意の管理番号
  year int,                        -- コインの年号
  condition text,                  -- 状態 (mint / fine / worn など)
  acquisition_cost numeric(10,2),
  acquired_at date,
  status item_unit_status not null default 'in_stock',
  photo_url text,
  notes text,
  created_at timestamptz not null default now()
);
create index on item_units (item_id);
create index on item_units (store_id);
create index on item_units (status);

-- ============ 数量管理品の在庫スナップショット ============
-- 履歴 (stock_movements) から再計算可能だが、表示高速化のためキャッシュ
create table if not exists stock_balances (
  store_id uuid not null references stores(id) on delete cascade,
  item_id uuid not null references items(id) on delete cascade,
  quantity int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (store_id, item_id)
);

-- ============ 体験メニュー / BOM ============
create table if not exists experience_menus (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  store_id uuid not null references stores(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null default 0,
  duration_minutes int,
  description text,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create index on experience_menus (store_id);

create table if not exists boms (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references experience_menus(id) on delete cascade,
  item_id uuid not null references items(id) on delete cascade,
  quantity int not null default 1, -- 1回の体験で消費する数量
  is_optional boolean not null default false,
  notes text
);
create index on boms (menu_id);
create unique index on boms (menu_id, item_id);

-- ============ 在庫履歴 (append-only) ============
create type movement_type as enum (
  'inbound',         -- 入庫
  'outbound',        -- 出庫 (廃棄・破損)
  'consume',         -- 体験での消費
  'adjustment',      -- 棚卸調整
  'transfer_in',     -- 店舗間移動 (受け)
  'transfer_out'     -- 店舗間移動 (出し)
);

create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  item_id uuid not null references items(id) on delete cascade,
  item_unit_id uuid references item_units(id) on delete set null,
  movement_type movement_type not null,
  quantity int not null,            -- 個体管理品は常に 1
  related_menu_id uuid references experience_menus(id) on delete set null,
  related_movement_id uuid references stock_movements(id) on delete set null, -- transfer の対
  performed_by uuid references profiles(id) on delete set null,
  occurred_at timestamptz not null default now(),
  note text
);
create index on stock_movements (store_id, occurred_at desc);
create index on stock_movements (item_id);

-- ============ 在庫数を更新するトリガー (数量管理品のみ) ============
create or replace function update_stock_balance()
returns trigger
language plpgsql
as $$
declare
  delta int;
  trk tracking_type;
begin
  select tracking_type into trk from items where id = new.item_id;
  if trk = 'individual' then
    return new; -- 個体管理は item_units.status を直接変える運用
  end if;

  delta := case new.movement_type
    when 'inbound' then new.quantity
    when 'transfer_in' then new.quantity
    when 'adjustment' then new.quantity
    when 'outbound' then -new.quantity
    when 'consume' then -new.quantity
    when 'transfer_out' then -new.quantity
  end;

  insert into stock_balances (store_id, item_id, quantity, updated_at)
  values (new.store_id, new.item_id, delta, now())
  on conflict (store_id, item_id)
  do update set quantity = stock_balances.quantity + excluded.quantity,
                updated_at = now();

  return new;
end;
$$;

drop trigger if exists trg_stock_movements_update_balance on stock_movements;
create trigger trg_stock_movements_update_balance
  after insert on stock_movements
  for each row execute function update_stock_balance();

-- ============ 体験を1件実施したときに BOM 分の在庫を一括消費する RPC ============
create or replace function consume_experience(
  p_menu_id uuid,
  p_store_id uuid,
  p_unit_overrides jsonb default '[]'::jsonb -- [{item_id, item_unit_id}, ...] 個体管理品の指定
)
returns uuid -- 代表 movement の ID
language plpgsql
security definer
as $$
declare
  bom_row record;
  override jsonb;
  v_unit_id uuid;
  v_movement_id uuid;
  first_movement_id uuid;
  trk tracking_type;
begin
  for bom_row in
    select b.item_id, b.quantity, i.tracking_type
    from boms b
    join items i on i.id = b.item_id
    where b.menu_id = p_menu_id and b.is_optional = false
  loop
    if bom_row.tracking_type = 'individual' then
      v_unit_id := null;
      for override in select * from jsonb_array_elements(p_unit_overrides)
      loop
        if (override->>'item_id')::uuid = bom_row.item_id then
          v_unit_id := (override->>'item_unit_id')::uuid;
          exit;
        end if;
      end loop;

      if v_unit_id is null then
        select id into v_unit_id from item_units
          where item_id = bom_row.item_id
            and store_id = p_store_id
            and status = 'in_stock'
          order by acquired_at nulls last, created_at
          limit 1;
      end if;

      if v_unit_id is null then
        raise exception '在庫切れです: item_id=%', bom_row.item_id;
      end if;

      update item_units set status = 'consumed' where id = v_unit_id;

      insert into stock_movements (store_id, item_id, item_unit_id, movement_type, quantity, related_menu_id)
      values (p_store_id, bom_row.item_id, v_unit_id, 'consume', 1, p_menu_id)
      returning id into v_movement_id;
    else
      insert into stock_movements (store_id, item_id, movement_type, quantity, related_menu_id)
      values (p_store_id, bom_row.item_id, 'consume', bom_row.quantity, p_menu_id)
      returning id into v_movement_id;
    end if;

    if first_movement_id is null then
      first_movement_id := v_movement_id;
    end if;
  end loop;

  return first_movement_id;
end;
$$;

-- ============ Row Level Security ============
alter table tenants enable row level security;
alter table stores enable row level security;
alter table profiles enable row level security;
alter table items enable row level security;
alter table item_units enable row level security;
alter table stock_balances enable row level security;
alter table experience_menus enable row level security;
alter table boms enable row level security;
alter table stock_movements enable row level security;

create or replace function current_tenant_id() returns uuid
language sql stable as $$
  select tenant_id from profiles where id = auth.uid()
$$;

create or replace function current_user_role() returns user_role
language sql stable as $$
  select role from profiles where id = auth.uid()
$$;

-- 自テナント配下のみ参照可
create policy tenants_select on tenants for select
  using (id = current_tenant_id());

create policy stores_all on stores for all
  using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

create policy profiles_self on profiles for select
  using (id = auth.uid() or tenant_id = current_tenant_id());

create policy items_all on items for all
  using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

create policy item_units_all on item_units for all
  using (store_id in (select id from stores where tenant_id = current_tenant_id()))
  with check (store_id in (select id from stores where tenant_id = current_tenant_id()));

create policy stock_balances_all on stock_balances for all
  using (store_id in (select id from stores where tenant_id = current_tenant_id()))
  with check (store_id in (select id from stores where tenant_id = current_tenant_id()));

create policy experience_menus_all on experience_menus for all
  using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

create policy boms_all on boms for all
  using (menu_id in (select id from experience_menus where tenant_id = current_tenant_id()))
  with check (menu_id in (select id from experience_menus where tenant_id = current_tenant_id()));

create policy stock_movements_all on stock_movements for all
  using (store_id in (select id from stores where tenant_id = current_tenant_id()))
  with check (store_id in (select id from stores where tenant_id = current_tenant_id()));
