-- 初回オンボーディング用 RPC
-- まだ profile を持たない認証済みユーザーが、テナント＋店舗＋自分のプロファイルを
-- 一括で作るための bootstrap 関数。security definer で RLS をバイパスする。

create or replace function bootstrap_tenant(
  p_tenant_name text,
  p_store_name text,
  p_store_address text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_tenant_id uuid;
  v_store_id uuid;
  v_profile profiles%rowtype;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- 既に profile を持っているなら、それを返して終了 (冪等)
  select * into v_profile from profiles where id = v_user_id;
  if found then
    return json_build_object(
      'tenant_id', v_profile.tenant_id,
      'store_id', v_profile.store_id,
      'reused', true
    );
  end if;

  insert into tenants (name) values (p_tenant_name)
    returning id into v_tenant_id;

  insert into stores (tenant_id, name, address)
    values (v_tenant_id, p_store_name, p_store_address)
    returning id into v_store_id;

  insert into profiles (id, tenant_id, store_id, role, display_name)
    values (v_user_id, v_tenant_id, v_store_id, 'tenant_admin',
            (select email from auth.users where id = v_user_id));

  return json_build_object(
    'tenant_id', v_tenant_id,
    'store_id', v_store_id,
    'reused', false
  );
end;
$$;

-- profile を読むときに自分のレコードは無条件で見えるように policy を強化
-- (current_tenant_id() の循環参照を避けるため)
drop policy if exists profiles_self on profiles;
create policy profiles_select_self on profiles for select
  using (id = auth.uid());
create policy profiles_select_same_tenant on profiles for select
  using (tenant_id = current_tenant_id());
