import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Shield, User, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";

const SettingsPage = () => {
  const { user, profile, isAnonymous, linkEmail, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [quietMode, setQuietMode] = useState(false);
  const [emailReminders, setEmailReminders] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync local state with profile when it loads
  useEffect(() => {
    if (profile) {
      setEmailReminders(profile.email_notifications || false);
    }
  }, [profile]);

  const handleLinkEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLinking(true);
    setSuccessMessage(null);

    const { error } = await linkEmail(email, password);
    setIsLinking(false);

    if (error) {
      toast({
        title: "Erro ao vincular email",
        description: error.message,
        variant: "destructive",
      });
    } else {
      const message = isAnonymous
        ? "Sua conta foi vinculada com sucesso! Você reberá um e-mail de confirmação. Após confirmar, faça login para continuar."
        : "Conta criada com sucesso! Verifique seu email para confirmar.";

      setSuccessMessage(message);
      toast({
        title: "Sucesso!",
        description: message,
      });
      setEmail('');
      setPassword('');

      // Optional: Sign out to force re-login flow if desired, 
      // but usually we just want to show the button.
      if (isAnonymous) {
        await signOut();
      }
    }
  };

  const handleQuietModeToggle = (enabled: boolean) => {
    setQuietMode(enabled);
    if (enabled) {
      document.body.classList.add('quiet-mode');
    } else {
      document.body.classList.remove('quiet-mode');
    }
    toast({
      title: enabled ? "Modo Silencioso Ativado" : "Modo Silencioso Desativado",
      description: enabled
        ? "Animações reduzidas para uma experiência mais tranquila."
        : "Animações normais restauradas.",
    });
  };

  return (
    <Layout>
      <div className="container py-12 md:py-20 max-w-2xl">
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-primary mb-2">
          Configurações
        </h1>
        <p className="text-muted-foreground mb-10">
          Gerencie sua conta e preferências
        </p>

        {/* Account Section */}
        <section className="mb-10">
          <h2 className="font-display text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-gold" />
            Conta
          </h2>

          <div className="prayer-card">
            {isAnonymous ? (
              <>
                <div className="flex items-start gap-3 mb-6">
                  <Shield className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-foreground mb-1">
                      Proteja seu Progresso
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Você está usando o app anonimamente. Vincule um email para
                      sincronizar seu progresso entre dispositivos e não perdê-lo.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleLinkEmail} className="space-y-4">
                  {successMessage ? (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center space-y-3 animate-fade-in">
                      <p className="text-green-600 font-medium text-sm">
                        {successMessage}
                      </p>
                      <Button asChild variant="gold" className="w-full">
                        <Link to="/auth">
                          Ir para Login
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">Criar Senha</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <Button type="submit" variant="gold" disabled={isLinking}>
                        {isLinking ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        {isAnonymous ? 'Vincular Email' : 'Criar Conta'}
                      </Button>
                    </>
                  )}
                </form>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {profile?.display_name || 'Peregrino'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </div>

                <Button variant="outline" onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Preferences Section */}
        <section className="mb-10">
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">
            Preferências
          </h2>

          <div className="prayer-card space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">Modo Silencioso</h3>
                <p className="text-sm text-muted-foreground">
                  Reduz animações para uma experiência mais tranquila
                </p>
              </div>
              <Switch
                checked={quietMode}
                onCheckedChange={handleQuietModeToggle}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">Lembretes por Email</h3>
                <p className="text-sm text-muted-foreground">
                  Receba lembretes diários de oração
                </p>
              </div>
              <Switch
                checked={emailReminders}
                onCheckedChange={async (checked) => {
                  if (!user) return;

                  // Optimistic update
                  setEmailReminders(checked);

                  const { error } = await supabase
                    .from('profiles')
                    .update({ email_notifications: checked })
                    .eq('user_id', user.id);

                  if (error) {
                    // Revert on error
                    setEmailReminders(!checked);
                    toast({
                      title: "Erro ao atualizar permissão",
                      description: "Não foi possível salvar sua preferência.",
                      variant: "destructive",
                    });
                  } else {
                    toast({
                      title: checked ? "Lembretes Ativados" : "Lembretes Desativados",
                      description: checked
                        ? "Você receberá lembretes diários em seu email."
                        : "Você não receberá mais lembretes por email.",
                    });
                  }
                }}
                disabled={isAnonymous}
              />
            </div>
          </div>
        </section>

        {/* Data Section */}
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">
            Dados
          </h2>

          <div className="prayer-card space-y-4">
            <Button variant="outline" disabled className="opacity-50">
              Exportar Meus Dados (em breve)
            </Button>
            <Button variant="ghost" disabled className="text-destructive opacity-50">
              Excluir Conta (em breve)
            </Button>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default SettingsPage;
