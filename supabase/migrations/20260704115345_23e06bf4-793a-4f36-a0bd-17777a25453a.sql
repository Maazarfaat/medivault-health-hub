
-- 1. Role escalation
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;

-- 2. Blood test bookings scoped for centres
DROP POLICY IF EXISTS "Blood test centres can view all bookings" ON public.blood_test_bookings;
DROP POLICY IF EXISTS "Blood test centres can update bookings" ON public.blood_test_bookings;

CREATE POLICY "Centres view assigned or unclaimed pending bookings"
ON public.blood_test_bookings
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'bloodTestCentre'::user_role)
  AND (centre_id = auth.uid() OR (centre_id IS NULL AND status = 'pending'))
);

CREATE POLICY "Centres update assigned or claim pending bookings"
ON public.blood_test_bookings
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'bloodTestCentre'::user_role)
  AND (centre_id = auth.uid() OR (centre_id IS NULL AND status = 'pending'))
)
WITH CHECK (
  public.has_role(auth.uid(), 'bloodTestCentre'::user_role)
  AND centre_id = auth.uid()
);

-- 3. Restock requests scoped for pharmacies
DROP POLICY IF EXISTS "Pharmacies can view all pending restock requests" ON public.restock_requests;
DROP POLICY IF EXISTS "Pharmacies can update restock requests" ON public.restock_requests;

CREATE POLICY "Pharmacies view assigned or unclaimed pending requests"
ON public.restock_requests
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'pharmacy'::user_role)
  AND (pharmacy_id = auth.uid() OR (pharmacy_id IS NULL AND status = 'pending'))
);

CREATE POLICY "Pharmacies update assigned or claim pending requests"
ON public.restock_requests
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'pharmacy'::user_role)
  AND (pharmacy_id = auth.uid() OR (pharmacy_id IS NULL AND status = 'pending'))
)
WITH CHECK (
  public.has_role(auth.uid(), 'pharmacy'::user_role)
  AND pharmacy_id = auth.uid()
);

-- 4. Profiles: providers only see users they have an active relationship with
DROP POLICY IF EXISTS "Blood test centres can view user profiles" ON public.profiles;
DROP POLICY IF EXISTS "Pharmacies can view user profiles for restocks" ON public.profiles;

CREATE POLICY "Centres view profiles of their bookings"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'bloodTestCentre'::user_role)
  AND EXISTS (
    SELECT 1 FROM public.blood_test_bookings b
    WHERE b.user_id = profiles.user_id
      AND (b.centre_id = auth.uid() OR (b.centre_id IS NULL AND b.status = 'pending'))
  )
);

CREATE POLICY "Pharmacies view profiles of their restocks"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'pharmacy'::user_role)
  AND EXISTS (
    SELECT 1 FROM public.restock_requests r
    WHERE r.user_id = profiles.user_id
      AND (r.pharmacy_id = auth.uid() OR (r.pharmacy_id IS NULL AND r.status = 'pending'))
  )
);

-- 5. Test report storage: ownership-scoped policies (bucket flipped to private via storage tool)
DROP POLICY IF EXISTS "Anyone can view reports" ON storage.objects;
DROP POLICY IF EXISTS "Diagnostic centres can upload reports" ON storage.objects;

CREATE POLICY "Centres can upload test reports"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'test-reports'
  AND public.has_role(auth.uid(), 'bloodTestCentre'::user_role)
);

CREATE POLICY "Uploaders manage their own report files"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'test-reports' AND owner = auth.uid())
WITH CHECK (bucket_id = 'test-reports' AND owner = auth.uid());

CREATE POLICY "Patients view reports for their own bookings"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'test-reports'
  AND EXISTS (
    SELECT 1 FROM public.blood_test_bookings b
    WHERE b.user_id = auth.uid()
      AND b.report_url IS NOT NULL
      AND b.report_url LIKE '%' || storage.objects.name
  )
);

-- 6. Lock down SECURITY DEFINER function EXECUTE
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, user_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.find_user_by_mobile(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_user_by_mobile(text) TO authenticated;
