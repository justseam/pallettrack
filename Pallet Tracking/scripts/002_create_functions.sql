-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_admin_users_updated_at 
  BEFORE UPDATE ON public.admin_users 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deliveries_updated_at 
  BEFORE UPDATE ON public.deliveries 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get active admin emails
CREATE OR REPLACE FUNCTION public.get_active_admin_emails()
RETURNS TEXT[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT email 
    FROM public.admin_users 
    WHERE is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
