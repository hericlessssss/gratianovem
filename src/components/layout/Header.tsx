import { Link } from 'react-router-dom';
import { Menu, User, LogOut, Settings, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';

import ChristianCross from '@/components/ui/ChristianCross';

const Header = () => {
  const { user, isAnonymous, isAdmin, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="text-gold">
            <ChristianCross className="h-5 w-5 md:h-6 md:w-6" />
          </div>
          <span className="font-display text-xl font-semibold text-primary tracking-wide">
            GRATIA NOVEM
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/novenas"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Novenas
          </Link>
          <Link
            to="/testimonials"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Testemunhos
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {isAnonymous && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Proteger Progresso
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Configurações
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Administração
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="flex items-center gap-2 text-destructive">
                  <LogOut className="h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="gold" size="sm">
              <Link to="/auth">Entrar</Link>
            </Button>
          )}
        </nav>

        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <div className="flex flex-col gap-6 mt-8">
              <Link
                to="/novenas"
                className="text-lg font-display font-medium text-foreground hover:text-gold transition-colors"
              >
                Novenas
              </Link>
              <Link
                to="/testimonials"
                className="text-lg font-display font-medium text-foreground hover:text-gold transition-colors"
              >
                Testemunhos
              </Link>

              {user ? (
                <>
                  <Link
                    to="/settings"
                    className="text-lg font-display font-medium text-foreground hover:text-gold transition-colors"
                  >
                    Configurações
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="text-lg font-display font-medium text-foreground hover:text-gold transition-colors"
                    >
                      Administração
                    </Link>
                  )}
                  <Button variant="outline" onClick={signOut} className="mt-4">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </Button>
                </>
              ) : (
                <Button asChild variant="gold" className="mt-4">
                  <Link to="/auth">Entrar</Link>
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Header;
