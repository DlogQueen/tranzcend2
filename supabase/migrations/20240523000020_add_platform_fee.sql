create or replace function process_payment(
  recipient_id uuid, 
  amount decimal, 
  payment_type text, 
  note text
)
returns boolean as $$
declare
  sender_balance decimal;
  platform_fee decimal;
  creator_earning decimal;
begin
  -- 1. Check Balance
  select balance into sender_balance from profiles where id = auth.uid();
  
  if sender_balance < amount then
    return false; -- Insufficient funds
  end if;

  -- 2. Calculate Fee (20% Platform Fee)
  platform_fee := amount * 0.20;
  creator_earning := amount - platform_fee;

  -- 3. Deduct FULL amount from Sender
  update profiles 
  set balance = balance - amount 
  where id = auth.uid();

  -- 4. Add EARNING amount (80%) to Recipient
  update profiles 
  set balance = balance + creator_earning 
  where id = recipient_id;

  -- 5. Log Sender Transaction (Expense)
  insert into transactions (user_id, type, amount, description, related_user_id, status)
  values (auth.uid(), 'purchase', -amount, note, recipient_id, 'completed');

  -- 6. Log Recipient Transaction (Income - Net)
  insert into transactions (user_id, type, amount, description, related_user_id, status)
  values (recipient_id, 'earning', creator_earning, note || ' (minus 20% platform fee)', auth.uid(), 'completed');

  return true;
end;
$$ language plpgsql security definer;
