-- Run this once in the Supabase SQL Editor.
-- Invoice is no longer auto-generated when left blank — multiple orders
-- can now have no invoice at all. Postgres allows any number of NULLs
-- in a unique column (NULL is never equal to NULL), so this keeps the
-- uniqueness check working correctly for orders that DO have one.
alter table public.orders alter column invoice drop not null;
