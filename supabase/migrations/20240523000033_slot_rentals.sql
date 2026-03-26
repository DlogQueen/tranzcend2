create table if not exists slot_rentals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete set null,
  price_per_month float not null default 15.0,
  is_active boolean default true,
  rented_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

alter table slot_rentals enable row level security;

create policy "Admins can manage slots" on slot_rentals
  for all using (
    exists(select 1 from profiles where id = auth.uid() and is_admin = true)
  );

create policy "Users can view their own slot" on slot_rentals
  for select using (auth.uid() = user_id);
