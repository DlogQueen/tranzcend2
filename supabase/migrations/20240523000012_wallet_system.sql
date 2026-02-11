-- Wallet & Transaction System

-- 1. Add Balance to Profiles
alter table profiles 
add column if not exists balance decimal(10, 2) default 0.00;

-- 2. Create Transactions Table
create table if not exists transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  type text not null, -- 'deposit', 'withdrawal', 'purchase', 'earning', 'tip'
  amount decimal(10, 2) not null,
  description text,
  status text default 'completed', -- 'pending', 'completed', 'failed'
  related_user_id uuid references profiles(id), -- For transfers (who you paid/received from)
  created_at timestamp with time zone default now()
);

-- 3. RLS for Transactions
alter table transactions enable row level security;

create policy "Users can view own transactions" on transactions 
  for select using (auth.uid() = user_id);

-- 4. Secure Functions for Money Movement (Atomic Operations)

-- Function: Deposit Funds (Simulated for MVP)
create or replace function deposit_funds(amount decimal)
returns void as $$
begin
  -- Update Balance
  update profiles 
  set balance = balance + amount
  where id = auth.uid();

  -- Log Transaction
  insert into transactions (user_id, type, amount, description, status)
  values (auth.uid(), 'deposit', amount, 'Funds added to wallet', 'completed');
end;
$$ language plpgsql security definer;

-- Function: Process Payment (Purchase/Tip)
create or replace function process_payment(
  recipient_id uuid, 
  amount decimal, 
  payment_type text, -- 'unlock_post', 'unlock_message', 'tip', 'subscription'
  note text
)
returns boolean as $$
declare
  sender_balance decimal;
begin
  -- Check Balance
  select balance into sender_balance from profiles where id = auth.uid();
  
  if sender_balance < amount then
    return false; -- Insufficient funds
  end if;

  -- Deduct from Sender
  update profiles 
  set balance = balance - amount 
  where id = auth.uid();

  -- Add to Recipient
  update profiles 
  set balance = balance + amount 
  where id = recipient_id;

  -- Log Sender Transaction (Expense)
  insert into transactions (user_id, type, amount, description, related_user_id, status)
  values (auth.uid(), 'purchase', -amount, note, recipient_id, 'completed');

  -- Log Recipient Transaction (Income)
  insert into transactions (user_id, type, amount, description, related_user_id, status)
  values (recipient_id, 'earning', amount, note, auth.uid(), 'completed');

  return true;
end;
$$ language plpgsql security definer;
