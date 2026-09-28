-- Run this once in the Supabase SQL Editor BEFORE using Create/Edit Order
-- after this deploy (the new fields are saved on every create/update).
alter table public.orders add column if not exists alternative_number text;
alter table public.orders add column if not exists order_type text;
