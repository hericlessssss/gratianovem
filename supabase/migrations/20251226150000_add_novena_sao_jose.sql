-- Migration: Add Novena a São José
-- Description: Inserts the full content of the "Novena a São José" including common prayers and daily specific meditations.

DO $$
DECLARE
  v_novena_id uuid;
  v_day_id uuid;
  v_day_number integer;
  
  -- Text variables for common prayers to avoid repetition in source
  v_sign_cross text := 'Pelo sinal da Santa Cruz livrai-nos Deus, Nosso Senhor, dos nossos inimigos.';
  
  v_veni_creator text := 'Vinde, Espírito Santo, enchei os corações dos vossos fiéis e acendei neles o fogo do Vosso amor. Enviai o Vosso Espírito, e tudo será criado, e renovareis a face da terra. Oremos: ó Deus, que instruístes o coração dos vossos fiéis com a luz do Espírito Santo, fazei que apreciemos retamente todas as coisas, segundo o mesmo Espírito, e gozemos sempre da sua consolação. Por Cristo Senhor nosso. Amém!';
  
  v_prayer_initial text := 'Deus e Senhor meu, uno e trino, Pai, Filho e Espírito Santo, creio que estou em Vossa soberana presença agora, quando pretendo consagrar a São José esta novena. Adoro-vos com todo o meu coração, porque sois infinitamente bom e digno de ser amado sobre todas as coisas. Adoro-vos com toda a intensidade de que sou capaz e arrependo-me dos muitos pecados que fiz contra a Vossa Divina Majestade. Quero, nesta novena, aprender as virtudes que, com tanta perfeição, praticou o glorioso Patriarca São José, e alcançar, por sua intercessão, as graças de que tanto preciso.
Senhor, quem sou eu para atrever-me a comparecer diante de Vossa presença? Conheço a deficiência de meus méritos e a multidão de meus pecados, pelos quais não mereço ser ouvido em minhas orações; o que não mereço, merece-o São José, Pai nutrício de Jesus; o que eu não posso, ele pode. Venho, por isso, com total confiança, implorar a divina clemência, não fiando em minha fraqueza, mas no poder e valimento de São José.';

  v_prayer_virgin text := 'Virgem Imaculada, esposa castíssima de São José, assisti-me nestes momentos que dedico ao culto de vosso glorioso esposo. Sem auxílio, como eu poderia honrar dignamente o varão justo a quem dedicastes trinta anos de vida? Nem sei, nem posso honrá-lo como ele merece; por isso venho para que completeis o que me falta, e façais por ele o que não sei fazer. Ajudai-me, Senhora, nas minhas orações, para que sejam favoravelmente despachadas, pela intercessão e valimento de vosso Santo Esposo. Amém.';
  
  v_prayer_joseph text := 'Ó meu querido São José, ofereço-vos esta novena, com muito fervor e reverência e me consagro a vós, que merecestes o respeito e os favores de Jesus e de Maria, dedicados ao vosso serviço. Desejo obsequiar-vos dignamente, porque preciso ardentemente conseguir, por vossa intercessão, minha salvação eterna e as graças particulares que, rezando esta novena, desejo alcançar. Não olheis minhas faltas, mas a vossa grande misericórdia e o muito amor que professais.
O meu amável protetor, em vós ponho a confiança, atendei-me bondosamente. Amém.';

  v_prayer_final_all text := 'Lembrai-vos, ó puríssimo Esposo da Virgem Maria, doce protetor São José, que jamais se ouviu dizer que alguém que tivesse invocado proteção, implorado socorro e não fosse por vós consolado.
Com grande confiança, venho à vossa presença, recomendar-me fervorosamente a vós. Não desprezeis a súplica, ó Pai adotivo do Redentor, e dignai-vos acolhê-la piedosamente. Amém.
José, Filho de Davi, não temais receber Maria como Esposa Santíssima em vossa companhia, porque o que ela leva em suas puríssimas entranhas é por obra do Espírito Santo, José Santíssimo, rogai por nós para que sejamos dignos das promessas de Cristo. Amém.
Oremos: O Jesus, que por uma inefável providência, dignastes escolher o bem-aventurado José para esposo de Vossa Mãe Santíssima, concedei-nos que, aquele mesmo que veneramos como protetor, mereçamos tê-lo no Céu por intercessor. Vós que viveis e reinais com o Pai e o Espírito Santo por todos os séculos dos séculos. Amém.';

BEGIN
  -- 1. Create the Novena
  INSERT INTO public.novenas (slug, title, title_pt, description, description_pt, duration, is_active)
  VALUES (
    'novena-a-sao-jose',
    'Novena to St. Joseph',
    'Novena a São José',
    'Pray for protection and intercession from the Patron of the Universal Church.',
    'Poderosa novena para alcançar graças impossíveis e pedir a intercessão do Patrono da Igreja Universal.',
    9,
    true
  )
  RETURNING id INTO v_novena_id;

  -- 2. Loop through 9 Days
  FOR v_day_number IN 1..9 LOOP
    
    -- Insert Day
    INSERT INTO public.novena_days (novena_id, day_number, title, title_pt)
    VALUES (v_novena_id, v_day_number, 'Day ' || v_day_number, v_day_number || 'º Dia')
    RETURNING id INTO v_day_id;

    -- COMMON INTRO BLOCKS
    INSERT INTO public.day_content_blocks (novena_day_id, block_type, content, content_pt, sort_order) VALUES
    (v_day_id, 'prayer', v_sign_cross, v_sign_cross, 10),
    (v_day_id, 'prayer', v_veni_creator, v_veni_creator, 20),
    (v_day_id, 'paragraph', 'Orações para todos os dias', 'Orações para todos os dias', 30),
    (v_day_id, 'prayer', v_prayer_initial, v_prayer_initial, 40),
    (v_day_id, 'prayer', v_prayer_virgin, v_prayer_virgin, 50),
    (v_day_id, 'prayer', v_prayer_joseph, v_prayer_joseph, 60);

    -- SPECIFIC DAILY PRAYER (Depending on Day Number)
    IF v_day_number = 1 THEN
      INSERT INTO public.day_content_blocks (novena_day_id, block_type, content, content_pt, sort_order) VALUES
      (v_day_id, 'prayer', 
       'Specific Prayer Day 1', 
       'Dou graças à Santíssima Trindade, santíssimo José, pelos muitos privilégios, méritos e virtudes que vos enriqueceu e principalmente, pelo grande singularíssimo a poucos concedido, de ter sido santificado no ventre de vossa mãe e confirmado em graça.
Que alegria para vosso coração ver-vos livre do pecado, que é a única coisa que desagrada a Deus Filho, que vos chamava de Pai! Que graças destes à Trindade Beatífica por esse tão assinalado privilégio!
Eu vos felicito com meu coração, pela inocência incomparável que tivestes desde antes de nascer e pela graça e amizade particular com que o mesmo Deus vos distinguiu.
Por esse privilégio e pela grande alegria que Ele vos causou, suplico, ó meu querido Pai, que me alcanceis de Deus ódio ao pecado, amor às virtudes e a minha salvação eterna.
E como creio que a graça que desejo conseguir nesta novena, será benéfica à minha salvação, tenho inteira confiança de que a alcançarei por vossa poderosíssima intercessão e se minha oração não for bem dirigida, endireitai-a e rogai ao boníssimo Deus por mim. Amém.', 
       70);
    ELSIF v_day_number = 2 THEN
       INSERT INTO public.day_content_blocks (novena_day_id, block_type, content, content_pt, sort_order) VALUES
      (v_day_id, 'prayer', 
       'Specific Prayer Day 2', 
       'Que felicidade a vossa, glorioso protetor, serdes escolhido milagrosamente para esposo da Imaculada Maria! Alegro-me convosco pela satisfação imensa que experimentastes naquele dia feliz, quando associastes vossa sorte à da Mãe de Jesus Cristo.
Que admiração teriam os santos anjos, por serdes o sustentáculo da Mãe do Verbo Encarnado, e por esse mesmo motivo também protetor do Filho de Deus!
Uno meus louvores aos que, nesse dia, vos dariam os anjos do Céu e, de todo o meu coração vos felicito por ter sido dado de presente à Rainha dos Anjos, e pelo zelo com que se dedicou ao vosso serviço.

Que transbordante felicidade! Que maravilha ter por companheira aquela que trouxe o Filho de Deus em seu seio sagrado! Que felicidade ter, para vosso consolo, nas dificuldades a Consoladora dos aflitos, como conselheira a sapientíssima Mãe de Jesus Cristo e para modelo nas virtudes aquela que é o espelho sem mancha da Majestade divina e a imagem da bondade de Deus!

Por esse favor e felicidade tão grande, peço poderosíssimo São José, a amizade e a graça de Deus e a proteção e amparo constantes de Maria Santíssima.

Interponde ao mesmo tempo vosso valimento com Jesus e com a santíssima esposa, para alcançar as graças particulares que com esta novena pretendo conseguir.', 
       70);
    ELSIF v_day_number = 3 THEN
       INSERT INTO public.day_content_blocks (novena_day_id, block_type, content, content_pt, sort_order) VALUES
      (v_day_id, 'prayer', 
       'Specific Prayer Day 3', 
       'Que pena tão amarga devíeis ter sentido no coração, José Gloriosíssimo, quando em humildade julgastes dever separar-vos da esposa Maria, que tanto amáveis e que correspondia a vosso amor com amor puro e sincero.

Confraternizo convosco por aqueles momentos de sofrimento e por essa amarga provação que o Senhor permitiu!

Por caridade, ficastes ao lado da Mãe do Unigênito Filho de Deus. Maria vos pertenceu e amou sempre unida ao Amor de Deus.

Em Seu infinito poder, Deus fez nela maravilhas de Seu divino Amor. Fostes a maior testemunha das grandiosidades operadas em Maria. Maria é o jardim, o depositário desse eterno tesouro.

São José, aceitai sinceras felicitações pela parte ativa que Deus vos concedeu no mistério da Encarnação e pela sujeição de Jesus e de Sua santíssima Mãe às vossas ordens.

Por essa grande alegria e também pelos méritos da tristeza que a precedeu, suplico-vos, Pai querido, que alcanceis de Deus o conhecimento de Jesus Cristo e a graça de conservar uma fé tão viva em todos os seus mistérios que esteja pronto para antes morrer que duvidar deles; alcançai-me, outrossim, a graça que nesta novena pretendo conseguir, se for para maior glória de Deus e bem de minha alma. Amém.', 
       70);
    ELSIF v_day_number = 4 THEN
       INSERT INTO public.day_content_blocks (novena_day_id, block_type, content, content_pt, sort_order) VALUES
      (v_day_id, 'prayer', 
       'Specific Prayer Day 4', 
       'Esposo castíssimo da Mãe do Unigênito Filho de Deus, uno-me a vós na tristeza que experimentastes em Belém, quando, lá chegando, depois de penosa viagem, vistes a venerada esposa Maria e O Salvador do mundo, que ela levava em suas entranhas, desconhecidos e repelidos nas casas e pousadas. Ó meu querido São José, como conhecestes, então, que o mundo não é amigo de Cristo e que é impossível servir juntamente dois senhores tão inimigos e contrários!
Dai-me Jesus, que tanta alegria vos causou no nascimento. As vozes dos anjos, dizendo "Paz na Terra aos homens de boa vontade", são principalmente dirigidas a vós.
Aceitai louvores pelo muito amor que Jesus vos manifestou, escolhendo-vos para Pai nutrício e para poderoso defensor e amparo.
Permiti-me, gloriosíssimo e poderosíssimo Santo, chegar até onde estais, perto de Jesus, contemplar a Santidade divina e o esplendor.
Pedi a Jesus que me dê as graças recebidas pelos pastores e reis, que foram adorá-lo no presépio; pedi, também, as graças que desejo conseguir nesta novena, se forem para maior glória de Deus e salvação de minha alma. Amém.', 
       70);
    ELSIF v_day_number = 5 THEN
       INSERT INTO public.day_content_blocks (novena_day_id, block_type, content, content_pt, sort_order) VALUES
      (v_day_id, 'prayer', 
       'Specific Prayer Day 5', 
       'Que grande dor sofrestes, querido São José, quando vistes derramar-se o Preciosíssimo Sangue de Cristo na circuncisão!
Por que teria esse infante divino de sofrer assim, poucos dias depois de ter nascido? Sendo Jesus a perfeição em pessoa, certamente que esse sofrimento foi pelos nossos pecados.
São José, dai-me conhecer o preço do Sangue de Jesus, para que nunca deixe de perder a menor gota e que esse sangue, caindo abundantemente sobre minha alma, lave e purifique-me inteiramente.
Permiti, São José, que para conseguir graça tão importante, me aproxime mais de vós para ouvir atento e obedecer às bênçãos e às graças que dele emanam e, por bondade divina, passam por vossas sagradas mãos.
Vossas mãos sagradas ampararam Jesus, o Salvador do mundo, que tira os pecados dos homens!
São José, que alegria a vossa, quando destes ao Salvador o nome de Jesus, sabendo que esse nome é a própria felicidade, é a chave que abre a porta do Céu!
Adorador de Cristo, permiti que Jesus seja para mim meu Salvador, nesta vida e na eterna.
Pelo nome adorável, Jesus, peço-vos também as graças que desejo alcançar nesta novena, se forem para maior glória de Deus e para o bem de minha alma. Amém.', 
       70);
    ELSIF v_day_number = 6 THEN
       INSERT INTO public.day_content_blocks (novena_day_id, block_type, content, content_pt, sort_order) VALUES
      (v_day_id, 'prayer', 
       'Specific Prayer Day 6', 
       'Ó meu boníssimo São José, protetor dos desvalidos! Por aquela alegria que experimentou o vosso coração, ouvindo os louvores que os doutores da lei faziam a Cristo Menino, peço que não me esqueçais.
Fazei que Jesus, meu Salvador, seja sempre para mim ocasião de ressurreição. Confraternizo-me convosco, pacientíssimo José, pela ferida que em vosso coração fizeram as palavras de São Simeão, anunciando a Maria que uma espada de dor havia de atravessar seu delicadíssimo e amorosíssimo coração.
Em tão tremenda ocasião para Maria, vós nem poderíeis remediar essas dores, nem ao menos ser testemunha de tão terrível padecer, para consolar a esposa com a vossa presença humana na Paixão de Cristo!
Eu sim, com minha vida e bons costumes, preciso consolar Maria, porque sou culpado, por meus pecados, na morte de Jesus e nas dores de Maria, e quero reparar esses pecados.
Ajudai, José poderosíssimo, minha pobreza espiritual e poucas forças, alcançando de Nosso Senhor a graça de nunca ser, por própria culpa, causa de sofrimento de Jesus e das dores de Maria.
Alcançai-me também a graça que desejo conseguir rezando esta novena, se for para maior glória de Deus e salvação de minha alma. Amém.', 
       70);
    ELSIF v_day_number = 7 THEN
       INSERT INTO public.day_content_blocks (novena_day_id, block_type, content, content_pt, sort_order) VALUES
      (v_day_id, 'prayer', 
       'Specific Prayer Day 7', 
       'São José, permiti que, em espírito, acompanhe na viagem ao Egito, para admirar os sacrifícios e imitar vossas virtudes. Tudo fizestes para defender Jesus de tantos perigos e, sobretudo, da morte. Que tão grande dor foi para o vosso coração amante ver sofrer Jesus e Maria!

Quanta sede devem ter sofrido no deserto os três peregrinos santíssimos!
Peço humildemente que tireis de mim a sede dos prazeres mundanos e dai-me a fome e sede das virtudes, principalmente a humildade, a paciência e a mortificação que minha alma deseja ardentemente possuir.

Entristeçam-me as coisas que vos entristecem, amável São José, e que eu saiba alegrar-me com as que vos causam alegria. Experimente minha alma, conservando-se na graça de Deus, a mesma alegria que experimentou vosso delicado coração quando, afinal, depois dos transtornos duma perigosa viagem por ermos desertos, vistes salvos Jesus e Maria, a amantíssima esposa, e seguros no novo lar.

Assim, como vos alegrastes com a queda dos ídolos, das afeições desregradas e das paixões desordenadas, eu me alegro de modo que, em tudo e por tudo, agrade Jesus, à santíssima Mãe e a também vós, meu amável José, que tanto gozais na glória de Deus.

Alcançai-me, também, a graça que desejo conseguir rezando esta novena, se for para maior glória de Deus e salvação de minha alma. Amém.', 
       70);
    ELSIF v_day_number = 8 THEN
       INSERT INTO public.day_content_blocks (novena_day_id, block_type, content, content_pt, sort_order) VALUES
      (v_day_id, 'prayer', 
       'Specific Prayer Day 8', 
       'Confraternizo-me convosco, terníssimo Jose, por causa das privações a que vistes sujeita a amada família, na terra da peregrinação.
Uno minhas lágrimas às que derramastes pela dureza do exílio e por tudo que vos faltou, a Maria e a Jesus no Egito.
Por vossa família, que é a família de Deus, tão paciente, eu ofereço qualquer pequena e insignificante mortificação.
Ó meu querido São José, pela alegria imensa que inundou vosso coração quando Jesus falou o doce nome de Pai, e pela sujeição com que pela primeira vez vos prestou homenagem de obediência, suplico que me ensineis obedecer aos superiores e sofrer, com paciência e resignação, as provas que a Divina Providência se dignar enviar-me, para purificar-me de meus pecados ou para aumentar meus méritos.
Alcançai-me, também, pela alegria com que voltastes do exílio para morar em Nazaré, a graça que com tanta humildade vos peço nesta novena, se não houver prejuízo de minha salvação. Amém.', 
       70);
    ELSIF v_day_number = 9 THEN
       INSERT INTO public.day_content_blocks (novena_day_id, block_type, content, content_pt, sort_order) VALUES
      (v_day_id, 'prayer', 
       'Specific Prayer Day 9', 
       'O José, chamado por Jesus pelo nome de Pai, que dor e tormento indizível seria para vosso coração amorosíssimo ter perdido Jesus, com o qual estavam todas as afeições de vossa vida! Que grande aflição sentistes por não ter encontrado o menino Jesus entre parentes e conhecidos e por ninguém ter dado notícias d''Ele.
Onde estaria Jesus? Como poderíeis viver sem Ele, que era vossa alegria de viver? Perdestes Jesus sem própria culpa, mas eu O perdi muitas vezes por própria culpa, por causa de malícia e de meus pecados.
Fazei-me conhecer Jesus e procurá-lo com perseverança, ensinai-me obedecer, ensinai-me adorá-lo, custe o que custar. Consegui-me a graça de que, de hoje em diante, nunca mais eu O perca pelo pecado e que, se por infelicidade eu venha a perdê-lo, nunca tenha sossego até que O encontre novamente, pela divina graça.
Peço-vos essa graça, pela alegria inefável que experimentastes encontrando Jesus, no Templo, ensinando, como Mestre Divino, os doutores da lei e causando-lhes encanto e admiração com perguntas e respostas. Intercedei para que eu esteja sempre em união com Jesus e a Santa Igreja.
Consegui que Jesus esteja sempre em meu coração, com a divina Caridade e que, no futuro, possa gozar de Sua visão e amizade no Céu, para sempre.
Alcançai-me, também, as graças que pedi nestes dias, durante esta novena. Tenho confiança de que tudo que pedi, irei receber do Amor de Deus, por vosso intermédio. De agora em diante, com a graça divina, serei divulgador do poder que o Misericordiosíssimo Deus vos concede. Amém.', 
       70);
    END IF;

    -- COMMON OUTRO BLOCKS & ACTIONS
    INSERT INTO public.day_content_blocks (novena_day_id, block_type, content, content_pt, sort_order) VALUES
    (v_day_id, 'prayer', v_prayer_final_all, v_prayer_final_all, 80),
    (v_day_id, 'intention', 'Pedir a graça que se deseja alcançar.', 'Pedir a graça que se deseja alcançar.', 90);

    INSERT INTO public.day_checklist_items (novena_day_id, label, label_pt, sort_order) VALUES
    (v_day_id, 'Rezar: sete Pai-Nossos, sete Ave-Marias e sete Glórias, em honra das alegrias e dores do glorioso Patriarca.', 'Rezar: sete Pai-Nossos, sete Ave-Marias e sete Glórias, em honra das alegrias e dores do glorioso Patriarca.', 1);

  END LOOP;
END $$;
