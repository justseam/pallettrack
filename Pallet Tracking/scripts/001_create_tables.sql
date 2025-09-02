-- Create admin users table for managing email notifications
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create deliveries table for tracking pallet deliveries
CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_name TEXT NOT NULL,
  driver_phone TEXT,
  driver_email TEXT,
  company_name TEXT,
  pickup_location TEXT NOT NULL,
  delivery_location TEXT,
  pallet_count INTEGER NOT NULL DEFAULT 0,
  bill_of_lading_url TEXT,
  signature_url TEXT,
  chat_responses JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed')),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create delivery photos table for Bill of Lading images
CREATE TABLE IF NOT EXISTS public.delivery_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type TEXT DEFAULT 'bill_of_lading' CHECK (photo_type IN ('bill_of_lading', 'signature', 'other')),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_users (only authenticated users can manage)
CREATE POLICY "Allow authenticated users to view admin_users" 
  ON public.admin_users FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to manage admin_users" 
  ON public.admin_users FOR ALL 
  USING (auth.uid() IS NOT NULL);

-- RLS Policies for deliveries (public read/write for driver interface)
CREATE POLICY "Allow public to create deliveries" 
  ON public.deliveries FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public to view deliveries" 
  ON public.deliveries FOR SELECT 
  USING (true);

CREATE POLICY "Allow public to update deliveries" 
  ON public.deliveries FOR UPDATE 
  USING (true);

CREATE POLICY "Allow authenticated users to delete deliveries" 
  ON public.deliveries FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- RLS Policies for delivery_photos (public read/write for driver interface)
CREATE POLICY "Allow public to create delivery_photos" 
  ON public.delivery_photos FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public to view delivery_photos" 
  ON public.delivery_photos FOR SELECT 
  USING (true);

CREATE POLICY "Allow authenticated users to manage delivery_photos" 
  ON public.delivery_photos FOR ALL 
  USING (auth.uid() IS NOT NULL);
