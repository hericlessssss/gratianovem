import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import ChristianCross from '@/components/ui/ChristianCross';

const Footer = () => {
  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="text-gold">
                <ChristianCross className="h-5 w-5" />
              </div>
              <span className="font-display text-lg font-semibold text-primary">
                GRATIA NOVEM
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Guiando fiéis através da prática de oração devocional, um dia de cada vez.
              Que Deus abençoe sua jornada.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h4 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider">
              Navegação
            </h4>
            <nav className="flex flex-col gap-2">
              <Link
                to="/novenas"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Novenas
              </Link>
              <Link
                to="/testimonials"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Testemunhos
              </Link>
              <Link
                to="/settings"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Configurações
              </Link>
            </nav>
          </div>

          {/* Privacy */}
          <div className="space-y-4">
            <h4 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider">
              Privacidade
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Respeitamos sua privacidade. Seus dados de oração são pessoais e
              armazenados com segurança. Você pode usar o app anonimamente ou
              vincular um email para sincronizar entre dispositivos.
            </p>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Gratia Novem. Todos os direitos reservados.</p>
            <span className="hidden md:inline">•</span>
            <p>v{__APP_VERSION__}</p>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            Feito por Héricles Francisco
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
