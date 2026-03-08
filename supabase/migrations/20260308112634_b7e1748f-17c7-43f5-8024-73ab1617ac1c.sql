
-- Add location columns to restock_requests
ALTER TABLE public.restock_requests ADD COLUMN IF NOT EXISTS user_latitude double precision;
ALTER TABLE public.restock_requests ADD COLUMN IF NOT EXISTS user_longitude double precision;

-- Add location columns to blood_test_bookings
ALTER TABLE public.blood_test_bookings ADD COLUMN IF NOT EXISTS user_latitude double precision;
ALTER TABLE public.blood_test_bookings ADD COLUMN IF NOT EXISTS user_longitude double precision;

-- Add location and language preference to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longitude double precision;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language text DEFAULT 'en';

-- Allow pharmacies to view user profiles (for restock requests)
CREATE POLICY "Pharmacies can view user profiles for restocks" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'pharmacy'::user_role));
