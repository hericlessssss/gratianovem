-- Create Novena of São Rafael Arcanjo

DO $$ 
DECLARE
    v_novena_id uuid;
    v_day_id uuid;
    v_day_num integer;
BEGIN
    -- 1. Insert Novena
    INSERT INTO novenas (title, description, slug, duration)
    VALUES (
        'Novena a São Rafael Arcanjo', 
        'Poderosa novena para cura de doenças e para encontrar um bom matrimônio, pedindo a intercessão do Arcanjo que guiou Tobias.', 
        'sao-rafael-arcanjo', 
        9
    )
    RETURNING id INTO v_novena_id;

    -- 2. Loop for 9 Days
    FOR v_day_num IN 1..9 LOOP
        -- Insert Day
        INSERT INTO novena_days (novena_id, day_number, title)
        VALUES (v_novena_id, v_day_num, 'Dia ' || v_day_num)
        RETURNING id INTO v_day_id;

        -- Insert Content Blocks

        -- Block 1: Intro / Bible Reading Title
        INSERT INTO day_content_blocks (novena_day_id, sort_order, block_type, content)
        VALUES (v_day_id, 0, 'paragraph', 'Inicia-se com a leitura do livro de Tobias 9:1-7:');

        -- Block 2: Bible Text (Tobias 9:1-7)
        INSERT INTO day_content_blocks (novena_day_id, sort_order, block_type, content)
        VALUES (v_day_id, 1, 'quote', 'Tobias chamou então a si o anjo, que ele julgava ser um homem, e disse-lhe: "Azarias, meu irmão, peço-te que me ouças. Ainda que eu me fizesse teu escravo, não seria isso uma retribuição digna por teus cuidados. Não obstante, vou pedir-te ainda que tomes contigo cavalos e servos e vás à casa de Gabael, em Ragés, na Média. Devolve-lhe o seu recibo e recebe o dinheiro. Convida-o também para o meu casamento. Bem sabes que meu pai conta os dias; se eu tardar um dia mais, ele sofrerá com isso. Vês, por outro lado, como Raguel insistiu em que eu me demorasse aqui e não lho posso recusar". Rafael tomou então quatro servos de Raguel, dois camelos e partiu para Ragés, na Média. Encontrando Gabael, entregou-lhe o recibo e recebeu dele todo o dinheiro. Contou-lhe toda a aventura de Tobias e fê-lo vir consigo às núpcias.');

        -- Block 3: Opening Prayer
        INSERT INTO day_content_blocks (novena_day_id, sort_order, block_type, content)
        VALUES (v_day_id, 2, 'prayer', 'Ó Deus, que em sua inefável bondade tem enviado o abençoado Rafael como condutor e guia de Vossos devotos em sua jornada, nós humildemente imploramos a Vós que nós possamos ser conduzidos por ele no caminho de nossa salvação e experimentar sua ajuda na cura das moléstias de nossa alma. Tudo através de Jesus Cristo Nosso Senhor. Amém.');

        -- Block 4: Daily Prayer
        INSERT INTO day_content_blocks (novena_day_id, sort_order, block_type, content)
        VALUES (v_day_id, 3, 'prayer', 'Oh! Glorioso Arcanjo São Rafael, que estais presente ante o trono do Altíssimo. Eu, vosso indigno devoto, me humilho em vossa presença. Conhecendo por uma parte minha indignidade, e por outra vossa ardente caridade, vos suplico do íntimo do coração, que digneis escutar os meus humildes rogos e apresente-os ante o Senhor para obter por vossa mediação os favores que solicito nesta novena. Mas se minha súplica não há de contribuir para maior glória de Deus e salvação da minha alma, rogo-vos, oh! Meu Celestial protetor, mostrai a graça que me há de conduzir com mais segurança à eterna salvação. Não olheis tanto para os meus desejos, quanto ao bem de minha alma. Cheio de inteira confiança em Vós; espero alcançar o que solicito pelos méritos de Nosso Senhor Jesus Cristo, que vive e reina com o Pai e o Espírito Santo pelos séculos dos séculos. Amém.');

        -- Block 5: Intention Placeholder
        INSERT INTO day_content_blocks (novena_day_id, sort_order, block_type, content)
        VALUES (v_day_id, 4, 'intention', 'Coloque suas intenções aqui...');

        -- Block 6: Invocation
        INSERT INTO day_content_blocks (novena_day_id, sort_order, block_type, content)
        VALUES (v_day_id, 5, 'prayer', 'Invocação:\n\nOh! Glorioso Arcanjo São Rafael, lembra-te de seus devotos, em todas as partes e sempre peça por nós, ao Filho de Deus.');

        -- Block 7: Litany (Ladainha)
        INSERT INTO day_content_blocks (novena_day_id, sort_order, block_type, content)
        VALUES (v_day_id, 6, 'prayer', 'Ladainha a São Rafael Arcanjo:\n\nSenhor, tende piedade de nós\nCristo, tende piedade de nós\nCristo, graciosamente nos escutai\nDeus Pai, tende piedade de nós\nSenhor, tende piedade de nós\nDeus Filho, redentor do mundo, tende piedade de nós\nDeus Espirito Santo, tende piedade de nós\nSanta Trindade e Um só Deus, tende piedade de nós\nSanta Maria, rainha dos anjos, rogai por nós.\nSão Rafael, rogai por nós\nSão Rafael, cheio da misericórdia de Deus, rogai por nós\nSão Rafael, perfeito adorador do Divino Mestre, rogai por nós\nSão Rafael, terror dos demônios, rogai por nós\nSão Rafael, exterminador dos vícios, rogai por nós\nSão Rafael, saúde dos doentes, rogai por nós\nSão Rafael, refugio em nossas necessidades, rogai por nós\nSão Rafael, consolador dos prisioneiros, rogai por nós\nSão Rafael, alegria dos tristes, rogai por nós\nSão Rafael, cheio de zelo para a salvação de nossas almas, rogai por nós\nSão Rafael, cujo nome significa cura, rogai por nós\nSão Rafael, amante da castidade, rogai por nós\nSão Rafael, acoite dos demônios, rogai por nós\nSão Rafael, nosso protetor na peste, na fome, na guerra, rogai por nós\nSão Rafael, anjo da paz e da prosperidade, rogai por nós\nSão Rafael, repleto da graça da cura, rogai por nós\nSão Rafael, guia seguro no caminho da virtude e santificação, rogai por nós\nSão Rafael, socorro de todos que imploram a sua ajuda, rogai por nós\nSão Rafael, que guiou e consolou Tobias em sua jornada, rogai por nós\nSão Rafael, aquele que as Escrituras saúdam, como “Rafael o santo anjo do Senhor foi enviado para curar”, rogai por nós\nSão Rafael, nosso advogado, nos salve\n\nCordeiro de Deus que tirastes os pecados do mundo, tende piedade de nós,\nCristo, escutai nossas preces\nTende misericórdia de nós.\nSão Rafael, rogai por nós a Nosso Senhor Jesus Cristo,\nAgora e na hora de nossa morte. Amém');

        -- Block 8: Final Prayer
        INSERT INTO day_content_blocks (novena_day_id, sort_order, block_type, content)
        VALUES (v_day_id, 7, 'prayer', 'Oração Final:\n\nGlorioso Arcanjo São Rafael, celeste mensageiro destinado por Deus para nos servir de guia na peregrinação desta vida, para nos defender contra as ciladas do demônio e para curar as enfermidades da nossa alma e do nosso corpo. Nós invocamos vossa poderosa intercessão, seguros de que alcançareis por nós e nossas famílias aquelas graças singulares que dispensastes na santa casa de Tobias.\n\nBem sabeis piedoso Arcanjo, que nossa viagem do tempo à eternidade, está cercada de perigos, e que o demônio, como leão rugindo, nos persegue para causar profundas feridas em nossas almas, até apagar nelas, se for possível, a luz salvadora da fé. Vinde, pois, em nosso auxílio, e dignais ser nosso inseparável companheiro. Dirigi nossos passos ao caminho dos mandamentos divinos fazendo que nossos olhos estejam sempre abertos ao sol da verdade; procurando os remédios mais eficazes para curar e encher de fervor nosso espírito. Ensina-nos, oh! Poderoso arcanjo, a vencer a Satanás com as armas poderosas da oração, da vigilância e da mortificação dos nossos sentidos.\n\nConsolide em nossas famílias o reinado da fé, a prática constante da piedade, o espírito de união e o exercício da santa caridade em favor dos pobres e dos nossos queridos mortos, a fim de que eles recebam do céu abundantes bênçãos que, por mediação vossa derramou Deus sobre o lar de Tobias.\n\nNão nos abandoneis, pois, oh! Santo Arcanjo! Vigiai sempre ao nosso lado para que nossos passos sejam sustentados por vós, todas as vezes que sintamos desfalecidos na penosa e difícil jornada da vida. Nosso Senhor, Deus Todo-poderoso, que estais nos céus, e que é também o vosso, nos há confiado a vossa terna solicitude para que seja nosso guia neste desterro, nosso consultor nas dúvidas e nosso médico nas enfermidades. Coroais vossa obra de amigo fiel e condutor seguro, acompanhando nossas almas até as deixar nos braços de seu criador para amar-lhe e bendizer-lhe com vós eternamente. Assim seja.');

        -- Block 9: Footer
        INSERT INTO day_content_blocks (novena_day_id, sort_order, block_type, content)
        VALUES (v_day_id, 8, 'paragraph', 'Bendito e adorado seja o Santíssimo Sacramento do Altar e a Puríssima e Imaculada Conceição de Maria Santíssima, Senhora Nossa, concebida sem mancha de pecado original desde o primeiro instante de seu ser natural. Amém.');


        -- Insert Checklist Items

        -- Item 1: 9 Glorias
        INSERT INTO day_checklist_items (novena_day_id, label, repetition_count)
        VALUES (v_day_id, 'Rezar 9 vezes o Glória ao Pai, em honra dos nove coros angélicos', 9);

        -- Item 2: Terminate
        INSERT INTO day_checklist_items (novena_day_id, label, repetition_count)
        VALUES (v_day_id, 'Finalizar com a Oração Final', 1);

    END LOOP;
END $$;
