-- Add description column to novenas table
ALTER TABLE public.novenas 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Update RLS policies to allow public read of description (already covered by existing strict policies usually, but good to verify if specific columns were restricted, which they usually aren't in simple RLS)
-- Existing policies usually cover "all columns" so no action needed on policies unless column security is active.
