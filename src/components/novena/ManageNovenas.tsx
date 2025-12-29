import { useNavigate } from 'react-router-dom';
import { useMyRuns, useCancelNovenaRun } from '@/hooks/useNovena';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';

const ManageNovenas = () => {
    const navigate = useNavigate();
    const { data: runs, isLoading } = useMyRuns();
    const { mutateAsync: cancelRun, isPending: isCancelling } = useCancelNovenaRun();

    const handleCancel = async (runId: string, novenaTitle: string) => {
        try {
            await cancelRun(runId);
            toast({
                title: "Novena cancelada",
                description: `A novena "${novenaTitle}" foi removida da sua lista ativa.`,
            });
        } catch (error) {
            toast({
                title: "Erro ao cancelar",
                description: "Não foi possível cancelar a novena agora.",
                variant: "destructive"
            });
        }
    };

    if (isLoading) {
        return <div className="text-center py-4"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></div>;
    }

    if (!runs || runs.length === 0) {
        return <p className="text-sm text-muted-foreground text-center py-4">Você não tem novenas ativas no momento.</p>;
    }

    return (
        <div className="space-y-4">
            {runs.map((run) => (
                <div
                    key={run.id}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border"
                >
                    <div>
                        <h4 className="font-medium text-foreground">{run.novenas?.title}</h4>
                        <p className="text-xs text-muted-foreground">
                            Iniciada em {new Date(run.started_at).toLocaleDateString()}
                        </p>
                    </div>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Cancelar
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Cancelar Novena?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Isso irá interromper seu progresso atual na novena <strong>{run.novenas?.title}</strong>.
                                    O histórico será mantido, mas você terá que começar do dia 1 se decidir voltar.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Voltar</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => handleCancel(run.id, run.novenas?.title || "")}
                                    className="bg-destructive hover:bg-destructive/90 text-white"
                                >
                                    {isCancelling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Sim, cancelar
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            ))}
        </div>
    );
};

export default ManageNovenas;
