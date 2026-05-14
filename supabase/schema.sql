-- Run this in the Supabase SQL Editor to set up the database schema.

create table units (
  id        bigserial primary key,
  number    text unique not null,
  floor     int not null,
  unit_type text not null check (unit_type in ('studio', '1br', '2br', '3br')),
  size_sqft int not null,
  monthly_fee numeric(10, 2) not null,
  status    text not null default 'vacant' check (status in ('vacant', 'occupied'))
);

create table residents (
  id            bigserial primary key,
  unit_id       bigint references units (id) on delete set null,
  first_name    text not null,
  last_name     text not null,
  email         text unique not null,
  phone         text default '',
  move_in_date  date not null,
  move_out_date date,
  status        text not null default 'active' check (status in ('active', 'inactive'))
);

create table payments (
  id           bigserial primary key,
  resident_id  bigint not null references residents (id) on delete cascade,
  payment_type text not null default 'monthly_fee'
                 check (payment_type in ('monthly_fee', 'special_assessment', 'late_fee')),
  amount       numeric(10, 2) not null,
  due_date     date not null,
  paid_date    date,
  status       text not null default 'pending' check (status in ('pending', 'paid', 'overdue')),
  notes        text default ''
);

-- Allow public read/write access (adjust with RLS policies for production)
alter table units    enable row level security;
alter table residents enable row level security;
alter table payments  enable row level security;

create policy "Allow all" on units    for all using (true) with check (true);
create policy "Allow all" on residents for all using (true) with check (true);
create policy "Allow all" on payments  for all using (true) with check (true);
