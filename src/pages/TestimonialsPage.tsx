import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Loader2, Star, Hand } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Testimonial {
  id: string;
  display_name: string;
  title: string | null;
  body: string;
  is_featured: boolean;
  created_at: string;
  likes_count: number;
}

const TestimonialsPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState<'recent' | 'likes'>('recent');
  const [likedIds, setLikedIds] = useState<string[]>([]);

  // Unique storage key per user to prevent collision (e.g. User B unliking User A's like)
  const storageKey = useMemo(() =>
    `gratianovem_likes_${user?.id || 'guest'}`,
    [user?.id]);

  // Load liked items on mount or user change
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setLikedIds(JSON.parse(stored));
    } else {
      setLikedIds([]);
    }
  }, [storageKey]);

  const { data: testimonials, isLoading } = useQuery({
    queryKey: ['testimonials', sortBy],
    queryFn: async () => {
      let query = supabase
        .from('testimonials')
        .select('*')
        .eq('status', 'approved');

      // Always prioritize featured, then sort option
      if (sortBy === 'likes') {
        query = query
          .order('is_featured', { ascending: false })
          .order('likes_count', { ascending: false });
      } else {
        query = query
          .order('is_featured', { ascending: false })
          .order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Testimonial[];
    },
  });

  const toggleLike = useMutation({
    mutationFn: async (testimonialId: string) => {
      const isLiked = likedIds.includes(testimonialId);
      const { error } = await supabase.rpc('increment_testimonial_likes', {
        row_id: testimonialId,
        increment: !isLiked
      });

      if (error) throw error;
      return { testimonialId, isLiked };
    },
    onMutate: async (testimonialId) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['testimonials'] });

      // Snapshot the previous value
      const previousTestimonials = queryClient.getQueryData(['testimonials', sortBy]);

      // Optimistically update to the new value
      const isLiked = likedIds.includes(testimonialId);

      // Update UI count
      queryClient.setQueryData(['testimonials', sortBy], (old: Testimonial[] | undefined) => {
        if (!old) return [];
        return old.map(t => {
          if (t.id === testimonialId) {
            return {
              ...t,
              likes_count: isLiked ? Math.max(0, (t.likes_count || 0) - 1) : (t.likes_count || 0) + 1
            };
          }
          return t;
        });
      });

      // Update Local State for "Amém!" text/color immediately
      let newLikedIds;
      if (isLiked) {
        newLikedIds = likedIds.filter(id => id !== testimonialId);
      } else {
        newLikedIds = [...likedIds, testimonialId];
      }
      setLikedIds(newLikedIds);
      localStorage.setItem(storageKey, JSON.stringify(newLikedIds));

      return { previousTestimonials, previousLikedIds: likedIds };
    },
    onError: (err, testimonialId, context) => {
      // Rollback
      if (context?.previousTestimonials) {
        queryClient.setQueryData(['testimonials', sortBy], context.previousTestimonials);
      }
      if (context?.previousLikedIds) {
        setLikedIds(context.previousLikedIds);
        localStorage.setItem(storageKey, JSON.stringify(context.previousLikedIds));
      }
      console.error('Like mutation error:', err);
    },
    onSettled: () => {
      // Always refetch after error or success to ensure sync
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
    },
  });

  const handleLike = (id: string) => {
    toggleLike.mutate(id);
  };

  return (
    <Layout>
      <div className="container py-12 md:py-20">
        <div className="text-center mb-12">
          <h1 className="font-display text-3xl md:text-5xl font-semibold text-primary mb-4">
            Testemunhos
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Histórias de fé e graças recebidas por nossa comunidade
          </p>

          {/* Sort Controls - Show always or conditionally */}
          {testimonials && testimonials.length > 0 && (
            <div className="flex justify-center">
              <Select value={sortBy} onValueChange={(v: 'recent' | 'likes') => setSortBy(v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Mais Recentes</SelectItem>
                  <SelectItem value="likes">Mais Curtidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        ) : testimonials && testimonials.length > 0 ? (
          <div className="max-w-2xl mx-auto space-y-6 mb-12">
            {testimonials.map((t) => {
              const isLiked = likedIds.includes(t.id);
              return (
                <div key={t.id} className={`prayer-card ${t.is_featured ? 'ring-2 ring-gold/30' : ''}`}>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold shrink-0">
                      {t.is_featured ? <Star className="h-5 w-5 fill-gold" /> : <Heart className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-display font-semibold text-foreground">{t.display_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(t.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        {t.is_featured && (
                          <span className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded-full">
                            Destaque
                          </span>
                        )}
                      </div>
                      {t.title && (
                        <h3 className="font-display text-lg text-primary mb-2">{t.title}</h3>
                      )}
                      <p className="text-muted-foreground text-sm leading-relaxed mb-4">{t.body}</p>

                      {/* Like Action */}
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(t.id)}
                          className={`gap-2 hover:bg-gold/10 hover:text-gold transition-colors ${isLiked ? 'text-gold bg-gold/5' : 'text-muted-foreground'}`}
                          disabled={toggleLike.isPending}
                        >
                          <span className="text-lg leading-none">🙌</span>
                          <span className="font-medium text-sm">{t.likes_count || 0}</span>
                          <span className="text-xs">{isLiked ? 'Amém!' : 'Amém'}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Heart className="h-12 w-12 text-gold/50 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nenhum testemunho disponível ainda.
            </p>
          </div>
        )}

        <div className="text-center">
          <Button asChild variant="gold-outline">
            <Link to="/testimonials/new">Compartilhar meu Testemunho</Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default TestimonialsPage;
