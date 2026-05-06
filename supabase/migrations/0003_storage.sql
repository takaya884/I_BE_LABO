-- コイン写真保管用バケット
insert into storage.buckets (id, name, public)
values ('coin-photos', 'coin-photos', true)
on conflict (id) do nothing;

-- 認証ユーザーは自テナント配下の写真を読み書きできる（パスは <store_id>/<item_id>/...）
-- MVP では public バケットなので read は誰でも可、write のみ制御
create policy "auth users can upload coin photos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'coin-photos');

create policy "auth users can update coin photos"
on storage.objects for update
to authenticated
using (bucket_id = 'coin-photos');

create policy "auth users can delete coin photos"
on storage.objects for delete
to authenticated
using (bucket_id = 'coin-photos');
