-- Add likes_count column
ALTER TABLE testimonials ADD COLUMN likes_count INTEGER DEFAULT 0;

-- Create function to increment/decrement likes
CREATE OR REPLACE FUNCTION increment_testimonial_likes(row_id UUID, increment BOOLEAN)
RETURNS VOID AS $$
BEGIN
  IF increment THEN
    UPDATE testimonials
    SET likes_count = likes_count + 1
    WHERE id = row_id;
  ELSE
    UPDATE testimonials
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = row_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
