-- Create Novena of Santo Agostinho

DO $$ 
DECLARE
    v_novena_id uuid;
    v_day_id uuid;
    v_day_num integer;
    v_quote text;
    v_meditation text;
BEGIN
    -- 1. Insert Novena
    INSERT INTO novenas (title, description, slug, duration)
    VALUES (
        'Novena a Santo Agostinho', 
        'Agostinho nasceu em Tagaste, na África do Norte, em 354. Tendo a princípio escutado docilmente sua mãe, Santa Mônica, em breve se deixou arrastar para as mais graves desordens... Recuperado pela graça e pelas lágrimas de sua mãe, tornou-se um dos maiores Santos e Doutores da Igreja. Padroeiro dos teólogos, sua vida é um testemunho ardente de que "nosso coração está inquieto enquanto não repousa em Deus".', 
        'santo-agostinho', 
        9
    )
    RETURNING id INTO v_novena_id;

    -- 2. Loop for 9 Days
    FOR v_day_num IN 1..9 LOOP
        -- Insert Day
        INSERT INTO novena_days (novena_id, day_number, title)
        VALUES (v_novena_id, v_day_num, 'Dia ' || v_day_num)
        RETURNING id INTO v_day_id;

        -- Determine Daily Content (Quote and Meditation)
        CASE v_day_num
            WHEN 1 THEN
                v_quote := '“Fizeste-nos para Vós, Senhor, e o nosso coração está inquieto, enquanto não repousar em Vós.”';
                v_meditation := 'Essa célebre frase, talvez a mais conhecida de Santo Agostinho, é a que abre seu principal livro, as Confissões. Toda a vida do santo Bispo de Hipona poderia ser resumida por ela. Depois de trinta anos vivendo uma vida de contínuas inquietações, experimentou a vida sensual em suas variadas formas, adentrou em seitas e filosofias, mas só encontrou a paz para a sua alma e o sossego para o seu coração ao conhecer o catolicismo e entregar a sua vida a Deus.' || chr(10) || chr(10) || 'O homem é um peregrino nesta Terra, e a única coisa que realmente pode saciar a sua sede é o encontro com Deus. Como o cervo que anseia pelas águas correntes, também a alma anseia por Deus.';
            WHEN 2 THEN
                v_quote := '“Ama, e faze o que queres! Se emudeces, emudece por amor; se gritas, grita por amor; se repreendes, repreende por amor; se perdoas, perdoa por amor.”';
                v_meditation := 'Apesar de ter sido um grande Doutor da Igreja, um intelectual de vasto conhecimento, São Agostinho nos ensina com simplicidade a amar a Deus e ao próximo com a vida, sem grandes filosofias. O amor é o princípio, o meio e o fim de nossa existência. É por amor que devemos fazer tudo. O amor tudo sustenta e tudo perdoa. O amor nos capacita a suportar os sofrimentos, as injustiças, e até as perseguições, transformando tudo em mérito para a vida eterna. Não existe amor sem sacrifício, nem sacrifício sem amor.';
            WHEN 3 THEN
                v_quote := '“Deus não pode estar em ti, porque já estás repleto de ti.”';
                v_meditation := 'O orgulho e a vaidade são o principal obstáculo ao conhecimento de Deus. O homem que se considera autossuficiente e dotado de toda a sabedoria não encontra lugar para Deus em seu coração. Deus, em sua infinita sabedoria, se revela aos pequenos e humildes, enquanto esconde seus mistérios dos arrogantes. Quantas pessoas, por se considerarem sábias, ignoram a verdade revelada por Deus? A humildade é a porta de entrada para a sabedoria divina. Não se pode alcançar a glória celestial sem o reconhecimento da própria limitação e a dependência da graça divina. Que esta novena nos ajude a esvaziar-nos de nós mesmos para que Deus possa nos preencher.';
            WHEN 4 THEN
                v_quote := '“Quem te criou sem ti, não te salvará sem ti.”';
                v_meditation := 'A graça de Deus é fundamental para a nossa salvação, mas a nossa colaboração é igualmente necessária. Deus nos deu o livre-arbítrio e espera que usemos nossa liberdade para escolher o bem e corresponder à sua graça. Não somos meros espectadores na nossa própria salvação, mas colaboradores de Deus. A fé sem obras é morta, assim como a oração sem esforço de nossa parte não trará frutos. A salvação é um dom gratuito de Deus, mas exige nossa resposta ativa e perseverante.';
            WHEN 5 THEN
                v_quote := '“Deus não nos ouve, ou por pedirmos mal, ou por pedirmos coisas ruins. Em latim: aut male, aut mala.”';
                v_meditation := 'Em sua sabedoria, Santo Agostinho nos lembra que a oração é um diálogo com Deus, e que nossa comunicação deve ser feita com pureza de intenção e discernimento. Muitas vezes, nossas preces não são atendidas porque pedimos coisas que não contribuem para a nossa salvação ou porque as pedimos de forma inadequada. Deus, em sua infinita bondade, sabe o que é melhor para nós e nos concede as graças que realmente precisamos, mesmo que não sejam as que esperamos. Devemos rezar com humildade, fé e perseverança, confiando na Providência divina. Não devemos nos desesperar se as coisas não acontecem como queremos, pois Deus tem um plano maior para nós.';
            WHEN 6 THEN
                v_quote := '“Dai-me a força de vos buscar, Vós que permitistes serdes encontrado e me cumulastes de esperança de vos encontrar sempre mais. Minha força e minha fraqueza estão diante de Vós, conservai a primeira, curai a segunda.”';
                v_meditation := 'Santo Agostinho nos mostra a profunda dependência do homem em relação a Deus. Reconhecer nossa fragilidade e fraqueza é o primeiro passo para nos abrirmos à graça divina. Somente com a força que vem de Deus podemos perseverar na fé, vencer as tentações e trilhar o caminho da santidade. A oração é o meio pelo qual buscamos essa força, e a certeza de que Deus nos ouvirá deve nos encher de esperança. Não é nossa própria força que nos levará ao Céu, mas a graça de Deus, que nos sustenta e nos cura.';
            WHEN 7 THEN
                v_quote := '“Estes são vossos servos, meus irmãos, que quisestes que fossem filhos vossos e meus senhores, a quem me ordenastes servir, se convosco quiser viver.”';
                v_meditation := '“Na oração afastemo-nos, portanto, do muito falar, mas não deixemos de muito suplicar, enquanto perseverar o fervor da intenção. Pois o muito falar é fazer uma coisa necessária com palavras supérfluas. Mas o muito suplicar é incitar-nos, por longos e piedosos desejos do coração, Àquele a quem rezamos. Geralmente, isso se faz mais com gemidos do que com discursos, mais com lágrimas do que com palavras.”';
            WHEN 8 THEN
                v_quote := '“Enquanto viveres é impossível que se perca o filho dessas lágrimas.”';
                v_meditation := 'Santo Agostinho finalmente recebeu o batismo na Páscoa de 387, e as lágrimas da piedosa mãe se transformaram em lágrimas de alegria. Algum tempo depois, quando chegaram juntos a Óstia com a intenção de retornarem à África, Mônica e seu filho conversavam sobre as promessas da vida eterna, e ela lhe disse: “Meu filho, quanto a mim, já nenhuma coisa me atrai nesta vida. O que farei e porque estou aqui, eu ignoro; já se consumiu minha esperança neste mundo. Só havia uma coisa que me fazia desejar continuar aqui um pouco mais: ver-te cristão católico antes de morrer. Meu Deus concedeu-me amplamente essa mercê, porque te vejo desprezar as felicidades terrenas para melhor servi-lo. Que estou a fazer aqui?”. Cinco dias depois, doente com febre, descansou no Senhor.';
            WHEN 9 THEN
                v_quote := '“Era a Vós que eu procurava. E Vós estáveis dentro da parte mais profunda e acima da parte mais alta do meu ser.”';
                v_meditation := '“Tarde vos amei, beleza tão antiga e tão nova, tarde vos amei! Eis que Vós estáveis dentro, e eu fora. Lá vos procurava. Deformado, lancei-me sobre as belas coisas que criastes. Vós estáveis comigo, e eu não estava convosco. Me mantiveram longe de Vós, essas coisas que, se não existissem em Vós, não existiriam.”';
        END CASE;

        -- Insert Content Blocks
        
        -- Block 0: Intro Prayer
        INSERT INTO day_content_blocks (novena_day_id, sort_order, block_type, content)
        VALUES (v_day_id, 0, 'prayer', 'Oração Inicial:\n\nPeregrino e enfermo, volto a Vós, Deus meu, cansado de peregrinar fora de Vós, e agoniado pelo grave peso de meus males. Vi, experimentei: fora de Vós não há abrigo, nem fartura, nem descanso, nem bem algum que sacie os desejos da alma que criastes.' || chr(10) || chr(10) || 'Pai-Nosso; Ave-Maria; Glória ao Pai.');

        -- Block 1: Litany
        INSERT INTO day_content_blocks (novena_day_id, sort_order, block_type, content)
        VALUES (v_day_id, 1, 'prayer', 'Ladainha de Santo Agostinho:\n\nSenhor, tende piedade de nós. Senhor, tende piedade de nós.\nCristo, tende piedade de nós. Cristo, tende piedade de nós.\nSenhor, tende piedade de nós. Senhor, tende piedade de nós.\nJesus Cristo, ouvi-nos. Jesus Cristo, ouvi-nos.\nJesus Cristo, atendei-nos. Jesus Cristo, atendei-nos.\nDeus, Pai do Céu, tende piedade de nós.\nFilho, Redentor do mundo, tende piedade de nós.\nDeus, Espírito Santo, tende piedade de nós.\nSantíssima Trindade, Único Deus, tende piedade de nós.\n\nSanta Maria, rogai por nós.\nSanta Mãe de Deus, rogai por nós.\nSanta Virgem das virgens, rogai por nós.\nSanto Agostinho, Doutor da Igreja, rogai por nós.\nSanto Agostinho, filho das lágrimas de Santa Mônica, rogai por nós.\nSanto Agostinho, luz dos que ensinam, rogai por nós.\nSanto Agostinho, debelador das heresias, rogai por nós.\nSanto Agostinho, ilustre guerreiro contra os erros, rogai por nós.\nSanto Agostinho, fonte inesgotável de eloquência cristã, rogai por nós.\nSanto Agostinho, brilhante espelho da santidade, rogai por nós.\nSanto Agostinho, modelo de todas as virtudes, rogai por nós.\n\nCordeiro de Deus, que tirais os pecados do mundo, perdoai-nos, Senhor.\nCordeiro de Deus, que tirais os pecados do mundo, ouvi-nos, Senhor.\nCordeiro de Deus, que tirais os pecados do mundo, tende piedade de nós.\nÓ Cristo, ouvi-nos! Ó Cristo, atendei-nos!');

        -- Block 2: Quote of the Day
        INSERT INTO day_content_blocks (novena_day_id, sort_order, block_type, content)
        VALUES (v_day_id, 2, 'quote', v_quote);

        -- Block 3: Meditation
        INSERT INTO day_content_blocks (novena_day_id, sort_order, block_type, content)
        VALUES (v_day_id, 3, 'paragraph', 'Meditação:\n\n' || v_meditation);

        -- Block 4: Final Prayer
        INSERT INTO day_content_blocks (novena_day_id, sort_order, block_type, content)
        VALUES (v_day_id, 4, 'prayer', 'Oração Final:\n\nÓ Deus, que iluminastes o vosso Bispo Santo Agostinho com a luz da vossa graça, para que ele buscasse ardorosamente a Vossa sabedoria e a encontrasse; iluminai também os nossos corações com a Vossa luz, para que sempre Vos procuremos e Vos amemos sobre todas as coisas. Por Cristo Nosso Senhor. Amém.');

         -- Block 5: Checklist Marker
        INSERT INTO day_content_blocks (novena_day_id, sort_order, block_type, content)
        VALUES (v_day_id, 5, 'checklist', 'Checklist do Dia');

        -- Insert Checklist Items
        INSERT INTO day_checklist_items (novena_day_id, label, repetition_count)
        VALUES (v_day_id, 'Rezar Pai-Nosso, Ave-Maria e Glória', 1);

    END LOOP;
END $$;
