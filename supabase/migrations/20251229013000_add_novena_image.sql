-- Add image_url column to novenas table
ALTER TABLE public.novenas 
ADD COLUMN IF NOT EXISTS image_url TEXT;
