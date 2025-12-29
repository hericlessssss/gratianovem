import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Shield, User, LogOut, Loader2, Edit2, Save, X, Eye, EyeOff, Download, AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";

import ManageNovenas from '@/components/novena/ManageNovenas';
import { BookOpen } from 'lucide-react';

const SettingsPage = () => {
  const { user, profile, isAnonymous, linkEmail, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [linkName, setLinkName] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [quietMode, setQuietMode] = useState(false);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  const saveName = async () => {
    if (!user || !newName.trim()) return;

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: newName, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: "Erro ao atualizar nome",
        variant: "destructive"
      });
    } else {
      toast({ title: "Nome atualizado!" });
      setIsEditingName(false);
      // Force profile refresh by reloading or we assume AuthContext will react to realtime?
      // AuthContext doesn't listen to realtime profiles, but we can do a hack:
      window.location.reload();
    }
  };

  // Sync local state with profile when it loads


  const handleLinkEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Senhas não conferem",
        description: "Por favor, verifique se as senhas digitadas são iguais.",
        variant: "destructive",
      });
      return;
    }

    setIsLinking(true);
    setSuccessMessage(null);

    const { error } = await linkEmail(email, password, linkName);
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

  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExportData = async () => {
    if (!user) return;
    setIsExporting(true);

    try {
      // Fetch all user data
      const { data: profileArgs } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
      const { data: runs } = await supabase.from('user_novena_runs').select('*').eq('user_id', user.id);

      // We need progress too. Since we might have many progress items, we can fetch them by runs or just all for user via proper RLS if set, 
      // but 'user_day_progress' usually links to 'run_id'. Let's fetch progress for all runs.
      // If we don't have RLS allowing 'select * from user_day_progress', we might need to iterate. 
      // Assuming RLS on user_day_progress relies on run_id -> user_novena_runs -> user_id, getting all usually works if we have a view or policy.
      // Easiest is to fetch user_day_progress where run_id is in our runs.

      let progressData: any[] = [];
      if (runs && runs.length > 0) {
        const runIds = runs.map(r => r.id);
        const { data: progress } = await supabase.from('user_day_progress').select('*').in('run_id', runIds);
        progressData = progress || [];
      }

      const exportObject = {
        exported_at: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          profile: profileArgs
        },
        novenas: {
          runs: runs,
          progress: progressData
        }
      };

      const jsonString = JSON.stringify(exportObject, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `gratianovem-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Exportação Concluída",
        description: "Seus dados foram baixados com sucesso.",
      });

    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar seus dados no momento.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase.rpc('delete_user_account');

      if (error) throw error;

      await signOut();
      toast({
        title: "Conta excluída",
        description: "Sua conta e dados foram removidos permanentemente.",
      });
      // Redirect handled by signOut usually, or global auth state
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({
        title: "Erro ao excluir",
        description: error.message || "Ocorreu um erro ao excluir sua conta.",
        variant: "destructive"
      });
      setIsDeleting(false);
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
                        <Label htmlFor="link-name">Nome</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="link-name"
                            type="text"
                            placeholder="Seu nome"
                            value={linkName}
                            onChange={(e) => setLinkName(e.target.value)}
                            required
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="link-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="link-email"
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
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="pl-10 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="confirmPassword"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            className="pl-10 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
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
                    <div>
                      {isEditingName ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="h-8"
                          />
                          <Button size="sm" variant="ghost" onClick={saveName} className="h-8 w-8 p-0">
                            <Save className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setIsEditingName(false)} className="h-8 w-8 p-0">
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <p className="font-medium text-foreground">
                            {profile?.display_name || 'Peregrino'}
                          </p>
                          <button
                            onClick={() => {
                              setNewName(profile?.display_name || '');
                              setIsEditingName(true);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                          >
                            <Edit2 className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
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

        {/* Manage Novenas Section */}
        <section className="mb-10">
          <h2 className="font-display text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-gold" />
            Gerenciar Novenas
          </h2>
          <div className="prayer-card">
            <ManageNovenas />
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


          </div>
        </section>

        {/* Data Section */}
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">
            Dados
          </h2>

          <div className="prayer-card space-y-4">
            <Button
              variant="outline"
              onClick={handleExportData}
              disabled={isExporting}
              className="w-full justify-start"
            >
              {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Exportar Dados
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full justify-start">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Conta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Excluir Conta Permanentemente?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente sua conta e removerá todos os seus dados dos nossos servidores, incluindo histórico de novenas e orações.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90 text-white">
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Sim, excluir minha conta
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </section>
      </div>
    </Layout >
  );
};

export default SettingsPage;
