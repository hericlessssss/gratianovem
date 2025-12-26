-- Fix increment function to handle NULLs and bypass RLS
CREATE OR REPLACE FUNCTION increment_testimonial_likes(row_id UUID, increment BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF increment THEN
    UPDATE testimonials
    SET likes_count = COALESCE(likes_count, 0) + 1
    WHERE id = row_id;
  ELSE
    UPDATE testimonials
    SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1)
    WHERE id = row_id;
  END IF;
END;
$$;
