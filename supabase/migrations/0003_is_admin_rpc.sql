create or replace function public.is_admin(check_email text)
returns boolean language sql security definer as $$
  select exists(select 1 from public.admins where email = check_email);
$$;
revoke execute on function public.is_admin(text) from public;
revoke execute on function public.is_admin(text) from anon;
grant execute on function public.is_admin(text) to authenticated;
