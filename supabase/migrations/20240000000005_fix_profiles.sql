-- Drop existing triggers first
drop trigger if exists handle_profile_updated_at on profiles;
drop trigger if exists on_auth_user_created on auth.users;

-- Drop existing functions
drop function if exists handle_profile_updated_at();
drop function if exists handle_new_user();

-- Update profiles table
alter table profiles
  alter column updated_at set default timezone('utc'::text, now()),
  alter column created_at set default timezone('utc'::text, now());

-- Drop encryption_key column if it exists
alter table profiles drop column if exists encryption_key;

-- Create updated_at trigger function
create or replace function handle_profile_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create trigger for updated_at
create trigger handle_profile_updated_at
  before update on profiles
  for each row
  execute function handle_profile_updated_at();

-- Create function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, is_premium)
  values (new.id, new.email, false)
  on conflict (id) do update
  set email = excluded.email;
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Add indexes for better performance
create index if not exists idx_profiles_user_id on profiles(id);
create index if not exists idx_profiles_username on profiles(username);

-- Update existing profiles with missing data
update profiles
set 
  updated_at = timezone('utc'::text, now()),
  created_at = timezone('utc'::text, now())
where updated_at is null or created_at is null; 