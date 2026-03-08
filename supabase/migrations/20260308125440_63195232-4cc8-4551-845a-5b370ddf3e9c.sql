
-- Add 'delivered' to restock_status enum
ALTER TYPE public.restock_status ADD VALUE IF NOT EXISTS 'delivered' AFTER 'processing';

-- Add report_url and report_notes columns to blood_test_bookings
ALTER TABLE public.blood_test_bookings ADD COLUMN IF NOT EXISTS report_url TEXT;
ALTER TABLE public.blood_test_bookings ADD COLUMN IF NOT EXISTS report_notes TEXT;

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider_id UUID NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('pharmacy', 'bloodTestCentre')),
  request_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own reviews" ON public.reviews FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Providers can view reviews about them" ON public.reviews FOR SELECT TO authenticated USING (auth.uid() = provider_id);

-- Create storage bucket for test reports
INSERT INTO storage.buckets (id, name, public) VALUES ('test-reports', 'test-reports', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies for test reports
CREATE POLICY "Diagnostic centres can upload reports" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'test-reports');
CREATE POLICY "Anyone can view reports" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'test-reports');
