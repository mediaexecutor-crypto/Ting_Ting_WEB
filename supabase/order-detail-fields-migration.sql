-- Run this once in the Supabase SQL Editor.
alter table public.orders add column if not exists confirmed_date date;
alter table public.orders add column if not exists product_notes text;
alter table public.order_files add column if not exists thumbnail_url text;
