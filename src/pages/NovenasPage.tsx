import { Link } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import { useNovenas } from '@/hooks/useNovena';

const NovenasPage = () => {
  const { data: novenas, isLoading, error } = useNovenas();

  return (
    <Layout>
      <div className="container py-12 md:py-20">
        <div className="text-center mb-12">
          <h1 className="font-display text-3xl md:text-5xl font-semibold text-primary mb-4">
            Novenas Disponíveis
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Escolha uma novena para iniciar sua jornada de oração
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">Erro ao carregar novenas</p>
          </div>
        ) : novenas && novenas.length > 0 ? (
          <div className="max-w-2xl mx-auto space-y-6">
            {novenas.map((novena) => (
              <div 
                key={novena.id} 
                className="prayer-card hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 rounded-xl bg-gold/10 flex items-center justify-center text-gold text-3xl shrink-0">
                    ✝
                  </div>
                  <div className="flex-1">
                    <h2 className="font-display text-2xl font-semibold text-primary mb-2">
                      {novena.title_pt || novena.title}
                    </h2>
                    <p className="text-muted-foreground text-sm mb-4">
                      {novena.description_pt || novena.description}
                    </p>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                        {novena.duration} dias
                      </span>
                      <Button asChild variant="gold" size="sm">
                        <Link to={`/novena/${novena.slug}`}>
                          Iniciar <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <span className="text-gold text-4xl block mb-4">✝</span>
            <p className="text-muted-foreground">
              Nenhuma novena disponível no momento.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default NovenasPage;
