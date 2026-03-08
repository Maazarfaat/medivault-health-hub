-- Create enum types
CREATE TYPE public.user_role AS ENUM ('user', 'pharmacy', 'hospital', 'bloodTestCentre');
CREATE TYPE public.medicine_status AS ENUM ('safe', 'expiring', 'expired');
CREATE TYPE public.add_method AS ENUM ('pharmacy', 'csv', 'scan', 'manual');
CREATE TYPE public.restock_status AS ENUM ('pending', 'accepted', 'rejected', 'fulfilled');
CREATE TYPE public.booking_status AS ENUM ('pending', 'accepted', 'completed');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile_number TEXT,
  mobile_verified BOOLEAN DEFAULT false,
  profile_completion INTEGER DEFAULT 0,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Create user_medicines table
CREATE TABLE public.user_medicines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  batch_number TEXT,
  expiry_date DATE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  added_method add_method NOT NULL DEFAULT 'manual',
  dosage TEXT,
  prescribed_doses INTEGER,
  doses_taken INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pharmacy_inventory table
CREATE TABLE public.pharmacy_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  batch_number TEXT,
  expiry_date DATE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sales_records table
CREATE TABLE public.sales_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  customer_mobile TEXT NOT NULL,
  customer_id UUID REFERENCES auth.users(id),
  medicine_name TEXT NOT NULL,
  batch_number TEXT,
  expiry_date DATE,
  quantity INTEGER NOT NULL,
  sale_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create restock_requests table
CREATE TABLE public.restock_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  medicine_name TEXT NOT NULL,
  requested_quantity INTEGER NOT NULL,
  status restock_status NOT NULL DEFAULT 'pending',
  pharmacy_id UUID REFERENCES auth.users(id),
  request_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create hospital_inventory table
CREATE TABLE public.hospital_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  batch_number TEXT,
  expiry_date DATE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blood_test_bookings table
CREATE TABLE public.blood_test_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  centre_id UUID REFERENCES auth.users(id),
  test_type TEXT NOT NULL,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create csv_uploads table for tracking
CREATE TABLE public.csv_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_records INTEGER NOT NULL DEFAULT 0,
  processed_records INTEGER NOT NULL DEFAULT 0,
  error_records INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restock_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_test_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csv_uploads ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Get user role function
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view their own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own role" ON public.user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User medicines policies
CREATE POLICY "Users can view their own medicines" ON public.user_medicines
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own medicines" ON public.user_medicines
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own medicines" ON public.user_medicines
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own medicines" ON public.user_medicines
  FOR DELETE USING (auth.uid() = user_id);
-- Pharmacies can add medicines to users via sales
CREATE POLICY "Pharmacies can insert medicines for users" ON public.user_medicines
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'pharmacy'));

-- Pharmacy inventory policies
CREATE POLICY "Pharmacies can view their own inventory" ON public.pharmacy_inventory
  FOR SELECT USING (auth.uid() = pharmacy_id);
CREATE POLICY "Pharmacies can insert their own inventory" ON public.pharmacy_inventory
  FOR INSERT WITH CHECK (auth.uid() = pharmacy_id);
CREATE POLICY "Pharmacies can update their own inventory" ON public.pharmacy_inventory
  FOR UPDATE USING (auth.uid() = pharmacy_id);
CREATE POLICY "Pharmacies can delete their own inventory" ON public.pharmacy_inventory
  FOR DELETE USING (auth.uid() = pharmacy_id);

-- Sales records policies
CREATE POLICY "Pharmacies can view their own sales" ON public.sales_records
  FOR SELECT USING (auth.uid() = pharmacy_id);
CREATE POLICY "Pharmacies can insert sales" ON public.sales_records
  FOR INSERT WITH CHECK (auth.uid() = pharmacy_id);

-- Restock requests policies
CREATE POLICY "Users can view their own restock requests" ON public.restock_requests
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create restock requests" ON public.restock_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Pharmacies can view all pending restock requests" ON public.restock_requests
  FOR SELECT USING (public.has_role(auth.uid(), 'pharmacy'));
CREATE POLICY "Pharmacies can update restock requests" ON public.restock_requests
  FOR UPDATE USING (public.has_role(auth.uid(), 'pharmacy'));

-- Hospital inventory policies
CREATE POLICY "Hospitals can view their own inventory" ON public.hospital_inventory
  FOR SELECT USING (auth.uid() = hospital_id);
CREATE POLICY "Hospitals can insert their own inventory" ON public.hospital_inventory
  FOR INSERT WITH CHECK (auth.uid() = hospital_id);
CREATE POLICY "Hospitals can update their own inventory" ON public.hospital_inventory
  FOR UPDATE USING (auth.uid() = hospital_id);
CREATE POLICY "Hospitals can delete their own inventory" ON public.hospital_inventory
  FOR DELETE USING (auth.uid() = hospital_id);

-- Blood test bookings policies
CREATE POLICY "Users can view their own bookings" ON public.blood_test_bookings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create bookings" ON public.blood_test_bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Blood test centres can view all bookings" ON public.blood_test_bookings
  FOR SELECT USING (public.has_role(auth.uid(), 'bloodTestCentre'));
CREATE POLICY "Blood test centres can update bookings" ON public.blood_test_bookings
  FOR UPDATE USING (public.has_role(auth.uid(), 'bloodTestCentre'));

-- CSV uploads policies
CREATE POLICY "Pharmacies can view their own uploads" ON public.csv_uploads
  FOR SELECT USING (auth.uid() = pharmacy_id);
CREATE POLICY "Pharmacies can insert uploads" ON public.csv_uploads
  FOR INSERT WITH CHECK (auth.uid() = pharmacy_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_medicines_updated_at BEFORE UPDATE ON public.user_medicines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pharmacy_inventory_updated_at BEFORE UPDATE ON public.pharmacy_inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_restock_requests_updated_at BEFORE UPDATE ON public.restock_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_hospital_inventory_updated_at BEFORE UPDATE ON public.hospital_inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_blood_test_bookings_updated_at BEFORE UPDATE ON public.blood_test_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-create profile and role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to find user by mobile number
CREATE OR REPLACE FUNCTION public.find_user_by_mobile(_mobile text)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id FROM public.profiles WHERE mobile_number = _mobile LIMIT 1
$$;