-- Insert default admin user
INSERT INTO public.admin_users (email, name, is_active) 
VALUES ('admin@company.com', 'System Administrator', true)
ON CONFLICT (email) DO NOTHING;

-- Insert sample admin users
INSERT INTO public.admin_users (email, name, is_active) 
VALUES 
  ('logistics@company.com', 'Logistics Manager', true),
  ('operations@company.com', 'Operations Manager', true)
ON CONFLICT (email) DO NOTHING;
