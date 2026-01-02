import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, Loader2, Shield, Lock, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import {
  useNovena,
  useNovenaDays,
  useNovenaRun,
  useCreateNovenaRun,
  useDayProgress,
  useUpdateDayProgress,
  useRunProgress,
  useCompleteNovenaRun,
  useDayDocument,
  useNovenaStats
} from '@/hooks/useNovena';
import { toast } from '@/hooks/use-toast';
import { format, addDays, isBefore, startOfDay, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ChristianCross from '@/components/ui/ChristianCross';
import { NovenaRenderer } from '@/components/novena/NovenaRenderer';
import { Ornament } from '@/components/ui/Ornaments';
import { NovenaHero } from '@/components/novena/NovenaHero';
import { JSONContent } from '@tiptap/react';

const NovenaPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading, isAnonymous } = useAuth();
  // Navigation State
  const [currentDay, setCurrentDay] = useState(1);
  const [localChecklist, setLocalChecklist] = useState<Record<string, number | boolean>>({});
  const [hasJumpedToCurrentDay, setHasJumpedToCurrentDay] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch novena data
  const { data: novena, isLoading: novenaLoading } = useNovena(slug || '');
  const { data: days, isLoading: daysLoading } = useNovenaDays(novena?.id);

  // Get current day data
  const currentDayData = days?.find(d => d.day_number === currentDay);

  // Use new hook (assuming PT for now)
  const { data: dayDoc, isLoading: docLoading } = useDayDocument(currentDayData?.id, 'pt');

  // Helper to extract checklist items from doc
  // Helper to extract checklist items from doc
  interface ChecklistItem {
    id: string;
    repetition_count: number;
    [key: string]: unknown;
  }

  const checklistItems = useMemo(() => {
    if (!dayDoc || !dayDoc.content) return [];
    let items: ChecklistItem[] = [];
    dayDoc.content.forEach(node => {
      if (node.type === 'prayerChecklist' && node.attrs?.items) {
        items = [...items, ...node.attrs.items];
      }
      // If we allow nested checklists later, we'd need recursion
      if (node.content) {
        node.content.forEach(child => {
          if (child.type === 'prayerChecklist' && child.attrs?.items) {
            items = [...items, ...child.attrs.items];
          }
        });
      }
    });
    return items;
  }, [dayDoc]);

  // User progress
  const { data: stats } = useNovenaStats(novena?.id);
  const { data: run, isLoading: runLoading, refetch: refetchRun } = useNovenaRun(novena?.id);
  const { data: dayProgress, isLoading: progressLoading } = useDayProgress(run?.id, currentDay);
  const { data: allProgress, isLoading: allProgressLoading } = useRunProgress(run?.id);
  const createRun = useCreateNovenaRun();
  const updateProgress = useUpdateDayProgress();
  const completeRun = useCompleteNovenaRun();

  // Load saved checklist state
  useEffect(() => {
    if (dayProgress?.checklist_state) {
      setLocalChecklist(dayProgress.checklist_state);
    } else {
      setLocalChecklist({});
    }
  }, [dayProgress, currentDay]);

  // Auto-advance logic: Run once when allProgress is loaded
  useEffect(() => {
    if (allProgress && !hasJumpedToCurrentDay) {
      if (allProgress.length > 0) {
        const completedDays = allProgress.filter(p => p.is_completed).map(p => p.day_number);
        // If no days completed, max is 0 -> next is 1. If day 1 completed, max is 1 -> next is 2.
        const maxCompleted = completedDays.length > 0 ? Math.max(...completedDays) : 0;

        // If novena is finished (9 days completed), maybe show day 9 or 1?
        // User said: "Se ele tá no dia 4... abre dia 4". Implies the day TO DO.
        // So if day 3 is done, open 4.
        const nextDay = Math.min(maxCompleted + 1, 9);

        setCurrentDay(nextDay);
      }
      setHasJumpedToCurrentDay(true);
    }
  }, [allProgress, hasJumpedToCurrentDay]);

  // Lock Logic
  const lockStatus = useMemo(() => {
    // PREVIEW MODE: If no run exists, EVERYTHING IS UNLOCKED for viewing (but ReadOnly handled by prop)
    if (!run) return { isLocked: false, availableAt: null };

    // If we haven't loaded progress yet, don't lock incorrectly, wait?
    // Safe default is unlocked for day 1, but for others we need checks.
    if (!allProgress) return { isLocked: false, availableAt: null };

    // Day 1 is always unlocked if run exists
    if (currentDay === 1) return { isLocked: false, availableAt: null };

    // Find previous day progress
    const prevDayProgress = allProgress.find(p => p.day_number === currentDay - 1);

    // If previous day not completed, lock current
    if (!prevDayProgress?.is_completed) {
      return { isLocked: true, reason: 'previous_incomplete', availableAt: null };
    }

    // Time Lock Removed as requested.
    // Users can proceed immediately after finishing previous day.

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

  // Handle checklist toggle
  const handleChecklistUpdate = async (itemId: string, newValue: number | boolean) => {
    const newState = {
      ...localChecklist,
      [itemId]: newValue,
    };
    setLocalChecklist(newState);

    if (!run) return; // Only save to backend if running

    try {
      await updateProgress.mutateAsync({
        runId: run.id,
        dayNumber: currentDay,
        checklistState: newState,
        isCompleted: false, // Explicitly false
      });
    } catch (error) {
      // Revert on error if we were saving
      // For preview mode, no reversion needed as it's local
      setLocalChecklist(localChecklist);
    }
  };



  // ... (skipping unchanged lines until we hit the syntax error at bottom)


  // Mark day as complete
  const handleCompleteDay = async () => {
    if (!run || !checklistItems) return;

    // Ensure everything is completed visually
    // Even if checklistItems is empty (legacy data migrated without checklist), we allow completion.
    const allCompleted: Record<string, number | boolean> = {};
    checklistItems.forEach((item: ChecklistItem) => {
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
        setShowSuccess(true);
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

  if (showSuccess) {
    return (
      <Layout>
        <div className="container max-w-2xl py-20 flex flex-col items-center justify-center text-center animate-in fade-in duration-700">
          <div className="mb-8 p-6 bg-gold/10 rounded-full">
            <ChristianCross className="w-16 h-16 text-gold" />
          </div>

          <h1 className="font-display text-4xl font-semibold text-primary mb-6">
            Jornada Concluída 🙏
          </h1>

          <div className="space-y-6 text-muted-foreground text-lg mb-12 max-w-lg mx-auto">
            <p>
              Parabéns pela sua perseverança e fé. Você completou estes 9 dias de oração com dedicação.
            </p>
            <p className="italic font-medium text-primary/80">
              "Espere no Senhor, anima-te, e ele fortalecerá o teu coração."
              <br /><span className="text-sm not-italic mt-1 block">- Salmo 27:14</span>
            </p>
            <p>
              Confie que sua oração foi ouvida. O tempo de Deus é perfeito, e a graça que você busca está sendo cuidada com amor infinito.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <Button asChild variant="outline" className="flex-1 h-12 text-base">
              <Link to="/novenas">
                Ver outras Novenas
              </Link>
            </Button>

            <Button asChild variant="gold" className="flex-1 h-12 text-base shadow-lg hover:shadow-xl transition-all">
              <Link to="/testimonials">
                Deixar Testemunho
              </Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Navigation
  const goToPreviousDay = () => setCurrentDay(prev => Math.max(prev - 1, 1));
  const goToNextDay = () => setCurrentDay(prev => Math.min(prev + 1, 9));

  // Loading states
  // We wait for docLoading too
  const isLoading = novenaLoading || daysLoading || authLoading;
  const isDayLoading = docLoading || runLoading || progressLoading;

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
      <NovenaHero
        title={novena.title_pt || novena.title}
        description={novena.description_pt || novena.description}
        imageUrl={novena.cover_image_url}
        progressPercent={progressPercent}
        completedDays={completedDays}
        totalDays={9}
      />

      <div className="container py-8 md:py-12 max-w-3xl">

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

        {/* Start Novena CTA - Always visible if no run, but not blocking content anymore */}
        {!run && (
          <div className="rounded-lg border bg-gold/10 p-4 mb-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gold/20 p-2 rounded-full shrink-0">
                <ChristianCross className="h-5 w-5 text-gold-dark" />
              </div>
              <div>
                <h3 className="font-semibold text-primary">
                  {stats?.completion_count && stats.completion_count > 0
                    ? "Jornada Concluída"
                    : "Modo Visualização"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {stats?.completion_count && stats.completion_count > 0
                    ? `Você completou esta novena ${stats.completion_count} vez(es).`
                    : "Você está visualizando sem salvar progresso."}
                </p>
              </div>
            </div>

            {/* Restart / Cooldown Logic */}
            {/* Restart Logic - No Cooldown */}
            {stats?.completion_count && stats.completion_count > 0 && (
              <Button onClick={handleStartNovena} disabled={createRun.isPending} variant="gold" className="w-full sm:w-auto self-start">
                {createRun.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reiniciar Jornada Espiritual
              </Button>
            )}
          </div>
        )}

        {/* Day Navigation - Always Visible now */}
        {(run || !run) && (
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

            {/* Banner: Back to Active Day */}
            {run && allProgress && (() => {
              const completedDays = allProgress.filter(p => p.is_completed).map(p => p.day_number);
              const maxCompleted = completedDays.length > 0 ? Math.max(...completedDays) : 0;
              const activeDay = Math.min(maxCompleted + 1, 9);

              if (currentDay !== activeDay) {
                return (
                  <div
                    className="mb-6 p-3 bg-primary/5 border border-primary/10 rounded-lg flex items-center justify-between cursor-pointer hover:bg-primary/10 transition-colors"
                    onClick={() => setCurrentDay(activeDay)}
                  >
                    <span className="text-sm text-muted-foreground">
                      Você está atualmente no <strong>Dia {activeDay}</strong>
                    </span>
                    <div className="text-xs font-medium text-primary flex items-center">
                      Ir para o dia
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </div>
                  </div>
                );
              }
              return null;
            })()}

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
                {lockStatus.reason === 'previous_incomplete' && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Para marcar este dia como concluído, finalize primeiro o <strong>Dia {currentDay - 1}</strong>.
                    </p>
                    <Button variant="outline" size="sm" onClick={goToPreviousDay}>
                      Ir para o Dia {currentDay - 1}
                    </Button>
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
              <div className={`mb-8 ${lockStatus.isLocked ? 'opacity-75' : ''}`}>
                {dayDoc && (
                  <NovenaRenderer
                    doc={dayDoc}
                    checklistState={localChecklist}
                    onChecklistUpdate={handleChecklistUpdate}
                    isLocked={lockStatus.isLocked}
                    readOnly={!run}
                  />
                )}
                {!dayDoc && !isDayLoading && (
                  <div className="text-center text-muted-foreground py-10">
                    Conteúdo não disponível.
                  </div>
                )}
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
                    onClick={() => {
                      if (!run) {
                        handleStartNovena();
                      } else {
                        handleCompleteDay();
                      }
                    }}
                    disabled={updateProgress.isPending || createRun.isPending}
                  >
                    {updateProgress.isPending || createRun.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {!run ? "Iniciar Novena" : `Concluir Dia ${currentDay}`}
                  </Button>
                )}

                {currentDay < 9 && isDayComplete && (
                  <div className="mt-8 pt-8 border-t">
                    <p className="text-muted-foreground mb-4">
                      Continue sua jornada espiritual.
                    </p>
                    <Button variant="outline" onClick={goToNextDay}>
                      Ir para o Dia {currentDay + 1}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Layout >
  );
};

export default NovenaPage;
