-- Fix function search path issue using CREATE OR REPLACE
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Enable RLS on certifications table and create policies
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read certifications (public data)
CREATE POLICY "Anyone can view certifications"
  ON public.certifications FOR SELECT
  USING (true);