-- Run this once in the Supabase SQL Editor.
-- Needed so "delivery charge explicitly set to 0" and "delivery charge
-- never touched" can be told apart (used for the Deliveries copy
-- button's DC: Included / Not Included line). Existing rows already
-- have 0 stored from before this distinction existed, so they'll read
-- as "Included" until edited and saved again — that's expected.
alter table public.orders alter column delivery_charge drop not null;
alter table public.orders alter column delivery_charge drop default;
