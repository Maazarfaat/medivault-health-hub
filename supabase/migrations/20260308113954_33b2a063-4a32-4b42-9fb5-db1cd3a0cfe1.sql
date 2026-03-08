
ALTER TABLE public.blood_test_bookings ADD COLUMN IF NOT EXISTS user_address text;
ALTER TABLE public.restock_requests ADD COLUMN IF NOT EXISTS user_address text;
