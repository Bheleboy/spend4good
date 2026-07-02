
-- Restrict SECURITY DEFINER helpers to signed-in users only
revoke execute on function public.has_role_in_org(uuid, text, uuid) from public, anon;
revoke execute on function public.current_user_org_id() from public, anon;
grant execute on function public.has_role_in_org(uuid, text, uuid) to authenticated, service_role;
grant execute on function public.current_user_org_id() to authenticated, service_role;

-- Storage RLS: enforce {org_id}/{filename} path structure
create policy "compliance-docs read own org"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'compliance-docs'
    and (storage.foldername(name))[1] = public.current_user_org_id()::text
  );

create policy "compliance-docs insert own org"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'compliance-docs'
    and (storage.foldername(name))[1] = public.current_user_org_id()::text
  );

create policy "compliance-docs update own org"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'compliance-docs'
    and (storage.foldername(name))[1] = public.current_user_org_id()::text
  );

create policy "compliance-docs delete own org"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'compliance-docs'
    and (storage.foldername(name))[1] = public.current_user_org_id()::text
  );
