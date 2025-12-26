import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, Loader2, Shield, Lock, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import {
  useNovena,
  useNovenaDays,
  useDayContent,
  useDayChecklist,
  useNovenaRun,
  useCreateNovenaRun,
  useDayProgress,
  useUpdateDayProgress,
  useRunProgress,
  useCompleteNovenaRun,
} from '@/hooks/useNovena';
import { toast } from '@/hooks/use-toast';
import { format, addDays, isBefore, startOfDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ChristianCross from '@/components/ui/ChristianCross';

const NovenaPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading, signInAnonymously, isAnonymous } = useAuth();
  const [currentDay, setCurrentDay] = useState(1);
  const [localChecklist, setLocalChecklist] = useState<Record<string, number | boolean>>({});
  const [isInitializing, setIsInitializing] = useState(true);

  // Fetch novena data
  const { data: novena, isLoading: novenaLoading } = useNovena(slug || '');
  const { data: days, isLoading: daysLoading } = useNovenaDays(novena?.id);

  // Get current day data
  const currentDayData = days?.find(d => d.day_number === currentDay);
  const { data: contentBlocks, isLoading: contentLoading } = useDayContent(currentDayData?.id);
  const { data: checklistItems, isLoading: checklistLoading } = useDayChecklist(currentDayData?.id);

  // User progress
  const { data: run, isLoading: runLoading, refetch: refetchRun } = useNovenaRun(novena?.id);
  const { data: dayProgress, isLoading: progressLoading } = useDayProgress(run?.id, currentDay);
  const { data: allProgress } = useRunProgress(run?.id);
  const createRun = useCreateNovenaRun();
  const updateProgress = useUpdateDayProgress();
  const completeRun = useCompleteNovenaRun();

  // Initialize anonymous auth if needed - DISABLED for true Guest Mode
  // We now support running without any auth via LocalStorage
  useEffect(() => {
    if (!authLoading) {
      setIsInitializing(false);
    }
  }, [authLoading]);

  // Load saved checklist state
  useEffect(() => {
    if (dayProgress?.checklist_state) {
      setLocalChecklist(dayProgress.checklist_state);
    } else {
      setLocalChecklist({});
    }
  }, [dayProgress, currentDay]);

  // Auto-advance logic (Only on initial load/mount)
  useEffect(() => {
    if (allProgress && allProgress.length > 0 && isInitializing) {
      const completedDays = allProgress.filter(p => p.is_completed).map(p => p.day_number);
      const maxCompleted = Math.max(0, ...completedDays);
      const nextDay = Math.min(maxCompleted + 1, 9);
      setCurrentDay(nextDay);
    }
  }, [allProgress, isInitializing]);

  // Lock Logic
  const lockStatus = useMemo(() => {
    if (!run || !allProgress) return { isLocked: false, availableAt: null };

    // Day 1 is always unlocked if run exists
    if (currentDay === 1) return { isLocked: false, availableAt: null };

    // Find previous day progress
    const prevDayProgress = allProgress.find(p => p.day_number === currentDay - 1);

    // If previous day not completed, lock current
    if (!prevDayProgress?.is_completed) {
      return { isLocked: true, reason: 'previous_incomplete', availableAt: null };
    }

    // Time Lock Calculation
    if (prevDayProgress.completed_at) {
      const completedDate = new Date(prevDayProgress.completed_at);
      // Available at 00:00:00 of the NEXT day after completion
      const nextDayStart = startOfDay(addDays(completedDate, 1));

      if (isBefore(new Date(), nextDayStart)) {
        return { isLocked: true, reason: 'time_lock', availableAt: nextDayStart };
      }
    }

    return { isLocked: false, availableAt: null };

  }, [currentDay, allProgress, run]);


  // Create run if needed
  const handleStartNovena = async () => {
    if (!novena) return;

    try {
      await createRun.mutateAsync(novena.id);
      refetchRun();
      toast({
        title: "Novena Iniciada!",
        description: "Que Deus abençoe sua jornada de oração.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível iniciar a novena.",
        variant: "destructive",
      });
    }
  };

  // Handle checklist toggle (DECOUPLED from completion)
  // Supports both simple boolean toggle and counter update
  const handleChecklistUpdate = async (itemId: string, newValue: number | boolean) => {
    if (!run) return;

    const newState = {
      ...localChecklist,
      [itemId]: newValue,
    };
    setLocalChecklist(newState);

    try {
      await updateProgress.mutateAsync({
        runId: run.id,
        dayNumber: currentDay,
        checklistState: newState,
        isCompleted: false, // Explicitly false
      });
    } catch (error) {
      setLocalChecklist(localChecklist);
    }
  };

  // Mark day as complete
  const handleCompleteDay = async () => {
    if (!run || !checklistItems) return;

    // Ensure everything is completed visually
    const allCompleted: Record<string, number | boolean> = {};
    checklistItems.forEach(item => {
      // If it has repetition count, set to max, otherwise true
      allCompleted[item.id] = item.repetition_count > 1 ? item.repetition_count : true;
    });
    setLocalChecklist(allCompleted);

    try {
      await updateProgress.mutateAsync({
        runId: run.id,
        dayNumber: currentDay,
        checklistState: allCompleted,
        isCompleted: true, // Only HERE we mark as complete
      });

      if (currentDay === 9) {
        await completeRun.mutateAsync(run.id);
        toast({
          title: "Novena Completa! 🙏",
          description: "Parabéns por completar a novena. Que São José interceda por você!",
        });
      } else {
        toast({
          title: `Dia ${currentDay} Completo!`,
          description: "Continue amanhã com o próximo dia.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o progresso.",
        variant: "destructive",
      });
    }
  };

  // Navigation
  const goToPreviousDay = () => setCurrentDay(prev => Math.max(prev - 1, 1));
  const goToNextDay = () => setCurrentDay(prev => Math.min(prev + 1, 9));

  // Loading states
  const isLoading = novenaLoading || daysLoading || authLoading || isInitializing;
  const isDayLoading = contentLoading || checklistLoading || runLoading || progressLoading;

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-20 flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-gold mb-4" />
          <p className="text-muted-foreground">Carregando novena...</p>
        </div>
      </Layout>
    );
  }

  if (!novena) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="font-display text-3xl font-semibold text-primary mb-4">
            Novena não encontrada
          </h1>
          <Button asChild variant="gold">
            <Link to="/novenas">Ver Novenas</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  // Calculate progress
  const completedDays = allProgress?.filter(p => p.is_completed).length ?? 0;
  const progressPercent = (completedDays / 9) * 100;
  const isDayComplete = dayProgress?.is_completed ?? false;

  return (
    <Layout hideFooter>
      <div className="container py-6 md:py-10 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/novenas"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Link>

          <h1 className="font-display text-2xl md:text-3xl font-semibold text-primary mb-2">
            {novena.title_pt || novena.title}
          </h1>

          {/* Progress Bar */}
          <div className="flex items-center gap-4 mt-4">
            <Progress value={progressPercent} className="flex-1 h-2" />
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {completedDays}/9 dias
            </span>
          </div>
        </div>

        {/* Anonymous warning - Show for Guest (no user) or Anonymous User */}
        {(isAnonymous || !user) && (
          <div className="mb-6 p-4 bg-gold/10 border border-gold/20 rounded-xl flex items-start gap-3">
            <Shield className="h-5 w-5 text-gold shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-foreground">
                Seu progresso está salvo, mas para não perdê-lo, vincule um email.
              </p>
              <Button asChild variant="link" size="sm" className="px-0 h-auto text-gold">
                <Link to="/settings">Vincular Email</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Start Novena CTA */}
        {!run && (
          <div className="prayer-card text-center mb-8">
            <div className="text-gold flex justify-center mb-4">
              <ChristianCross className="h-8 w-8" />
            </div>
            <h2 className="font-display text-xl font-semibold text-primary mb-2">
              Iniciar Novena
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Ao iniciar, seu progresso será salvo automaticamente.
            </p>
            <Button
              variant="hero-gold"
              onClick={handleStartNovena}
              disabled={createRun.isPending}
            >
              {createRun.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Começar Dia 1
            </Button>
          </div>
        )}

        {/* Day Navigation */}
        {run && (
          <>
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPreviousDay}
                disabled={currentDay === 1}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <div className="text-center">
                <span className="text-sm text-muted-foreground">Dia</span>
                <h2 className="font-display text-3xl font-semibold text-primary">
                  {currentDay}
                </h2>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={goToNextDay}
                disabled={currentDay === 9}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Day Title */}
            {currentDayData && (
              <h3 className="font-display text-xl text-center text-gold mb-8">
                {currentDayData.title_pt || currentDayData.title}
              </h3>
            )}

            {/* LOCKED STATE BANNER */}
            {lockStatus.isLocked && (
              <div className="prayer-card text-center py-8 px-6 mb-8 border-gold/20 bg-gold/5">
                <div className="bg-background items-center justify-center inline-flex w-12 h-12 rounded-full mb-4 shadow-sm border border-gold/10">
                  <Lock className="w-5 h-5 text-gold" />
                </div>
                <h3 className="font-display text-lg font-semibold text-primary mb-2">
                  Dia Bloqueado
                </h3>
                {lockStatus.reason === 'previous_incomplete' ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Para marcar este dia como concluído, finalize primeiro o <strong>Dia {currentDay - 1}</strong>.
                    </p>
                    <Button variant="outline" size="sm" onClick={goToPreviousDay}>
                      Ir para o Dia {currentDay - 1}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      A conclusão deste dia estará disponível a partir de:
                    </p>
                    <div className="flex items-center justify-center gap-2 text-gold font-medium bg-background py-1.5 px-3 rounded-lg inline-flex mx-auto border border-gold/10 shadow-sm text-sm">
                      <Clock className="w-3 h-3" />
                      {lockStatus.availableAt && format(lockStatus.availableAt, "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Content Blocks (Always Visible) */}
            {isDayLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gold" />
              </div>
            ) : (
              <div className={`space-y-6 mb-8 ${lockStatus.isLocked ? 'opacity-75' : ''}`}>
                {(() => {
                  const hasChecklistBlock = contentBlocks?.some(b => (b.block_type as string) === 'checklist');

                  const renderChecklist = () => {
                    if (!checklistItems || checklistItems.length === 0) return null;
                    return (
                      <div className={`prayer-card mb-8 ${lockStatus.isLocked ? 'opacity-60 pointer-events-none' : ''}`}>
                        <h4 className="font-display text-lg font-semibold text-primary mb-4">
                          Orações do Dia
                        </h4>
                        <div className="space-y-6">
                          {checklistItems.map((item) => {
                            const isBeadMode = item.repetition_count > 1;
                            const currentValue = localChecklist[item.id];

                            // Helper to get number value safely
                            const getCount = () => {
                              if (typeof currentValue === 'number') return currentValue;
                              return currentValue ? item.repetition_count : 0;
                            };

                            const count = getCount();

                            return (
                              <div key={item.id} className="space-y-2">
                                {isBeadMode ? (
                                  // BEAD MODE
                                  <div className="p-4 rounded-lg bg-gold/5 border border-gold/10">
                                    <p className="font-medium text-foreground mb-3">
                                      {item.label_pt || item.label}
                                    </p>
                                    <div className="flex flex-wrap gap-3 items-center">
                                      {Array.from({ length: item.repetition_count }).map((_, idx) => {
                                        const beadNum = idx + 1;
                                        const isActive = count >= beadNum;
                                        return (
                                          <button
                                            key={beadNum}
                                            onClick={() => handleChecklistUpdate(item.id, isActive && count === beadNum ? beadNum - 1 : beadNum)}
                                            disabled={updateProgress.isPending || isDayComplete || lockStatus.isLocked}
                                            className={`
                                            w-8 h-8 rounded-full border-2 transition-all duration-300 flex items-center justify-center
                                            ${isActive
                                                ? 'bg-gold border-gold text-white shadow-md scale-110'
                                                : 'bg-transparent border-gold/30 hover:border-gold/60 text-muted-foreground'}
                                          `}
                                          >
                                            {isActive && <Check className="w-4 h-4" />}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ) : (
                                  // CHECKBOX MODE
                                  <label
                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${currentValue
                                      ? 'bg-gold/10'
                                      : 'hover:bg-muted/50'
                                      }`}
                                  >
                                    <Checkbox
                                      checked={!!currentValue}
                                      onCheckedChange={(checked) => handleChecklistUpdate(item.id, !!checked)}
                                      disabled={updateProgress.isPending || isDayComplete || lockStatus.isLocked}
                                      className="data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                                    />
                                    <span className={`flex-1 ${currentValue ? 'text-muted-foreground line-through' : 'text-foreground'
                                      }`}>
                                      {item.label_pt || item.label}
                                    </span>
                                  </label>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  };

                  return (
                    <>
                      {contentBlocks?.map((block) => {
                        if ((block.block_type as string) === 'checklist') {
                          return renderChecklist();
                        }

                        const content = block.content_pt || block.content;
                        const formattedContent = content?.replace(/\\n/g, '\n');

                        return (
                          <div key={block.id}>
                            {block.block_type === 'paragraph' && (
                              <p className="text-foreground leading-relaxed whitespace-pre-line">
                                {formattedContent}
                              </p>
                            )}
                            {block.block_type === 'prayer' && (
                              <div className="prayer-card">
                                <p className="text-foreground leading-relaxed whitespace-pre-line">
                                  {formattedContent}
                                </p>
                              </div>
                            )}
                            {block.block_type === 'quote' && (
                              <blockquote className="quote-block">
                                <p className="text-foreground italic whitespace-pre-line">
                                  {formattedContent}
                                </p>
                              </blockquote>
                            )}
                            {block.block_type === 'intention' && (
                              <div className="intention-block">
                                <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
                                  Intenção
                                </p>
                                <p className="text-foreground leading-relaxed whitespace-pre-line">
                                  {formattedContent}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {!hasChecklistBlock && renderChecklist()}
                    </>
                  );
                })()}
              </div>
            )}


            {/* Complete Day Button (Hidden if Locked) */}
            {!lockStatus.isLocked && (
              <div className="text-center pb-8">
                {isDayComplete ? (
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-gold/10 rounded-full text-gold">
                    <Check className="h-5 w-5" />
                    <span className="font-medium">Dia Completo</span>
                  </div>
                ) : (
                  <Button
                    variant="hero-gold"
                    size="xl"
                    onClick={handleCompleteDay}
                    disabled={updateProgress.isPending}
                  >
                    {updateProgress.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Concluir Dia {currentDay}
                  </Button>
                )}

                {currentDay < 9 && isDayComplete && (
                  <div className="mt-8 pt-8 border-t">
                    <p className="text-muted-foreground mb-4">
                      O dia {currentDay + 1} estará disponível amanhã.
                    </p>
                    <Button variant="outline" onClick={goToNextDay}>
                      Ver próximo dia
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default NovenaPage;
