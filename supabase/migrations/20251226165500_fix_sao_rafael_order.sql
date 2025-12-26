-- Fix ordering for Novena of São Rafael Arcanjo

-- 1. Update Check Constraint to allow 'checklist' type
ALTER TABLE "day_content_blocks" DROP CONSTRAINT IF EXISTS "day_content_blocks_block_type_check";
ALTER TABLE "day_content_blocks" ADD CONSTRAINT "day_content_blocks_block_type_check" 
    CHECK (block_type IN ('paragraph', 'prayer', 'quote', 'intention', 'checklist'));

-- 2. Reorder blocks and insert Checklist marker
DO $$ 
DECLARE
    v_novena_id uuid;
    v_day_record RECORD;
BEGIN
    -- Get Novena ID
    SELECT id INTO v_novena_id FROM novenas WHERE slug = 'sao-rafael-arcanjo';

    -- If found, proceed
    IF v_novena_id IS NOT NULL THEN
        -- Loop through all days of this novena
        FOR v_day_record IN SELECT id FROM novena_days WHERE novena_id = v_novena_id LOOP
            
            -- Shift existing blocks down (from 6 upwards)
            UPDATE day_content_blocks 
            SET sort_order = sort_order + 1
            WHERE novena_day_id = v_day_record.id 
            AND sort_order >= 6;

            -- Insert the Checklist Marker at position 6
            INSERT INTO day_content_blocks (novena_day_id, sort_order, block_type, content)
            VALUES (v_day_record.id, 6, 'checklist', 'Checklist Marker');

        END LOOP;
    END IF;
END $$;
