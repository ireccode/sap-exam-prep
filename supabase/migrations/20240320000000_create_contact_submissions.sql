-- Create contact_submissions table
create table if not exists public.contact_submissions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'new',
  response text,
  responded_at timestamp with time zone
);

-- Set up Row Level Security (RLS)
alter table public.contact_submissions enable row level security;

-- Create policies
create policy "Contact submissions are viewable by authenticated users"
  on public.contact_submissions for select
  to authenticated
  using (true);

create policy "Contact submissions are insertable by anyone"
  on public.contact_submissions for insert
  to anon
  with check (true);

create policy "Contact submissions are updatable by authenticated users"
  on public.contact_submissions for update
  to authenticated
  using (true)
  with check (true); 