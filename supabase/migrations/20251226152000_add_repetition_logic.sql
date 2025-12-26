-- Migration: Add repetition_count to day_checklist_items and update St Joseph Novena

-- 1. Add repetition_count column
ALTER TABLE public.day_checklist_items 
ADD COLUMN repetition_count integer DEFAULT 1 NOT NULL;

-- 2. Update St Joseph Novena Data
DO $$
DECLARE
  v_novena_id uuid;
  v_day_record record;
BEGIN
  -- Get St Joseph Novena ID
  SELECT id INTO v_novena_id FROM public.novenas WHERE slug = 'novena-a-sao-jose';
  
  IF v_novena_id IS NOT NULL THEN
    -- Loop through all days of this novena
    FOR v_day_record IN SELECT id FROM public.novena_days WHERE novena_id = v_novena_id LOOP
      
      -- Remove the old single checklist item
      DELETE FROM public.day_checklist_items WHERE novena_day_id = v_day_record.id;

      -- Insert the 3 new interactive items
      INSERT INTO public.day_checklist_items (novena_day_id, label, label_pt, sort_order, repetition_count) VALUES
      (v_day_record.id, 'Our Father', 'Sete Pai-Nossos', 1, 7),
      (v_day_record.id, 'Hail Mary', 'Sete Ave-Marias', 2, 7),
      (v_day_record.id, 'Glory Be', 'Sete Glórias', 3, 7);
      
    END LOOP;
  END IF;
END $$;
