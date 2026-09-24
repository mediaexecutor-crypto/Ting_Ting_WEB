-- Run this once in the Supabase SQL Editor (after schema.sql).
alter table public.orders
  add column if not exists delivery_charge numeric(12,2) not null default 0;
