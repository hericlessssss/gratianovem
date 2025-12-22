import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, Loader2, Shield } from 'lucide-react';
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

const NovenaPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading, signInAnonymously, isAnonymous } = useAuth();
  const [currentDay, setCurrentDay] = useState(1);
  const [localChecklist, setLocalChecklist] = useState<Record<string, boolean>>({});
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

  // Initialize anonymous auth if needed
  useEffect(() => {
    const initAuth = async () => {
      if (!authLoading && !user) {
        await signInAnonymously();
      }
      setIsInitializing(false);
    };
    initAuth();
  }, [authLoading, user, signInAnonymously]);

  // Load saved checklist state
  useEffect(() => {
    if (dayProgress?.checklist_state) {
      setLocalChecklist(dayProgress.checklist_state as Record<string, boolean>);
    } else {
      setLocalChecklist({});
    }
  }, [dayProgress, currentDay]);

  // Find the current progress day
  useEffect(() => {
    if (allProgress && allProgress.length > 0) {
      // Find the first incomplete day or the last completed + 1
      const completedDays = allProgress.filter(p => p.is_completed).map(p => p.day_number);
      const maxCompleted = Math.max(0, ...completedDays);
      const nextDay = Math.min(maxCompleted + 1, 9);
      setCurrentDay(nextDay);
    }
  }, [allProgress]);

  // Create run if needed
  const handleStartNovena = async () => {
    if (!novena || !user) return;
    
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
  const handleChecklistToggle = async (itemId: string) => {
    if (!run) return;
    
    const newState = {
      ...localChecklist,
      [itemId]: !localChecklist[itemId],
    };
    setLocalChecklist(newState);
    
    // Check if all items are completed
    const allChecked = checklistItems?.every(item => newState[item.id]) ?? false;
    
    try {
      await updateProgress.mutateAsync({
        runId: run.id,
        dayNumber: currentDay,
        checklistState: newState,
        isCompleted: allChecked,
      });
    } catch (error) {
      // Revert on error
      setLocalChecklist(localChecklist);
    }
  };

  // Mark day as complete
  const handleCompleteDay = async () => {
    if (!run || !checklistItems) return;
    
    const allChecked: Record<string, boolean> = {};
    checklistItems.forEach(item => {
      allChecked[item.id] = true;
    });
    
    setLocalChecklist(allChecked);
    
    try {
      await updateProgress.mutateAsync({
        runId: run.id,
        dayNumber: currentDay,
        checklistState: allChecked,
        isCompleted: true,
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
        setCurrentDay(prev => Math.min(prev + 1, 9));
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

        {/* Anonymous warning */}
        {isAnonymous && (
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
        {!run && user && (
          <div className="prayer-card text-center mb-8">
            <span className="text-gold text-3xl block mb-4">✝</span>
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

            {/* Content Blocks */}
            {isDayLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gold" />
              </div>
            ) : (
              <div className="space-y-6 mb-8">
                {contentBlocks?.map((block) => (
                  <div key={block.id}>
                    {block.block_type === 'paragraph' && (
                      <p className="text-foreground leading-relaxed">
                        {block.content_pt || block.content}
                      </p>
                    )}
                    {block.block_type === 'prayer' && (
                      <div className="prayer-card">
                        <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                          {block.content_pt || block.content}
                        </p>
                      </div>
                    )}
                    {block.block_type === 'quote' && (
                      <blockquote className="quote-block">
                        <p className="text-foreground italic">
                          {block.content_pt || block.content}
                        </p>
                      </blockquote>
                    )}
                    {block.block_type === 'intention' && (
                      <div className="intention-block">
                        <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
                          Intenção
                        </p>
                        <p className="text-foreground leading-relaxed">
                          {block.content_pt || block.content}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Checklist */}
            {checklistItems && checklistItems.length > 0 && (
              <div className="prayer-card mb-8">
                <h4 className="font-display text-lg font-semibold text-primary mb-4">
                  Orações do Dia
                </h4>
                <div className="space-y-3">
                  {checklistItems.map((item) => (
                    <label
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        localChecklist[item.id] 
                          ? 'bg-gold/10' 
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        checked={localChecklist[item.id] ?? false}
                        onCheckedChange={() => handleChecklistToggle(item.id)}
                        disabled={updateProgress.isPending}
                        className="data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                      />
                      <span className={`flex-1 ${
                        localChecklist[item.id] ? 'text-muted-foreground line-through' : 'text-foreground'
                      }`}>
                        {item.label_pt || item.label}
                      </span>
                      {localChecklist[item.id] && (
                        <Check className="h-4 w-4 text-gold animate-check" />
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Complete Day Button */}
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
                <p className="text-sm text-muted-foreground mt-4">
                  Continue amanhã com o Dia {currentDay + 1}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default NovenaPage;
