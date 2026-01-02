import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2, Search, MessageCircle, Mail, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Layout from '@/components/layout/Layout';
import { useNovenas, useMyRuns } from '@/hooks/useNovena';
import { useAuth } from '@/contexts/AuthContext';
import ChristianCross from '@/components/ui/ChristianCross';

const ITEMS_PER_PAGE = 10;

const NovenasPage = () => {
  const { data: novenas, isLoading: novenasLoading, error } = useNovenas();
  const { data: myRuns, isLoading: runsLoading } = useMyRuns();
  const { isAdmin } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // Filter novenas based on search term
  const filteredNovenas = novenas?.filter(novena => {
    const search = searchTerm.toLowerCase();
    return (
      novena.title.toLowerCase().includes(search) ||
      (novena.title_pt && novena.title_pt.toLowerCase().includes(search)) ||
      (novena.description && novena.description.toLowerCase().includes(search)) ||
      (novena.description_pt && novena.description_pt.toLowerCase().includes(search))
    );
  }) || [];

  // Sort: Active runs first (ordered by current day descending), then others
  const sortedNovenas = [...filteredNovenas].sort((a, b) => {
    const runA = myRuns?.find(r => r.novena_id === a.id);
    const runB = myRuns?.find(r => r.novena_id === b.id);

    // Both active
    if (runA && runB) {
      const dayA = (runA.user_day_progress?.filter(p => p.is_completed).length || 0) + 1;
      const dayB = (runB.user_day_progress?.filter(p => p.is_completed).length || 0) + 1;
      return dayB - dayA; // Descending day
    }

    // A active, B not
    if (runA) return -1;
    // B active, A not
    if (runB) return 1;

    // Neither active -> keep original order (or alphabetical?)
    // Let's assume original order is fine (likely ID or Title from backend)
    return 0;
  });

  // Paginate filtered results
  const visibleNovenas = sortedNovenas.slice(0, visibleCount);
  const hasMore = visibleCount < sortedNovenas.length;
  const isLoading = novenasLoading || runsLoading;

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + ITEMS_PER_PAGE);
  };

  return (
    <Layout>
      <div className="container py-12 md:py-20">
        <div className="text-center mb-12">
          <h1 className="font-display text-3xl md:text-5xl font-semibold text-primary mb-4">
            Novenas Disponíveis
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Escolha uma novena para iniciar sua jornada de oração
          </p>

          {/* Focus Suggestion Banner */}
          <div className="max-w-xl mx-auto mb-8 bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-center gap-3 text-left animate-fade-in-up">
            <div className="bg-amber-500/15 p-2 rounded-full shrink-0">
              <BellOff className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            </div>
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-100 text-sm md:text-base">
                Momento de Oração
              </p>
              <p className="text-sm text-muted-foreground leading-snug">
                Recomendamos silenciar as notificações ou distanciar o celular para focar 100% em sua novena.
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar novena..."
              className="pl-10 h-12 rounded-full border-gold/20 focus-visible:ring-gold/30 bg-background/50 backdrop-blur-sm shadow-sm"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setVisibleCount(ITEMS_PER_PAGE); // Reset pagination on search
              }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">Erro ao carregar novenas</p>
          </div>
        ) : visibleNovenas.length > 0 ? (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="space-y-6">
              {visibleNovenas.map((novena) => {
                const run = myRuns?.find(r => r.novena_id === novena.id);
                const completedDays = run?.user_day_progress?.filter(p => p.is_completed).length || 0;
                const currentDay = Math.min(completedDays + 1, 9);

                let buttonText = "Iniciar";
                const buttonIcon = <ArrowRight className="ml-1 h-4 w-4" />;
                let buttonVariant: "gold" | "outline" | "default" | "destructive" | "secondary" | "ghost" | "link" | "hero-gold" = "gold";

                if (run) {
                  if (currentDay === 9) {
                    buttonText = "Finalizar Novena 🎉";
                    buttonVariant = "hero-gold";
                  } else {
                    buttonText = `Seguir para o dia ${currentDay}`;
                    buttonVariant = "outline";
                  }
                }

                return (
                  <Link
                    key={novena.id}
                    to={`/novena/${novena.slug}`}
                    className="block group"
                  >
                    <div
                      className="prayer-card hover:shadow-lg transition-shadow animate-fade-in-up group-hover:border-gold/30"
                    >
                      <div className="flex items-start gap-4 md:gap-6">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gold/10 flex items-center justify-center text-gold shrink-0 transition-colors group-hover:bg-gold/20 overflow-hidden relative">
                          {novena.cover_image_url ? (
                            <img
                              src={novena.cover_image_url}
                              alt={novena.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ChristianCross className="h-6 w-6 md:h-8 md:w-8" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h2 className="font-display text-lg md:text-2xl font-semibold text-primary mb-2 line-clamp-2 group-hover:text-gold transition-colors">
                            {novena.title_pt || novena.title}
                          </h2>
                          <p className="text-muted-foreground text-xs md:text-sm mb-4 line-clamp-3">
                            {novena.description_pt || novena.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 md:gap-4">
                            <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                              {novena.duration} dias
                            </span>
                            <div className={buttonVariant === 'gold' || buttonVariant === 'hero-gold' ? "bg-gold text-white shadow hover:bg-gold/90 h-9 px-3 rounded-md inline-flex items-center justify-center text-sm font-medium transition-colors" : "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-3 rounded-md inline-flex items-center justify-center text-sm font-medium transition-colors"}>
                              {buttonText} {buttonIcon}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {hasMore && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  className="min-w-[200px]"
                >
                  Ver mais novenas
                </Button>
              </div>
            )}

            {/* Request Novena Section */}
            <div className="prayer-card hover:shadow-lg transition-shadow animate-fade-in-up mt-8">
              <div className="flex items-start gap-4 md:gap-6">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gold/10 flex items-center justify-center text-gold shrink-0">
                  <MessageCircle className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-lg md:text-2xl font-semibold text-primary mb-2">
                    Não encontrou a novena que procurava?
                  </h2>
                  <p className="text-muted-foreground text-xs md:text-sm mb-4">
                    Entre em contato conosco! Ficaremos felizes em adicionar sua novena favorita ao aplicativo o mais rápido possível.
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="outline" size="sm" className="gap-2 group hover:text-green-600 hover:border-green-600/30" asChild>
                      <a href="https://wa.me/5561991964111" target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        Pedir pelo WhatsApp
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2" asChild>
                      <a href="mailto:contato@gratianovem.com.br?subject=Sugestão de Novena">
                        <Mail className="h-4 w-4" />
                        Via Email
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gold flex justify-center mb-4">
              <ChristianCross className="h-10 w-10 md:h-12 md:w-12" />
            </div>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "Nenhuma novena encontrada com este termo." : "Nenhuma novena disponível no momento."}
            </p>
            {isAdmin && !searchTerm && (
              <div className="bg-muted/50 p-6 rounded-lg max-w-md mx-auto border border-border">
                <p className="font-medium text-foreground mb-2">Painel do Administrador</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Se você criou novenas mas elas não aparecem aqui, verifique se elas estão marcadas como "Ativa" no editor.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/admin/novenas">
                    Gerenciar Novenas
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default NovenasPage;
