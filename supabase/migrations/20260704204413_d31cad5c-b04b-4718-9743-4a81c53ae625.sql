
-- Convert helper functions from SECURITY DEFINER to SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY INVOKER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS user_role
LANGUAGE sql
STABLE SECURITY INVOKER
SET search_path TO 'public'
AS $function$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$function$;

CREATE OR REPLACE FUNCTION public.find_user_by_mobile(_mobile text)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY INVOKER
SET search_path TO 'public'
AS $function$
  SELECT user_id FROM public.profiles WHERE mobile_number = _mobile LIMIT 1
$function$;

-- Allow pharmacies to look up customer profiles by mobile number
-- (needed for sell / CSV import flows that resolve a customer from their mobile)
DROP POLICY IF EXISTS "Pharmacies can lookup customer profiles" ON public.profiles;
CREATE POLICY "Pharmacies can lookup customer profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'pharmacy'::user_role));
