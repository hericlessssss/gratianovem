import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2, Search, MessageCircle, Mail, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Layout from '@/components/layout/Layout';
import { useNovenas, useMyRuns } from '@/hooks/useNovena';
import { useAuth } from '@/contexts/AuthContext';
import ChristianCross from '@/components/ui/ChristianCross';

const ITEMS_PER_PAGE = 12;

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
      <div className="min-h-screen bg-primary">
        <div className="container py-12 md:py-20">
          <div className="text-center mb-12">
            <h1 className="font-display text-3xl md:text-5xl font-semibold text-white mb-4">
              Novenas Disponíveis
            </h1>
            <p className="text-white/80 max-w-xl mx-auto mb-8">
              Escolha uma novena para iniciar sua jornada de oração
            </p>

            {/* Focus Suggestion Banner */}
            <div className="max-w-xl mx-auto mb-8 bg-gold/10 border border-gold/20 rounded-lg p-4 flex items-center gap-3 text-left animate-fade-in-up">
              <div className="bg-gold/20 p-2 rounded-full shrink-0">
                <BellOff className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="font-medium text-gold text-sm md:text-base">
                  Momento de Oração
                </p>
                <p className="text-sm text-white/70 leading-snug">
                  Recomendamos silenciar as notificações ou distanciar o celular para focar 100% em sua novena.
                </p>
              </div>
            </div>

            {/* Search Box */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
              <Input
                type="text"
                placeholder="Buscar novena..."
                className="pl-10 h-12 rounded-full border-white/20 focus-visible:ring-gold/30 bg-primary-foreground/5 text-white placeholder:text-white/40 backdrop-blur-sm shadow-sm"
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
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      buttonText = `Continuar dia ${currentDay}`;
                      // Use gold for continue as well to make it pop on blue, or outline-white
                      buttonVariant = "outline";
                    }
                  }

                  return (
                    <Link
                      key={novena.id}
                      to={`/novena/${novena.slug}`}
                      className="block group h-full"
                    >
                      <div className="h-full bg-primary-foreground/5 backdrop-blur-sm hover:bg-primary-foreground/10 transition-all duration-300 border border-white/10 hover:border-gold/50 rounded-xl p-6 flex flex-col items-start justify-between group hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]">
                        <div className="w-full">
                          <div className="mb-6 w-full h-48 md:h-48 rounded-lg overflow-hidden bg-black/20 relative group-hover:shadow-inner transition-all">
                            {novena.cover_image_url ? (
                              <img
                                src={novena.cover_image_url}
                                alt={novena.title}
                                className="w-full h-full object-cover object-top opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gold/30">
                                <ChristianCross className="h-16 w-16" />
                              </div>
                            )}
                          </div>

                          <h2 className="font-display text-xl font-semibold text-white mb-3 line-clamp-2 min-h-[3.5rem] group-hover:text-gold transition-colors">
                            {novena.title_pt || novena.title}
                          </h2>
                          <p className="text-white/70 text-sm mb-6 line-clamp-3 min-h-[3.75rem]">
                            {novena.description_pt || novena.description}
                          </p>
                        </div>

                        <div className="w-full flex items-center justify-between gap-3 mt-auto">
                          <span className="text-xs text-white/60 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                            {novena.duration} dias
                          </span>
                          <div className={buttonVariant === 'gold' || buttonVariant === 'hero-gold'
                            ? "bg-gold text-white shadow hover:bg-gold/90 h-9 px-4 rounded-md inline-flex items-center justify-center text-sm font-medium transition-colors"
                            : "border border-white/20 text-white hover:bg-gold hover:text-primary-foreground hover:border-gold h-9 px-4 rounded-md inline-flex items-center justify-center text-sm font-medium transition-colors"
                          }>
                            {buttonText === "Iniciar" ? "Iniciar Novena" : buttonText} {buttonIcon}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {hasMore && (
                <div className="text-center pt-8">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    className="min-w-[200px] border-white/20 text-white bg-transparent hover:bg-gold hover:text-primary-foreground hover:border-gold"
                  >
                    Ver mais novenas
                  </Button>
                </div>
              )}

              {/* Request Novena Section */}
              <div className="bg-primary-foreground/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 md:p-8 mt-12 animate-fade-in-up">
                <div className="flex items-start gap-4 md:gap-6">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gold/10 flex items-center justify-center text-gold shrink-0">
                    <MessageCircle className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-display text-lg md:text-2xl font-semibold text-white mb-2">
                      Não encontrou a novena que procurava?
                    </h2>
                    <p className="text-white/70 text-xs md:text-sm mb-4">
                      Entre em contato conosco! Ficaremos felizes em adicionar sua novena favorita ao aplicativo o mais rápido possível.
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button variant="outline" size="sm" className="gap-2 group border-white/20 text-white bg-transparent hover:text-green-400 hover:border-green-400/50 hover:bg-transparent" asChild>
                        <a href="https://wa.me/5561991964111" target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          Pedir pelo WhatsApp
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2 border-white/20 text-white bg-transparent hover:bg-white/10 hover:text-white hover:border-white/30" asChild>
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
              <p className="text-white/60 mb-4">
                {searchTerm ? "Nenhuma novena encontrada com este termo." : "Nenhuma novena disponível no momento."}
              </p>
              {isAdmin && !searchTerm && (
                <div className="bg-white/5 p-6 rounded-lg max-w-md mx-auto border border-white/10">
                  <p className="font-medium text-white mb-2">Painel do Administrador</p>
                  <p className="text-sm text-white/60 mb-4">
                    Se você criou novenas mas elas não aparecem aqui, verifique se elas estão marcadas como "Ativa" no editor.
                  </p>
                  <Button asChild variant="outline" className="w-full border-white/20 text-white hover:bg-gold hover:text-primary-foreground hover:border-gold">
                    <Link to="/admin/novenas">
                      Gerenciar Novenas
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default NovenasPage;
