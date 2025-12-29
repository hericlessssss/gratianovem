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
  useDayDocument
} from '@/hooks/useNovena';
import { toast } from '@/hooks/use-toast';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ChristianCross from '@/components/ui/ChristianCross';
import { NovenaRenderer } from '@/components/novena/NovenaRenderer';
import { Ornament } from '@/components/ui/Ornaments';
import { JSONContent } from '@tiptap/react';

const NovenaPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading, isAnonymous } = useAuth();
  const [currentDay, setCurrentDay] = useState(1);
  const [localChecklist, setLocalChecklist] = useState<Record<string, number | boolean>>({});
  const [isInitializing, setIsInitializing] = useState(true);

  // Fetch novena data
  const { data: novena, isLoading: novenaLoading } = useNovena(slug || '');
  const { data: days, isLoading: daysLoading } = useNovenaDays(novena?.id);

  // Get current day data
  const currentDayData = days?.find(d => d.day_number === currentDay);

  // Use new hook (assuming PT for now)
  const { data: dayDoc, isLoading: docLoading } = useDayDocument(currentDayData?.id, 'pt');

  // Helper to extract checklist items from doc
  const checklistItems = useMemo(() => {
    if (!dayDoc || !dayDoc.content) return [];
    let items: any[] = [];
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
    // PREVIEW MODE: If no run exists, EVERYTHING IS UNLOCKED for viewing
    if (!run) return { isLocked: false, availableAt: null };

    if (!allProgress) return { isLocked: false, availableAt: null };

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
    checklistItems.forEach((item: any) => {
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
  // We wait for docLoading too
  const isLoading = novenaLoading || daysLoading || authLoading || isInitializing;
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

          {currentDay === 1 && (novena.description_pt || novena.description) && (
            <p className="text-muted-foreground text-base mt-4 mb-6 leading-relaxed max-w-2xl whitespace-pre-line">
              {novena.description_pt || novena.description}
            </p>
          )}

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

        {/* Start Novena CTA - Always visible if no run, but not blocking content anymore */}
        {!run && (
          <div className="rounded-lg border bg-gold/10 p-4 mb-6 flex items-center gap-3">
            <div className="bg-gold/20 p-2 rounded-full shrink-0">
              <ChristianCross className="h-5 w-5 text-gold-dark" />
            </div>
            <div>
              <h3 className="font-semibold text-primary">Modo Visualização</h3>
              <p className="text-sm text-muted-foreground">Você está visualizando sem salvar progresso.</p>
            </div>
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
              <div className={`mb-8 ${lockStatus.isLocked ? 'opacity-75' : ''}`}>
                {dayDoc && (
                  <NovenaRenderer
                    doc={dayDoc}
                    checklistState={localChecklist}
                    onChecklistUpdate={handleChecklistUpdate}
                    isLocked={lockStatus.isLocked}
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
                    {!run ? "Iniciar Novena para Concluir" : `Concluir Dia ${currentDay}`}
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
    </Layout >
  );
};

export default NovenaPage;
