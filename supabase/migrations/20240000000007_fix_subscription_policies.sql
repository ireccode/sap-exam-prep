-- Enable RLS on customer_subscriptions
alter table customer_subscriptions enable row level security;

-- Drop existing policies if any
drop policy if exists "Users can view their own subscriptions" on customer_subscriptions;
drop policy if exists "Service role can manage all subscriptions" on customer_subscriptions;

-- Create policies for customer_subscriptions table
create policy "Users can view their own subscriptions"
  on customer_subscriptions for select
  using (auth.uid() = user_id);

create policy "Service role can manage all subscriptions"
  on customer_subscriptions for all
  using (auth.jwt() ->> 'role' = 'service_role');

-- Add indexes for better performance if they don't exist
create index if not exists idx_customer_subscriptions_user_id on customer_subscriptions(user_id);
create index if not exists idx_customer_subscriptions_subscription_id on customer_subscriptions(subscription_id);

-- Grant necessary permissions to authenticated users
grant usage on schema public to authenticated;
grant all on customer_subscriptions to authenticated;

-- Update existing profiles with subscription status
update profiles
set is_premium = exists (
  select 1 
  from customer_subscriptions cs 
  where cs.user_id = profiles.id 
  and cs.status in ('active', 'trialing')
  and (cs.cancel_at_period_end = false or cs.current_period_end > now())
); 