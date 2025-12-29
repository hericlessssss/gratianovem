-- Create Novena of Santo Tomás de Aquino

DO $$ 
DECLARE
    v_novena_id uuid;
    v_day_id uuid;
    v_day_num integer;
    v_daily_meditation text;
BEGIN
    -- 1. Insert Novena
    INSERT INTO novenas (title, description, slug, duration)
    VALUES (
        'Novena a Santo Tomás de Aquino', 
        'Santo Tomás de Aquino, nascido em 1225 no castelo de Roccasecca, foi um dos maiores teólogos e filósofos da Igreja, reconhecido como Doctor Angelicus. Após estudos em Monte Cassino, Nápoles, Paris e Colônia, destacou-se como mestre de teologia, combinando profunda fé e humildade com um saber vasto e sólido. Autor da monumental Summa Theologica, suas obras influenciaram profundamente a teologia católica, sendo referência em dogmas e refutações de erros. Devoto e piedoso, compôs hinos como Tantum Ergo, que celebram o Santíssimo Sacramento. Canonizado em 1323, é padroeiro dos estudos superiores e exemplo de santidade e sabedoria.', 
        'sao-tomas-de-aquino', 
        9
    )
    RETURNING id INTO v_novena_id;

    -- 2. Loop for 9 Days
    FOR v_day_num IN 1..9 LOOP
        -- Insert Day
        INSERT INTO novena_days (novena_id, day_number, title)
        VALUES (v_novena_id, v_day_num, 'Dia ' || v_day_num)
        RETURNING id INTO v_day_id;

        -- Determine Daily Meditation Content
        CASE v_day_num
            WHEN 1 THEN
                v_daily_meditation := 'A humildade é uma virtude que restringe o apetite e o contém para não armazenar excessivamente objetos altos e excessivos. O humilde que, de acordo com São Isidoro, é inclinado à terra, considerando suas imperfeições e defeitos, está sempre arruinado e pequeno, e como o patriarca Abraão exclama em sua oração: “falarei ao Senhor meu Deus, não sendo mais que poeira e cinzas”.' || chr(10) || chr(10) || 'São Tomás de Aquino sempre praticou a humildade como a mais bela e necessária das virtudes. Ainda criança, ele era o encantamento de todos pela modéstia e humildade de seu caráter; quando era estudante, seus colegas, tendo em vista o silêncio muito humilde com o qual tentava encobrir os talentos que Deus o havia preenchido, recebeu o apelido de Boi Mudo e, mais tarde, doutor nas universidades de Paris e Roma, nunca se notou nele algum sinal de arrogância e vaidade e recusava vigorosamente as mais altas dignidades da Igreja sem sequer exercer a posição de prelado em um convento de sua ordem.';
            WHEN 2 THEN
                v_daily_meditation := 'Todos temos razões suficientes para nos humilharmos e nos reconhecermos em outros méritos e reconhecermos nos outros os méritos e excelências, de acordo com o apóstolo; “Vamos humildemente julgar os outros como nossos superiores”.' || chr(10) || chr(10) || 'Estava o doutor angélico tão persuadido da necessidade de ser humilde, o que pode ser dito que era seu esforço máximo e o norte de todos os seus atos. Sendo tão grande, ele nunca acreditou em sua grandeza e sempre pareceu pequeno e inferior aos outros.';
            WHEN 3 THEN
                v_daily_meditation := 'Após as virtudes teológicas que nos direcionam diretamente a Deus e a justiça que estabelece a ordem da razão, a virtude da humildade com que a alma se dispõe para todas as outras virtudes segue em dignidade e excelência. É por isso que a humildade deve ser comparada à fundação de um edifício, pois, removendo tudo o que a Deus desagrada, torna a alma apta a receber as graças divinas, porque sabe-se que Deus resiste aos orgulhosos e dá sua graça aos humildes.' || chr(10) || chr(10) || 'Todos os agradecimentos recebidos por São Tomás, eles tinham sua razão e começaram na humildade de sua alma. Seus olhos, no chão, indicavam o êxtase milagroso em que seu coração foi tomado; suas palavras sempre eram muito modestas e oportunas, preferindo o silêncio à tagarelice vã; ele nunca quis distinguir entre seus irmãos e sua vida era bela, a mais modesta na presença do Senhor.';
            WHEN 4 THEN
                v_daily_meditation := 'A sabedoria é um dos dons do Espírito Santo, com o qual a inteligência banhada pelas luzes celestes, é correta ao contemplar as coisas mais altas e, uma vez vistos esses motivos supremos, desce para julgar e correr sobre os outros objetos subordinados à razão.' || chr(10) || chr(10) || 'Santo Tomás foi o novo Salomão da Igreja por causa da sabedoria portentosa com que o céu o enriqueceu. E como o velho Salomão diz a Sagrada Escritura que sabia tudo, desde o cedro das montanhas ao musgo e o hissopo das paredes, pode-se dizer a Tomás de Aquino que nada escapou de sua inteligência soberana, da teologia às ciências físicas e da Sagrada Escritura à política e linguística.';
            WHEN 5 THEN
                v_daily_meditation := 'A sabedoria não é uma mera virtude técnica que figura todos os seus encantos na contemplação das maravilhas de Deus e na simples especulação dos mais altos princípios das coisas, mas, como diz o apóstolo, estende sua influência aos atos da vida regularizando os movimentos e organizando os fins das causas secundárias.' || chr(10) || chr(10) || 'Desde que Santo Tomas, quando garoto de cinco anos, discutiu com os monges do Monte Casino, perguntando-lhes sobre a existência e os atributos de Deus, até que ele foi condecorado pelas universidades mais famosas do mundo, ele explicou como professor soberano as questões mais abstrusas da razão e da natureza. A fé e a sabedoria em seu sentido mais belo eram os companheiros inseparáveis de sua vida e o norte luminoso de todas as suas operações.';
            WHEN 6 THEN
                v_daily_meditation := 'Visto que esse dom do Espírito Santo é uma virtude tão bela e excelente, não pode ser encontrado, como foi dito no dia anterior, com a mancha e a culpa da alma: mas onde a graça está assentada, vive a sabedoria, agora que Deus ama apenas aqueles que são adornados com sabedoria, e o amor de Deus implica a alma em graça e causa, ao contrário, a mesma graça e amizade divina.Cabazes de oferta' || chr(10) || chr(10) || 'Raramente a sabedoria brilhou tão pura e radiante quanto na testa de Santo Tomás. E não apenas ele parou na luz que encantou aqueles que o viram com seus raios, mas que em um incêndio de caridade ele atraiu a Deus aqueles que se ilustraram de perto com os esplendores daquele Sol. Ninguém falou com Santo Tomas que não era docemente amarrado com correntes de amor divino, ninguém o viu para não abençoar o céu, ninguém o ouviu em suas explicações luminosas do Mestre, que não acreditavam ter visto o dedo de Deus acendendo em sua inteligência a bela chama do gênio.';
            WHEN 7 THEN
                v_daily_meditation := 'Entre as virtudes cristãs, não há nada mais belo e resplandecente que a santa virgindade, através da qual, como ensina Santo Agostinho, a integridade da carne é consagrada e oferecida ao Senhor. Assim como se diz que uma planta é verde e fresca, quando a abundância de calor não agita ou murcha sua seiva, uma pessoa chamada virgem é dedicada a tudo de seu Deus. Ela está livre do calor das paixões e fogo de concupiscência; Portanto, Santo Ambrósio diz que, na razão da virgindade, está envolvido o conceito de limpeza absoluta e que a alma está livre da corrupção dos sentidos, sendo a essência dessa virtude celestial acompanhada de um propósito firme e perpétuo: abster-se da imundície da sensualidade.' || chr(10) || chr(10) || 'Santo Tomás foi um virgem muito puro a vida toda. Da luta titânica mantida em Roca-Seca, onde conquistou como soldado corajoso a bela palma da vitória e o cordão abençoado com o qual os anjos enrolavam seus lombos, a vida inteira do inacabado doutor dominicano era um contínuo idílio de inocência que eles mesmos os serafins adoraram.';
            WHEN 8 THEN
                v_daily_meditation := 'Basta saber que é virtude e ato meritório, portanto, entender não apenas a legalidade, mas pelo menos a conveniência da virgindade. Além disso, é sabido que, nos atos humanos, algo ilícito e cruel pode ser encontrado quando os poderes se opõem ou não seguem a opinião do motivo que é o regulador de todas as operações, ordenando-os para um fim pré-concebido como bom.' || chr(10) || chr(10) || 'Santo Tomás vivia tão separado da carne e de seus instintos que, mais do que um homem, ele parecia um anjo ocupado apenas em Deus e no aumento de sua honra. Nem a próstata de sua linhagem era suficiente para ofuscar seu coração, nem a delicadeza de seu corpo inocente, fazia parte para atenuar o rigor com o qual ele sempre tentava mortificar e manter suas paixões afastadas e os apetites por toda sua carne.';
            WHEN 9 THEN
                v_daily_meditation := 'Sem dúvida, é a virgindade mais bela e excelente do que o estado civil e uma das virtudes mais agradáveis aos olhos divinos. Dizer o contrário, afirmar que o casamento é em si mais perfeito que o estado celibatário, foi o erro de Jovinian tantas vezes repetido e vangloriado em tons às vezes satíricos e além de satiristas profanos e imorais.' || chr(10) || chr(10) || 'O doutor angélico estava tão apaixonado pelo estado religioso e tão apaixonado pela virgindade que se observa que os ferozes ataques promovidos pelo mundo, demônios e carne não foram suficientes para fazê-lo desistir de sua companhia. Religioso vestidos com um hábito muito branco, símbolo de inocência e sinceridade, era São Tomás de Aquino e por ter abraçado a vida pobre, mortificada e oculta em Jesus, o perfume de sua pureza imaculada e o brilho de sua ciência celestial descobriram seus tesouros e deram nome e fama sem segundo santo.';
        END CASE;

        -- Insert Content Blocks
        
        -- Block 0: Intro Prayer
        INSERT INTO day_content_blocks (novena_day_id, sort_order, block_type, content)
        VALUES (v_day_id, 0, 'prayer', 'Oração Inicial:\n\nÀ vós, meu Deus, fonte de misericórdia, eu me aproximo, pecador imundo, para que Vós Vos digneis a lavar minhas manchas. Ó sol da justiça, ilumine esse cego! Ó Doutor Eterno, cure este miserável! Ó Rei dos reis, vista este nu! Ó mediador entre Deus e os homens, reconcilie esse preso! Ó, Bom Pastor, seja bem-vindo a esta ovelha rebelde! Concedei, meu Deus, perdão a esse criminoso, indulgência a esse ímpio e a unção de Sua graça a essa vontade endurecida. Ó misericordioso Senhor, chame Seu fugitivo, atraia este resistente, levante aquele que caiu e uma vez ressuscitado, segure-o e guie seus passos. Não se esqueça, Senhor, a quem Vos esqueceu, não abandone aqueles que O abandonaram, não descarte aqueles que O rejeitaram e perdoe no céu aqueles que O ofenderam na terra. Amém.');

        -- Block 1: Prayer to Virgin
        INSERT INTO day_content_blocks (novena_day_id, sort_order, block_type, content)
        VALUES (v_day_id, 1, 'prayer', 'Oração à Santíssima Virgem:\n\nÓ abençoada e doce Virgem Maria, oceano de bondade, Filha do rei soberano, Rainha dos anjos e Mãe do Criador! Me jogo confiante no seio de sua misericórdia e ternura, confiando-lhe meu corpo, minha alma, meus pensamentos, meus desejos, meus afetos e minha vida inteira, para que, com sua ajuda, eu sempre ande em direção ao bem, de acordo com a vontade de seu amado Filho, Nosso Senhor Jesus Cristo. Amém');

        -- Block 2: Daily Meditation
        INSERT INTO day_content_blocks (novena_day_id, sort_order, block_type, content)
        VALUES (v_day_id, 2, 'paragraph', v_daily_meditation);

        -- Block 3: Final Prayer
        INSERT INTO day_content_blocks (novena_day_id, sort_order, block_type, content)
        VALUES (v_day_id, 3, 'prayer', 'Oração Final:\n\nGraças, Vos dou, Senhor meu Deus, e Pai das misericórdias, porque Vos dignastes a admitir, ao Seu pobre pecador e Seu indigno servo, a livre participação de Sua graça no segredo da oração. Peço-Lhe que esta comunicação da minha alma convosco não seja um castigo pelos meus defeitos, mas um penhor seguro do perdão das minhas ofensas, da melhor armadura da fé e do invulnerável escudo do meu coração. Conceda-me a remissão dos meus defeitos, o extermínio da concupiscência e sensualidade, o aumento da caridade, humildade, paciência, obediência e todas as virtudes; me defenda das armadilhas visíveis e invisíveis dos inimigos; Dá-me a calma inefável de meus apetites e todos os meus afetos, para que eu possa me juntar a Vós; melhor do que vossa é minha felicidade e descanso. Eu também imploro meu Deus, que depois de minha morte, Vós Vos digneis de me admitir na Páscoa celestial e no convite divino, onde Vós, em união do Filho e do Espírito Santo, Sois luz verdadeira, abundância perfeita, alegria eterna, alegria consumada e felicidade sem medida. Amém.');

        -- Block 4: Intention (Placeholder)
        INSERT INTO day_content_blocks (novena_day_id, sort_order, block_type, content)
        VALUES (v_day_id, 4, 'intention', 'Peça a graça especial que deseja alcançar por intercessão de Santo Tomás');

        -- Block 5: Checklist Marker
        INSERT INTO day_content_blocks (novena_day_id, sort_order, block_type, content)
        VALUES (v_day_id, 5, 'checklist', 'Checklist de Orações Finais');

        -- Block 6: Footer/Invocation
        INSERT INTO day_content_blocks (novena_day_id, sort_order, block_type, content)
        VALUES (v_day_id, 6, 'prayer', 'Ó Santo Tomás, glória e honra da Ordem dos Pregadores! Transporte-nos para a contemplação das coisas celestes, vós que fostes soberano mestre dos mistérios sagrados. Rogai por nós, Santo Tomás, para que sejamos dignos das promessas de Jesus Cristo.');


        -- Insert Checklist Items (Standard prayers mentioned in text)
        INSERT INTO day_checklist_items (novena_day_id, label, repetition_count)
        VALUES (v_day_id, 'Pai-Nosso', 1);

        INSERT INTO day_checklist_items (novena_day_id, label, repetition_count)
        VALUES (v_day_id, 'Ave-Maria', 1);

        INSERT INTO day_checklist_items (novena_day_id, label, repetition_count)
        VALUES (v_day_id, 'Glória', 1);

    END LOOP;
END $$;
