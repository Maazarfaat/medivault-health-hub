
-- Add new enum values for offer flow
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'offer_sent';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'confirmed';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'processing';

ALTER TYPE restock_status ADD VALUE IF NOT EXISTS 'offer_sent';
ALTER TYPE restock_status ADD VALUE IF NOT EXISTS 'confirmed';
ALTER TYPE restock_status ADD VALUE IF NOT EXISTS 'processing';

-- Add offer columns to blood_test_bookings
ALTER TABLE public.blood_test_bookings ADD COLUMN IF NOT EXISTS offer_price numeric;
ALTER TABLE public.blood_test_bookings ADD COLUMN IF NOT EXISTS offer_discount numeric DEFAULT 0;
ALTER TABLE public.blood_test_bookings ADD COLUMN IF NOT EXISTS offer_final_price numeric;
ALTER TABLE public.blood_test_bookings ADD COLUMN IF NOT EXISTS estimated_time text;
ALTER TABLE public.blood_test_bookings ADD COLUMN IF NOT EXISTS provider_notes text;
ALTER TABLE public.blood_test_bookings ADD COLUMN IF NOT EXISTS provider_name text;

-- Add offer columns to restock_requests
ALTER TABLE public.restock_requests ADD COLUMN IF NOT EXISTS offer_price numeric;
ALTER TABLE public.restock_requests ADD COLUMN IF NOT EXISTS offer_discount numeric DEFAULT 0;
ALTER TABLE public.restock_requests ADD COLUMN IF NOT EXISTS offer_final_price numeric;
ALTER TABLE public.restock_requests ADD COLUMN IF NOT EXISTS estimated_time text;
ALTER TABLE public.restock_requests ADD COLUMN IF NOT EXISTS provider_notes text;
ALTER TABLE public.restock_requests ADD COLUMN IF NOT EXISTS provider_name text;

-- Allow users to update their own bookings (accept/reject offers)
CREATE POLICY "Users can update their own bookings"
ON public.blood_test_bookings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own restock requests (accept/reject offers)
CREATE POLICY "Users can update their own restock requests"
ON public.restock_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
