import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MessageSquare, Check, X, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Testimonial {
  id: string;
  display_name: string;
  title: string | null;
  body: string;
  status: 'pending' | 'approved' | 'rejected';
  is_featured: boolean;
  created_at: string;
  user_id: string | null;
}

const AdminTestimonials = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pending');

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/');
    }
  }, [user, isAdmin, authLoading, navigate]);

  const { data: testimonials, isLoading } = useQuery({
    queryKey: ['admin-testimonials', activeTab],
    queryFn: async () => {
      let query = supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (activeTab !== 'all') {
        query = query.eq('status', activeTab);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Testimonial[];
    },
    enabled: isAdmin,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, is_featured }: { id: string; status?: string; is_featured?: boolean }) => {
      const updates: Record<string, unknown> = {};
      if (status !== undefined) {
        updates.status = status;
        updates.reviewed_at = new Date().toISOString();
        updates.reviewed_by = user?.id;
      }
      if (is_featured !== undefined) {
        updates.is_featured = is_featured;
      }

      const { error } = await supabase
        .from('testimonials')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const handleApprove = async (id: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status: 'approved' });
      toast({ title: "Testemunho aprovado!" });
    } catch {
      toast({ title: "Erro ao aprovar", variant: "destructive" });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status: 'rejected' });
      toast({ title: "Testemunho rejeitado" });
    } catch {
      toast({ title: "Erro ao rejeitar", variant: "destructive" });
    }
  };

  const handleToggleFeatured = async (id: string, currentValue: boolean) => {
    try {
      await updateStatusMutation.mutateAsync({ id, is_featured: !currentValue });
      toast({ title: !currentValue ? "Destacado!" : "Destaque removido" });
    } catch {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    }
  };

  if (authLoading || !isAdmin) {
    return (
      <Layout>
        <div className="container py-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12">
        <Link 
          to="/admin" 
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-primary mb-2">
            Moderar Testemunhos
          </h1>
          <p className="text-muted-foreground">
            Revise e aprove os testemunhos enviados pelos usuários
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="approved">Aprovados</TabsTrigger>
            <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gold" />
              </div>
            ) : testimonials && testimonials.length > 0 ? (
              <div className="space-y-4">
                {testimonials.map((t) => (
                  <div key={t.id} className="prayer-card">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-display font-semibold">{t.display_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(t.created_at).toLocaleDateString('pt-BR')}
                          </span>
                          {t.is_featured && (
                            <Badge className="bg-gold/10 text-gold hover:bg-gold/20">
                              <Star className="h-3 w-3 mr-1 fill-gold" />
                              Destaque
                            </Badge>
                          )}
                        </div>
                        {t.title && (
                          <h3 className="font-display text-lg text-primary">{t.title}</h3>
                        )}
                      </div>
                      <Badge variant={
                        t.status === 'approved' ? 'default' : 
                        t.status === 'rejected' ? 'destructive' : 
                        'secondary'
                      }>
                        {t.status === 'approved' ? 'Aprovado' : 
                         t.status === 'rejected' ? 'Rejeitado' : 
                         'Pendente'}
                      </Badge>
                    </div>

                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                      {t.body}
                    </p>

                    <div className="flex items-center gap-2 pt-4 border-t border-border">
                      {t.status === 'pending' && (
                        <>
                          <Button
                            variant="gold"
                            size="sm"
                            onClick={() => handleApprove(t.id)}
                            disabled={updateStatusMutation.isPending}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(t.id)}
                            disabled={updateStatusMutation.isPending}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Rejeitar
                          </Button>
                        </>
                      )}
                      {t.status === 'approved' && (
                        <Button
                          variant={t.is_featured ? 'secondary' : 'gold-outline'}
                          size="sm"
                          onClick={() => handleToggleFeatured(t.id, t.is_featured)}
                          disabled={updateStatusMutation.isPending}
                        >
                          <Star className={`h-4 w-4 mr-1 ${t.is_featured ? 'fill-current' : ''}`} />
                          {t.is_featured ? 'Remover Destaque' : 'Destacar'}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 prayer-card">
                <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {activeTab === 'pending' ? 'Nenhum testemunho pendente' :
                   activeTab === 'approved' ? 'Nenhum testemunho aprovado' :
                   'Nenhum testemunho rejeitado'}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminTestimonials;
