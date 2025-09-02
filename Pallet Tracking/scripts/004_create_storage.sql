-- Create storage bucket for delivery photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('delivery-photos', 'delivery-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for public access
CREATE POLICY "Allow public uploads to delivery-photos bucket" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'delivery-photos');

CREATE POLICY "Allow public access to delivery-photos bucket" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'delivery-photos');

CREATE POLICY "Allow public updates to delivery-photos bucket" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'delivery-photos');

CREATE POLICY "Allow public deletes from delivery-photos bucket" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'delivery-photos');
