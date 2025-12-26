-- Force correct ordering for Novena of São Rafael Arcanjo ROBUSTLY

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
            
            -- 0. Intro 
            UPDATE day_content_blocks SET sort_order = 0 
            WHERE novena_day_id = v_day_record.id AND content ILIKE '%Inicia-se%';

            -- 1. Bible 
            UPDATE day_content_blocks SET sort_order = 1 
            WHERE novena_day_id = v_day_record.id AND block_type = 'quote' AND content ILIKE '%Tobias%';

            -- 2. Opening Prayer
            UPDATE day_content_blocks SET sort_order = 2 
            WHERE novena_day_id = v_day_record.id AND content ILIKE '%efável bondade%';

            -- 3. Daily Prayer
            UPDATE day_content_blocks SET sort_order = 3 
            WHERE novena_day_id = v_day_record.id 
            AND content ILIKE '%indigno devoto%';

            -- 4. Intention
            UPDATE day_content_blocks SET sort_order = 4 
            WHERE novena_day_id = v_day_record.id AND block_type = 'intention';

            -- 5. Invocation
            UPDATE day_content_blocks SET sort_order = 5 
            WHERE novena_day_id = v_day_record.id AND content ILIKE '%Invocação%';

            -- 6. Checklist Marker (Type 'checklist')
            UPDATE day_content_blocks SET sort_order = 6 
            WHERE novena_day_id = v_day_record.id AND block_type = 'checklist';

            -- 7. Litany (Ladainha)
            UPDATE day_content_blocks SET sort_order = 7 
            WHERE novena_day_id = v_day_record.id AND content ILIKE '%Ladainha%';

            -- 8. Final Prayer (Oração Final)
            UPDATE day_content_blocks SET sort_order = 8 
            WHERE novena_day_id = v_day_record.id AND content ILIKE '%Oração Final%';

            -- 9. Footer
            UPDATE day_content_blocks SET sort_order = 9 
            WHERE novena_day_id = v_day_record.id AND content ILIKE '%Bendito%';

        END LOOP;
    END IF;
END $$;
