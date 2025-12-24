import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';

const Index = () => {
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 rounded-full text-gold text-sm font-medium">
              <span className="ornament-cross"></span>
              <span>Novena de São José Disponível</span>
            </div>
            
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-semibold text-primary leading-tight text-balance">
              Caminhe em Oração,
              <br />
              <span className="text-gold">Um Dia de Cada Vez</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Gratia Novem guia você através de novenas sagradas com orações diárias, 
              checklists e acompanhamento de progresso. Comece sua jornada espiritual hoje.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild variant="hero-gold" size="xl">
                <Link to="/novena/novena-sao-jose-operario">
                  Iniciar Novena
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



      {/* Featured Novena */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="prayer-card text-center">
              <span className="text-gold text-4xl mb-4 block">✝</span>
              <h2 className="font-display text-2xl md:text-3xl font-semibold text-primary mb-4">
                Novena de São José
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                São José, esposo de Maria e pai adotivo de Jesus, é um poderoso intercessor. 
                Esta novena de 9 dias convida você a buscar sua proteção e orientação.
              </p>
              <Button asChild variant="gold" size="lg">
                <Link to="/novenas">
                  Começar Novena
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4">
            Comece sua Jornada de Fé
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Não é necessário criar conta. Comece a orar imediatamente e vincule seu email quando quiser.
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
