-- Force correct ordering for Novena of São Rafael Arcanjo by Content Matching

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
            
            -- 0. Intro (Starts with 'Inicia-se')
            UPDATE day_content_blocks SET sort_order = 0 
            WHERE novena_day_id = v_day_record.id AND content LIKE 'Inicia-se%';

            -- 1. Bible (Type 'quote' AND Starts with 'Tobias')
            UPDATE day_content_blocks SET sort_order = 1 
            WHERE novena_day_id = v_day_record.id AND block_type = 'quote' AND content LIKE 'Tobias%';

            -- 2. Opening Prayer (Starts with 'Ó Deus')
            UPDATE day_content_blocks SET sort_order = 2 
            WHERE novena_day_id = v_day_record.id AND content LIKE 'Ó Deus%';

            -- 3. Daily Prayer (Starts with 'Oh! Glorioso' - check for specific text to distinguish from invocation)
            -- Taking a substring to be safe or identifying by exclusion
            UPDATE day_content_blocks SET sort_order = 3 
            WHERE novena_day_id = v_day_record.id 
            AND content LIKE 'Oh! Glorioso Arcanjo São Rafael, que estais presente%';

            -- 4. Intention
            UPDATE day_content_blocks SET sort_order = 4 
            WHERE novena_day_id = v_day_record.id AND block_type = 'intention';

            -- 5. Invocation (Starts with 'Invocação:')
            UPDATE day_content_blocks SET sort_order = 5 
            WHERE novena_day_id = v_day_record.id AND content LIKE 'Invocação:%';

            -- 6. Checklist Marker (Type 'checklist')
            UPDATE day_content_blocks SET sort_order = 6 
            WHERE novena_day_id = v_day_record.id AND block_type = 'checklist';

            -- 7. Litany (Starts with 'Ladainha')
            UPDATE day_content_blocks SET sort_order = 7 
            WHERE novena_day_id = v_day_record.id AND content LIKE 'Ladainha%';

            -- 8. Final Prayer (Starts with 'Oração Final:')
            UPDATE day_content_blocks SET sort_order = 8 
            WHERE novena_day_id = v_day_record.id AND content LIKE 'Oração Final:%';

            -- 9. Footer (Starts with 'Bendito')
            UPDATE day_content_blocks SET sort_order = 9 
            WHERE novena_day_id = v_day_record.id AND content LIKE 'Bendito%';

        END LOOP;
    END IF;
END $$;
