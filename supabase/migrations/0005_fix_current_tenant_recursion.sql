-- profiles の RLS ポリシーが current_tenant_id() を呼び、
-- current_tenant_id() が profiles を SELECT するため、
-- 通常権限で実行すると無限再帰 (stack depth limit exceeded) になる。
-- security definer にして RLS をバイパスする。

create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from profiles where id = auth.uid()
$$;
