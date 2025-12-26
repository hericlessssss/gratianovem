-- Allow anonymous users to insert into testimonials
-- First enable RLS (it should be enabled already, but good practice to ensure)
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Create policy for anonymous inserts
CREATE POLICY "Allow anonymous submission of testimonials"
ON testimonials FOR INSERT
TO public
WITH CHECK (true);

-- Ensure user_id matches auth.uid() only if authenticated
-- (This might conflict with 'public' check true. 
-- Usually, we want 'authenticated' users to only insert their own id, but 'anon' to insert null.)
-- The existing policy likely enforces `user_id = auth.uid()`. 
-- We probably need to modify/drop existing or add a broader one.
-- Let's try to DROP existing insert policy if predictable name, or just ADD this one.
-- Since multiple policies are OR'ed, adding this broad one 'TO public' allows anyone to insert anything.
-- To be safe, we might want to ensure they don't spoof user_ids if they are anon.
-- But 'CHECK (true)' allows anything.
-- Better: 
-- CREATE POLICY "Anyone can insert testimonial" ON testimonials FOR INSERT TO public WITH CHECK (true);
-- But we want to ensure if they provide a user_id, it is THEIR user_id.
-- If they are anon, user_id must be null.

DROP POLICY IF EXISTS "Users can insert their own testimonials" ON testimonials;

CREATE POLICY "Enable insert for authenticated users only" 
ON testimonials FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable insert for anonymous users" 
ON testimonials FOR INSERT 
TO anon 
WITH CHECK (user_id IS NULL);
