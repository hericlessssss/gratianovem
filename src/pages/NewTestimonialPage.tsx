import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const MAX_BODY_LENGTH = 1000;

const NewTestimonialPage = () => {
  const { user, isLoading: authLoading, signInAnonymously, profile } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize anonymous auth if needed
  useEffect(() => {
    const initAuth = async () => {
      if (!authLoading && !user) {
        await signInAnonymously();
      }
    };
    initAuth();
  }, [authLoading, user, signInAnonymously]);

  // Pre-fill display name from profile
  useEffect(() => {
    if (profile?.display_name && profile.display_name !== 'Peregrino') {
      setDisplayName(profile.display_name);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Erro",
        description: "É necessário estar conectado para enviar um testemunho.",
        variant: "destructive",
      });
      return;
    }

    if (body.length > MAX_BODY_LENGTH) {
      toast({
        title: "Texto muito longo",
        description: `O testemunho deve ter no máximo ${MAX_BODY_LENGTH} caracteres.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from('testimonials')
      .insert({
        user_id: user.id,
        display_name: displayName.trim() || 'Anônimo',
        title: title.trim() || null,
        body: body.trim(),
        status: 'pending',
      });

    setIsSubmitting(false);

    if (error) {
      console.error('Error submitting testimonial:', error);
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar seu testemunho. Tente novamente.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Testemunho enviado! 🙏",
        description: "Obrigado por compartilhar! Seu testemunho será revisado antes de ser publicado.",
      });
      navigate('/testimonials');
    }
  };

  const remainingChars = MAX_BODY_LENGTH - body.length;

  return (
    <Layout>
      <div className="container py-12 md:py-20 max-w-xl">
        <Link 
          to="/testimonials" 
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Testemunhos
        </Link>

        <div className="text-center mb-8">
          <span className="text-gold text-3xl block mb-4">✝</span>
          <h1 className="font-display text-3xl font-semibold text-primary mb-2">
            Compartilhe seu Testemunho
          </h1>
          <p className="text-muted-foreground">
            Sua história de fé pode inspirar e fortalecer outros fiéis
          </p>
        </div>

        <div className="prayer-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="displayName">
                Nome para exibição <span className="text-muted-foreground text-xs">(opcional)</span>
              </Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Ex: Maria S."
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                Seu email nunca será exibido publicamente
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">
                Título <span className="text-muted-foreground text-xs">(opcional)</span>
              </Label>
              <Input
                id="title"
                type="text"
                placeholder="Ex: Graça recebida"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">
                Seu testemunho <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="body"
                placeholder="Compartilhe sua experiência de fé, graças recebidas, ou como a novena tocou seu coração..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                required
                className="resize-none"
              />
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  Seu testemunho será revisado antes de ser publicado
                </span>
                <span className={remainingChars < 100 ? 'text-destructive' : 'text-muted-foreground'}>
                  {remainingChars} caracteres restantes
                </span>
              </div>
            </div>

            <Button
              type="submit"
              variant="gold"
              className="w-full"
              disabled={isSubmitting || !body.trim() || body.length > MAX_BODY_LENGTH}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar Testemunho
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default NewTestimonialPage;
