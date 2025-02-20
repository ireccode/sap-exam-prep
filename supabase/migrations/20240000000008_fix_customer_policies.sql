-- Enable RLS on customers
alter table customers enable row level security;

-- Drop existing policies if any
drop policy if exists "Users can view their own customer record" on customers;
drop policy if exists "Service role can manage all customer records" on customers;

-- Create policies for customers table
create policy "Users can view their own customer record"
  on customers for select
  using (auth.uid() = user_id);

create policy "Service role can manage all customer records"
  on customers for all
  using (auth.jwt() ->> 'role' = 'service_role');

-- Add indexes for better performance if they don't exist
create index if not exists idx_customers_user_id on customers(user_id);
create index if not exists idx_customers_stripe_customer_id on customers(stripe_customer_id);

-- Grant necessary permissions to authenticated users
grant usage on schema public to authenticated;
grant all on customers to authenticated; 