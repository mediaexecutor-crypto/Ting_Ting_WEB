-- Run this once in the Supabase SQL Editor (after schema.sql).
-- Links a Drive folder 1:1 to the order it belongs to, so file uploads
-- know which folder to use.

alter table public.google_drive_folders
  add column if not exists order_id uuid references public.orders(id) on delete cascade;

create unique index if not exists google_drive_folders_order_id_idx
  on public.google_drive_folders(order_id) where order_id is not null;
