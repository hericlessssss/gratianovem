import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = isLogin 
      ? await signInWithEmail(email, password)
      : await signUpWithEmail(email, password, displayName);

    setIsLoading(false);

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: isLogin ? "Bem-vindo de volta!" : "Conta criada!",
        description: isLogin ? "Login realizado com sucesso." : "Sua conta foi criada com sucesso.",
      });
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen hero-gradient flex flex-col">
      <div className="container py-4">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-20">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <span className="text-gold text-4xl block mb-4">✝</span>
            <h1 className="font-display text-3xl font-semibold text-primary mb-2">
              {isLogin ? 'Entrar' : 'Criar Conta'}
            </h1>
            <p className="text-muted-foreground">
              {isLogin ? 'Acesse sua conta para continuar' : 'Crie uma conta para salvar seu progresso'}
            </p>
          </div>

          <div className="prayer-card">
            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Nome (opcional)</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}

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
                <Label htmlFor="password">Senha</Label>
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

              <Button type="submit" variant="gold" className="w-full" disabled={isLoading}>
                {isLoading ? 'Carregando...' : isLogin ? 'Entrar' : 'Criar Conta'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isLogin ? 'Não tem conta? Criar agora' : 'Já tem conta? Entrar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
