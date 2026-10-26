-- اجرا در Supabase → SQL Editor
-- جدول پروفایل کاربران با امنیت سطح ردیف (RLS)

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  msgs_today int not null default 0,
  day date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- هر کاربر فقط پروفایل خودش را ببیند
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select using (auth.uid() = id);

-- کاربر فقط می‌تواند شمارنده پیام و روز را به‌روز کند، نه پلن را
drop policy if exists "update own usage" on public.profiles;
create policy "update own usage" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

revoke update on public.profiles from authenticated, anon;
grant update (msgs_today, day) on public.profiles to authenticated;

-- ساخت خودکار پروفایل بعد از ثبت‌نام
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- تغییر پلن فقط توسط سرور/مدیر (با service_role) انجام می‌شود، مثلاً بعد از پرداخت موفق:
-- update public.profiles set plan = 'pro' where email = 'user@example.com';
