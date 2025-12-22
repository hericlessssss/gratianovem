import { useQuery } from '@tanstack/react-query';
import { Heart, Loader2, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface Testimonial {
  id: string;
  display_name: string;
  title: string | null;
  body: string;
  is_featured: boolean;
  created_at: string;
}

const TestimonialsPage = () => {
  const { data: testimonials, isLoading } = useQuery({
    queryKey: ['testimonials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('status', 'approved')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Testimonial[];
    },
  });

  return (
    <Layout>
      <div className="container py-12 md:py-20">
        <div className="text-center mb-12">
          <h1 className="font-display text-3xl md:text-5xl font-semibold text-primary mb-4">
            Testemunhos
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Histórias de fé e graças recebidas por nossa comunidade
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        ) : testimonials && testimonials.length > 0 ? (
          <div className="max-w-2xl mx-auto space-y-6 mb-12">
            {testimonials.map((t) => (
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
                    <p className="text-muted-foreground text-sm leading-relaxed">{t.body}</p>
                  </div>
                </div>
              </div>
            ))}
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
