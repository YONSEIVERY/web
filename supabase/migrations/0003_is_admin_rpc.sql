create or replace function public.is_admin(check_email text)
returns boolean language sql security definer as $$
  select exists(select 1 from public.admins where email = check_email);
$$;
grant execute on function public.is_admin(text) to anon, authenticated;
