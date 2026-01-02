import { Link } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import { useLatestNovena, usePopularNovena } from '@/hooks/useHomeData';
import ChristianCross from '@/components/ui/ChristianCross';
import FeaturedNovenasCarousel from '@/components/novena/FeaturedNovenasCarousel';

const Index = () => {
  const { data: latestNovena, isLoading: latestLoading } = useLatestNovena();
  const { data: popularNovena, isLoading: popularLoading } = usePopularNovena();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none select-none">
          <div className="absolute top-10 left-[-20px] md:top-20 md:left-10 text-gold transform -rotate-12">
            <ChristianCross className="h-[150px] w-[150px] md:h-[200px] md:w-[200px]" />
          </div>
          <div className="absolute -bottom-10 right-[-20px] md:bottom-10 md:right-10 text-gold transform rotate-6">
            <ChristianCross className="h-[120px] w-[120px] md:h-[150px] md:w-[150px]" />
          </div>
        </div>

        <div className="container relative py-16 md:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-6 md:space-y-8 animate-fade-in-up">

            {/* Dynamic Top Label */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 bg-gold/10 rounded-full text-gold text-xs md:text-sm font-medium transition-opacity duration-500 ${latestLoading ? 'opacity-0' : 'opacity-100'}`}>
              <ChristianCross className="h-4 w-4" />
              <span>
                {latestNovena
                  ? `${latestNovena.title_pt || latestNovena.title} Disponível`
                  : "Novas novenas em breve"}
              </span>
            </div>

            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-semibold text-primary leading-tight text-balance">
              Caminhe em Oração,
              <br />
              <span className="text-gold">Um dia de cada vez...</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
              Gratia Novem guia você através de novenas com orações diárias,
              checklists e acompanhamento de progresso. Comece sua jornada em busca da sua graça hoje.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 px-4">
              <Button asChild variant="hero-gold" size="xl" className="w-full sm:w-auto">
                <Link to="/novenas">
                  Ver Novenas Disponíveis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="xl" className="w-full sm:w-auto hover:bg-gold/10 hover:text-gold border-gold/30">
                <Link to="/testimonials">
                  Ler Testemunhos
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>



      {/* Featured Novenas Slider */}
      <section className="py-16 md:py-20 bg-primary shadow-inner">
        <FeaturedNovenasCarousel novenas={popularNovena || []} isLoading={popularLoading} />
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-primary text-primary-foreground">
        <div className="container text-center px-4">
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4">
            Comece sua Jornada
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Não é necessário criar conta. Comece a rezar imediatamente e vincule seu email quando quiser.
          </p>
          <Button asChild variant="gold" size="xl" className="w-full sm:w-auto">
            <Link to="/novenas">
              Iniciar Agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
