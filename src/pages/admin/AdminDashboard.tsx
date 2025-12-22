import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, Book, MessageSquare, Users, Activity, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const AdminDashboard = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/');
    }
  }, [user, isAdmin, authLoading, navigate]);

  // Fetch stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [novenasRes, runsRes, testimonialsRes, pendingRes] = await Promise.all([
        supabase.from('novenas').select('id', { count: 'exact', head: true }),
        supabase.from('user_novena_runs').select('id', { count: 'exact', head: true }),
        supabase.from('testimonials').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('testimonials').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      return {
        novenas: novenasRes.count ?? 0,
        activeRuns: runsRes.count ?? 0,
        testimonials: testimonialsRes.count ?? 0,
        pendingTestimonials: pendingRes.count ?? 0,
      };
    },
    enabled: isAdmin,
  });

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-semibold text-primary mb-2">
              Administração
            </h1>
            <p className="text-muted-foreground">
              Gerencie novenas, testemunhos e configurações
            </p>
          </div>
          <LayoutDashboard className="h-8 w-8 text-gold" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Novenas</CardTitle>
              <Book className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : stats?.novenas}</div>
              <p className="text-xs text-muted-foreground">ativas no sistema</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jornadas Ativas</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : stats?.activeRuns}</div>
              <p className="text-xs text-muted-foreground">novenas em andamento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Testemunhos</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : stats?.testimonials}</div>
              <p className="text-xs text-muted-foreground">aprovados</p>
            </CardContent>
          </Card>

          <Card className={stats?.pendingTestimonials ? 'ring-2 ring-gold' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Users className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gold">{isLoading ? '...' : stats?.pendingTestimonials}</div>
              <p className="text-xs text-muted-foreground">aguardando revisão</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="prayer-card">
            <h2 className="font-display text-xl font-semibold text-primary mb-4 flex items-center gap-2">
              <Book className="h-5 w-5 text-gold" />
              Gerenciar Novenas
            </h2>
            <p className="text-muted-foreground text-sm mb-4">
              Crie, edite e organize as novenas e seus dias de oração.
            </p>
            <Button asChild variant="gold">
              <Link to="/admin/novenas">Gerenciar Novenas</Link>
            </Button>
          </div>

          <div className="prayer-card">
            <h2 className="font-display text-xl font-semibold text-primary mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-gold" />
              Moderar Testemunhos
            </h2>
            <p className="text-muted-foreground text-sm mb-4">
              Revise e aprove testemunhos enviados pelos usuários.
            </p>
            <Button asChild variant="gold">
              <Link to="/admin/testimonials">Moderar Testemunhos</Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
