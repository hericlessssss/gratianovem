import { Link } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import { useLatestNovena, usePopularNovena } from '@/hooks/useHomeData';

const Index = () => {
  const { data: latestNovena, isLoading: latestLoading } = useLatestNovena();
  const { data: popularNovena, isLoading: popularLoading } = usePopularNovena();

  // Loading Fallback (or just show skeleton? For simplicity, we just render null titles initially)

  return (
    <Layout>
      {/* Hero Section */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 text-[200px] text-gold">✝</div>
          <div className="absolute bottom-10 right-10 text-[150px] text-gold">✝</div>
        </div>

        <div className="container relative py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-8 animate-fade-in-up">

            {/* Dynamic Top Laebl */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 bg-gold/10 rounded-full text-gold text-sm font-medium transition-opacity duration-500 ${latestLoading ? 'opacity-0' : 'opacity-100'}`}>
              <span className="ornament-cross"></span>
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

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Gratia Novem guia você através de novenas com orações diárias,
              checklists e acompanhamento de progresso. Comece sua jornada em busca da sua graça hoje.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild variant="hero-gold" size="xl">
                <Link to="/novenas">
                  Ver Novenas Disponíveis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="xl">
                <Link to="/testimonials">
                  Ler Testemunhos
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>



      {/* Featured Novena (Popular) */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="prayer-card text-center transition-all duration-500">
              {popularLoading ? (
                <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-gold w-8 h-8" /></div>
              ) : popularNovena ? (
                <>
                  <span className="text-gold text-4xl mb-4 block">✝</span>
                  <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 bg-gold/5 rounded-full text-xs font-medium text-gold uppercase tracking-wider">
                    Mais Rezada Pela Comunidade
                  </div>
                  <h2 className="font-display text-2xl md:text-3xl font-semibold text-primary mb-4">
                    {popularNovena.title_pt || popularNovena.title}
                  </h2>
                  <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                    {popularNovena.description_pt || popularNovena.description}
                  </p>
                  <Button asChild variant="gold" size="lg">
                    <Link to={`/novena/${popularNovena.slug}`}>
                      Começar Novena
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </>
              ) : (
                // Fallback if no data is returned at all
                <div className="py-8">
                  <p className="text-muted-foreground">Em breve, novas novenas em destaque.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4">
            Comece sua Jornada
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Não é necessário criar conta. Comece a rezar imediatamente e vincule seu email quando quiser.
          </p>
          <Button asChild variant="gold" size="xl">
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
