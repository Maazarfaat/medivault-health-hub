-- 1. Alter user_role enum to add 'doctor'
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'doctor';

-- 2. Create doctors table
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hospital_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  doctor_id TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL,
  specialization TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. Create doctor patient assignments table
CREATE TABLE IF NOT EXISTS public.doctor_patient_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assigned_date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  diagnosis TEXT,
  doctor_notes TEXT,
  status TEXT DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (doctor_id, patient_id)
);

-- 4. Create AI report analyses table
CREATE TABLE IF NOT EXISTS public.ai_report_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  extracted_text TEXT,
  patient_details JSONB,
  summary TEXT NOT NULL,
  normal_values JSONB,
  abnormal_values JSONB,
  critical_values JSONB,
  explanation TEXT,
  observations TEXT,
  recommendations TEXT,
  suggested_tests TEXT,
  doctor_notes TEXT,
  health_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 5. Create medicine logs table for tracking daily consumption timeline
CREATE TABLE IF NOT EXISTS public.medicine_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  medicine_id UUID REFERENCES public.user_medicines(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL, -- 'taken', 'skipped', 'missed'
  notes TEXT,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 6. Enable RLS on all new tables
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_patient_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_report_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_logs ENABLE ROW LEVEL SECURITY;

-- 7. Policies
-- Doctors policies
CREATE POLICY "Hospitals can manage their own doctors" ON public.doctors
  FOR ALL USING (auth.uid() = hospital_id);
CREATE POLICY "Doctors can read their own details" ON public.doctors
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Public read for doctors" ON public.doctors
  FOR SELECT TO authenticated USING (true);

-- Assignments policies
CREATE POLICY "Hospitals can manage assignments" ON public.doctor_patient_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE d.id = doctor_patient_assignments.doctor_id
        AND d.hospital_id = auth.uid()
    )
  );
CREATE POLICY "Doctors can view their assignments" ON public.doctor_patient_assignments
  FOR SELECT USING (auth.uid() = doctor_id);
CREATE POLICY "Patients can view their assignments" ON public.doctor_patient_assignments
  FOR SELECT USING (auth.uid() = patient_id);

-- AI Report Analyses policies
CREATE POLICY "Patients can view their own report analyses" ON public.ai_report_analyses
  FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Doctors can view/manage analyses for their patients" ON public.ai_report_analyses
  FOR ALL USING (
    auth.uid() = doctor_id OR
    EXISTS (
      SELECT 1 FROM public.doctor_patient_assignments a
      WHERE a.doctor_id = auth.uid()
        AND a.patient_id = ai_report_analyses.patient_id
    )
  );
CREATE POLICY "Patients can insert their own reports" ON public.ai_report_analyses
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

-- Medicine logs policies
CREATE POLICY "Users can manage their own medicine logs" ON public.medicine_logs
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Doctors can view logs of their patients" ON public.medicine_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.doctor_patient_assignments a
      WHERE a.doctor_id = auth.uid()
        AND a.patient_id = medicine_logs.user_id
    )
  );

-- 8. SECURITY DEFINER function to reset password as Admin
CREATE OR REPLACE FUNCTION public.admin_reset_doctor_password(_doctor_id uuid, _new_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Verify the executor is the hospital admin for this doctor
  IF NOT EXISTS (
    SELECT 1 FROM public.doctors d
    WHERE d.id = _doctor_id AND d.hospital_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Update auth.users password
  UPDATE auth.users
  SET encrypted_password = crypt(_new_password, gen_salt('bf'))
  WHERE id = _doctor_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_reset_doctor_password(uuid, text) TO authenticated;
