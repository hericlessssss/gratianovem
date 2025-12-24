import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Book, Plus, Loader2, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Novena {
  id: string;
  slug: string;
  title: string;
  title_pt: string | null;
  description_pt: string | null;
  duration: number;
  is_active: boolean;
  created_at: string;
}

const AdminNovenas = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newNovena, setNewNovena] = useState({ title: '', title_pt: '', slug: '' });

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/');
    }
  }, [user, isAdmin, authLoading, navigate]);

  const { data: novenas, isLoading } = useQuery({
    queryKey: ['admin-novenas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('novenas')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Novena[];
    },
    enabled: isAdmin,
  });

  const createNovenaMutation = useMutation({
    mutationFn: async () => {
      // Create novena
      const { data: novena, error: novenaError } = await supabase
        .from('novenas')
        .insert({
          title: newNovena.title,
          title_pt: newNovena.title_pt,
          slug: newNovena.slug,
          duration: 9,
          is_active: true,
        })
        .select()
        .single();

      if (novenaError) throw novenaError;

      // Create 9 days
      const daysToInsert = Array.from({ length: 9 }, (_, i) => ({
        novena_id: novena.id,
        day_number: i + 1,
        title: `Day ${i + 1}`,
        title_pt: `Dia ${i + 1}`,
      }));

      const { error: daysError } = await supabase
        .from('novena_days')
        .insert(daysToInsert);

      if (daysError) throw daysError;

      return novena;
    },
    onSuccess: (novena) => {
      queryClient.invalidateQueries({ queryKey: ['admin-novenas'] });
      setIsCreateOpen(false);
      setNewNovena({ title: '', title_pt: '', slug: '' });
      toast({ title: 'Novena criada!' });
      navigate(`/admin/novenas/${novena.id}`);
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Erro ao criar novena', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const deleteNovenaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('novenas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-novenas'] });
      toast({ title: 'Novena excluída' });
    },
    onError: () => {
      toast({ title: 'Erro ao excluir', variant: 'destructive' });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNovena.title || !newNovena.slug) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }
    createNovenaMutation.mutate();
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
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

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-semibold text-primary mb-2">
              Gerenciar Novenas
            </h1>
            <p className="text-muted-foreground">
              Crie e edite as novenas disponíveis no aplicativo
            </p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="gold">
                <Plus className="h-4 w-4 mr-2" />
                Nova Novena
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreateSubmit}>
                <DialogHeader>
                  <DialogTitle>Criar Nova Novena</DialogTitle>
                  <DialogDescription>
                    Preencha os dados básicos. Você poderá editar os detalhes e adicionar
                    o conteúdo de cada dia depois.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div>
                    <Label>Título em Português *</Label>
                    <Input
                      value={newNovena.title_pt}
                      onChange={(e) => {
                        setNewNovena({
                          ...newNovena,
                          title_pt: e.target.value,
                          slug: generateSlug(e.target.value),
                        });
                      }}
                      placeholder="Ex: Novena de Nossa Senhora"
                    />
                  </div>
                  <div>
                    <Label>Title in English *</Label>
                    <Input
                      value={newNovena.title}
                      onChange={(e) => setNewNovena({ ...newNovena, title: e.target.value })}
                      placeholder="Ex: Novena to Our Lady"
                    />
                  </div>
                  <div>
                    <Label>Slug (URL) *</Label>
                    <Input
                      value={newNovena.slug}
                      onChange={(e) => setNewNovena({ ...newNovena, slug: e.target.value })}
                      placeholder="nossa-senhora"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      URL: /novena/{newNovena.slug || 'slug'}
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="gold" disabled={createNovenaMutation.isPending}>
                    {createNovenaMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    Criar Novena
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        ) : novenas && novenas.length > 0 ? (
          <div className="space-y-4">
            {novenas.map((novena) => (
              <div key={novena.id} className="prayer-card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center text-gold shrink-0">
                      <Book className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display text-lg font-semibold text-foreground">
                          {novena.title_pt || novena.title}
                        </h3>
                        <Badge variant={novena.is_active ? 'default' : 'secondary'}>
                          {novena.is_active ? 'Ativa' : 'Rascunho'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {novena.description_pt || 'Sem descrição'}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{novena.duration} dias</span>
                        <span>•</span>
                        <span>Slug: {novena.slug}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/novena/${novena.slug}`} target="_blank">
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Link>
                    </Button>
                    <Button asChild variant="gold-outline" size="sm">
                      <Link to={`/admin/novenas/${novena.id}`}>
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Tem certeza que deseja excluir esta novena?')) {
                          deleteNovenaMutation.mutate(novena.id);
                        }
                      }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 prayer-card">
            <Book className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Nenhuma novena cadastrada</p>
            <Button variant="gold" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Novena
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminNovenas;
