import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2, Plus, Eye, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/layout/Layout';
import { DayEditor } from '@/components/admin/DayEditor';
import { ContentBlock } from '@/components/admin/SortableContentBlock';
import { ChecklistItem } from '@/components/admin/SortableChecklistItem';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Novena {
  id: string;
  slug: string;
  title: string;
  title_pt: string | null;
  description: string | null;
  description_pt: string | null;
  duration: number;
  is_active: boolean;
}

interface NovenaDay {
  id: string;
  day_number: number;
  title: string;
  title_pt: string | null;
}

const AdminNovenaEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [activeDay, setActiveDay] = useState('1');
  const [isSaving, setIsSaving] = useState(false);

  // Novena details state
  const [novenaDetails, setNovenaDetails] = useState<Partial<Novena>>({});

  // Day content state
  const [dayContents, setDayContents] = useState<Record<string, ContentBlock[]>>({});
  const [dayChecklists, setDayChecklists] = useState<Record<string, ChecklistItem[]>>({});

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/');
    }
  }, [user, isAdmin, authLoading, navigate]);

  // Fetch novena
  const { data: novena, isLoading: novenaLoading } = useQuery({
    queryKey: ['admin-novena', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('novenas')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as Novena;
    },
    enabled: !!id && isAdmin,
  });

  // Fetch days
  const { data: days, isLoading: daysLoading } = useQuery({
    queryKey: ['admin-novena-days', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('novena_days')
        .select('*')
        .eq('novena_id', id!)
        .order('day_number');
      if (error) throw error;
      return data as NovenaDay[];
    },
    enabled: !!id && isAdmin,
  });

  // Fetch content blocks for all days
  const { data: allContentBlocks } = useQuery({
    queryKey: ['admin-content-blocks', id],
    queryFn: async () => {
      if (!days) return {};
      const dayIds = days.map((d) => d.id);
      const { data, error } = await supabase
        .from('day_content_blocks')
        .select('*')
        .in('novena_day_id', dayIds)
        .order('sort_order');
      if (error) throw error;
      
      // Group by day
      const grouped: Record<string, ContentBlock[]> = {};
      data.forEach((block) => {
        if (!grouped[block.novena_day_id]) {
          grouped[block.novena_day_id] = [];
        }
        grouped[block.novena_day_id].push(block as ContentBlock);
      });
      return grouped;
    },
    enabled: !!days && days.length > 0,
  });

  // Fetch checklist items for all days
  const { data: allChecklistItems } = useQuery({
    queryKey: ['admin-checklist-items', id],
    queryFn: async () => {
      if (!days) return {};
      const dayIds = days.map((d) => d.id);
      const { data, error } = await supabase
        .from('day_checklist_items')
        .select('*')
        .in('novena_day_id', dayIds)
        .order('sort_order');
      if (error) throw error;
      
      // Group by day
      const grouped: Record<string, ChecklistItem[]> = {};
      data.forEach((item) => {
        if (!grouped[item.novena_day_id]) {
          grouped[item.novena_day_id] = [];
        }
        grouped[item.novena_day_id].push(item as ChecklistItem);
      });
      return grouped;
    },
    enabled: !!days && days.length > 0,
  });

  // Initialize state from fetched data
  useEffect(() => {
    if (novena) {
      setNovenaDetails(novena);
    }
  }, [novena]);

  useEffect(() => {
    if (allContentBlocks) {
      setDayContents(allContentBlocks);
    }
  }, [allContentBlocks]);

  useEffect(() => {
    if (allChecklistItems) {
      setDayChecklists(allChecklistItems);
    }
  }, [allChecklistItems]);

  // Save novena details
  const saveNovenaDetails = useMutation({
    mutationFn: async (details: Partial<Novena>) => {
      const { error } = await supabase
        .from('novenas')
        .update({
          title: details.title,
          title_pt: details.title_pt,
          slug: details.slug,
          description: details.description,
          description_pt: details.description_pt,
          is_active: details.is_active,
        })
        .eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-novena', id] });
      toast({ title: 'Novena salva!' });
    },
    onError: () => {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    },
  });

  // Save day title
  const saveDayTitle = useCallback(async (dayId: string, title: string, titlePt: string) => {
    const { error } = await supabase
      .from('novena_days')
      .update({ title, title_pt: titlePt })
      .eq('id', dayId);
    if (error) {
      toast({ title: 'Erro ao salvar título', variant: 'destructive' });
    }
  }, []);

  // Save content blocks
  const saveContentBlocks = useCallback(async (dayId: string, blocks: ContentBlock[]) => {
    setIsSaving(true);
    try {
      // Delete removed blocks
      const existingIds = blocks.filter((b) => !b.id.startsWith('new-')).map((b) => b.id);
      await supabase
        .from('day_content_blocks')
        .delete()
        .eq('novena_day_id', dayId)
        .not('id', 'in', `(${existingIds.join(',')})`);

      // Upsert blocks
      for (const block of blocks) {
        if (block.id.startsWith('new-')) {
          // Insert new
          await supabase.from('day_content_blocks').insert({
            novena_day_id: dayId,
            block_type: block.block_type,
            content: block.content || ' ',
            content_pt: block.content_pt,
            sort_order: block.sort_order,
          });
        } else {
          // Update existing
          await supabase
            .from('day_content_blocks')
            .update({
              block_type: block.block_type,
              content: block.content || ' ',
              content_pt: block.content_pt,
              sort_order: block.sort_order,
            })
            .eq('id', block.id);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['admin-content-blocks', id] });
    } catch {
      toast({ title: 'Erro ao salvar blocos', variant: 'destructive' });
    }
    setIsSaving(false);
  }, [id, queryClient]);

  // Save checklist items
  const saveChecklistItems = useCallback(async (dayId: string, items: ChecklistItem[]) => {
    setIsSaving(true);
    try {
      // Delete removed items
      const existingIds = items.filter((i) => !i.id.startsWith('new-')).map((i) => i.id);
      if (existingIds.length > 0) {
        await supabase
          .from('day_checklist_items')
          .delete()
          .eq('novena_day_id', dayId)
          .not('id', 'in', `(${existingIds.join(',')})`);
      } else {
        await supabase.from('day_checklist_items').delete().eq('novena_day_id', dayId);
      }

      // Upsert items
      for (const item of items) {
        if (item.id.startsWith('new-')) {
          // Insert new
          await supabase.from('day_checklist_items').insert({
            novena_day_id: dayId,
            label: item.label || 'Item',
            label_pt: item.label_pt,
            sort_order: item.sort_order,
          });
        } else {
          // Update existing
          await supabase
            .from('day_checklist_items')
            .update({
              label: item.label || 'Item',
              label_pt: item.label_pt,
              sort_order: item.sort_order,
            })
            .eq('id', item.id);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['admin-checklist-items', id] });
    } catch {
      toast({ title: 'Erro ao salvar checklist', variant: 'destructive' });
    }
    setIsSaving(false);
  }, [id, queryClient]);

  // Create missing days
  const createMissingDays = async () => {
    if (!novena || !days) return;
    
    const existingNumbers = days.map((d) => d.day_number);
    const missingNumbers = Array.from({ length: 9 }, (_, i) => i + 1).filter(
      (n) => !existingNumbers.includes(n)
    );

    for (const num of missingNumbers) {
      await supabase.from('novena_days').insert({
        novena_id: novena.id,
        day_number: num,
        title: `Day ${num}`,
        title_pt: `Dia ${num}`,
      });
    }

    queryClient.invalidateQueries({ queryKey: ['admin-novena-days', id] });
    toast({ title: 'Dias criados!' });
  };

  const handleSaveAll = async () => {
    if (!days) return;
    setIsSaving(true);

    // Save novena details
    await saveNovenaDetails.mutateAsync(novenaDetails);

    // Save all days content
    for (const day of days) {
      const blocks = dayContents[day.id] || [];
      const items = dayChecklists[day.id] || [];
      await saveContentBlocks(day.id, blocks);
      await saveChecklistItems(day.id, items);
    }

    setIsSaving(false);
    toast({ title: 'Tudo salvo com sucesso!' });
  };

  if (authLoading || novenaLoading || daysLoading) {
    return (
      <Layout>
        <div className="container py-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      </Layout>
    );
  }

  if (!novena) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">Novena não encontrada</p>
        </div>
      </Layout>
    );
  }

  const currentDay = days?.find((d) => d.day_number === parseInt(activeDay));

  return (
    <Layout hideFooter>
      <div className="container py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              to="/admin/novenas"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <h1 className="font-display text-2xl font-semibold text-primary">
              Editar: {novena.title_pt || novena.title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to={`/novena/${novena.slug}`} target="_blank">
                <Eye className="h-4 w-4 mr-1" />
                Visualizar
              </Link>
            </Button>
            <Button
              variant="gold"
              onClick={handleSaveAll}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Tudo
            </Button>
          </div>
        </div>

        <Tabs value={activeDay} onValueChange={setActiveDay} className="space-y-6">
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            <TabsList>
              <TabsTrigger value="settings" className="gap-1">
                <Settings className="h-4 w-4" />
                Config
              </TabsTrigger>
              {Array.from({ length: 9 }, (_, i) => i + 1).map((num) => {
                const day = days?.find((d) => d.day_number === num);
                return (
                  <TabsTrigger
                    key={num}
                    value={String(num)}
                    disabled={!day}
                    className="min-w-[60px]"
                  >
                    Dia {num}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {days && days.length < 9 && (
              <Button variant="outline" size="sm" onClick={createMissingDays}>
                <Plus className="h-4 w-4 mr-1" />
                Criar Dias Faltantes
              </Button>
            )}
          </div>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="max-w-2xl space-y-6">
              <div className="prayer-card space-y-4">
                <h3 className="font-display text-lg font-semibold text-primary">
                  Detalhes da Novena
                </h3>

                <div className="grid gap-4">
                  <div>
                    <Label>Slug (URL)</Label>
                    <Input
                      value={novenaDetails.slug || ''}
                      onChange={(e) =>
                        setNovenaDetails({ ...novenaDetails, slug: e.target.value })
                      }
                      placeholder="sao-jose"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Título (Português)</Label>
                      <Input
                        value={novenaDetails.title_pt || ''}
                        onChange={(e) =>
                          setNovenaDetails({ ...novenaDetails, title_pt: e.target.value })
                        }
                        placeholder="Novena de São José"
                      />
                    </div>
                    <div>
                      <Label>Title (English)</Label>
                      <Input
                        value={novenaDetails.title || ''}
                        onChange={(e) =>
                          setNovenaDetails({ ...novenaDetails, title: e.target.value })
                        }
                        placeholder="Novena of Saint Joseph"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Descrição (Português)</Label>
                    <Textarea
                      value={novenaDetails.description_pt || ''}
                      onChange={(e) =>
                        setNovenaDetails({ ...novenaDetails, description_pt: e.target.value })
                      }
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Description (English)</Label>
                    <Textarea
                      value={novenaDetails.description || ''}
                      onChange={(e) =>
                        setNovenaDetails({ ...novenaDetails, description: e.target.value })
                      }
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <Label>Novena Ativa</Label>
                      <p className="text-xs text-muted-foreground">
                        Novenas inativas não aparecem para os usuários
                      </p>
                    </div>
                    <Switch
                      checked={novenaDetails.is_active ?? true}
                      onCheckedChange={(checked) =>
                        setNovenaDetails({ ...novenaDetails, is_active: checked })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Day Tabs */}
          {Array.from({ length: 9 }, (_, i) => i + 1).map((num) => {
            const day = days?.find((d) => d.day_number === num);
            if (!day) return null;

            return (
              <TabsContent key={num} value={String(num)}>
                <DayEditor
                  dayId={day.id}
                  dayNumber={day.day_number}
                  dayTitle={day.title}
                  dayTitlePt={day.title_pt}
                  contentBlocks={dayContents[day.id] || []}
                  checklistItems={dayChecklists[day.id] || []}
                  onUpdateDayTitle={(title, titlePt) => saveDayTitle(day.id, title, titlePt)}
                  onUpdateContentBlocks={(blocks) =>
                    setDayContents({ ...dayContents, [day.id]: blocks })
                  }
                  onUpdateChecklistItems={(items) =>
                    setDayChecklists({ ...dayChecklists, [day.id]: items })
                  }
                  isSaving={isSaving}
                />
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminNovenaEditor;
