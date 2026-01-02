import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ChristianCross from '@/components/ui/ChristianCross';
import { Progress } from '@/components/ui/progress';

interface NovenaHeroProps {
    title: string;
    description?: string | null;
    imageUrl?: string | null;
    progressPercent: number;
    completedDays: number;
    totalDays: number;
}

export const NovenaHero = ({
    title,
    description,
    imageUrl,
    progressPercent,
    completedDays,
    totalDays
}: NovenaHeroProps) => {
    return (
        <div className="relative w-full overflow-hidden bg-primary min-h-[400px] flex flex-col justify-end shadow-xl">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0 select-none pointer-events-none">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={title}
                        className="w-full h-full object-cover object-[50%_20%] opacity-40 mix-blend-overlay animate-in fade-in duration-1000"
                    />
                ) : (
                    <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-foreground/10 to-transparent opacity-30 animate-pulse-slow" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-primary/30" />
                <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-transparent to-transparent opacity-50" />
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-10 right-10 text-white/5 animate-pulse-slow pointer-events-none">
                <ChristianCross className="w-64 h-64 rotate-12" />
            </div>

            {/* Content */}
            <div className="container max-w-3xl relative z-10 pb-12 pt-24 animate-fade-in-up">
                <Button
                    asChild
                    variant="ghost"
                    className="text-white/70 hover:text-white hover:bg-white/10 mb-8 pl-0 group"
                >
                    <Link to="/novenas" className="gap-2">
                        <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        Voltar para Novenas
                    </Link>
                </Button>

                <div className="flex items-center gap-3 mb-6">
                    <Badge variant="outline" className="text-gold border-gold/40 bg-gold/5 backdrop-blur-sm px-3 py-1 text-xs uppercase tracking-wider font-medium">
                        {totalDays} Dias
                    </Badge>
                    {/* Future: Add 'Popular' badge etc */}
                </div>

                <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-semibold text-white mb-6 leading-tight text-balance drop-shadow-sm">
                    {title}
                </h1>

                {description && (
                    <p className="text-lg text-white/80 leading-relaxed max-w-2xl mb-10 line-clamp-4 md:line-clamp-none font-light">
                        {description}
                    </p>
                )}

                {/* Progress Section Integrated */}
                <div className="max-w-md bg-white/5 backdrop-blur-md rounded-xl p-5 border border-white/10 shadow-lg hover:bg-white/10 transition-colors">
                    <div className="flex justify-between text-sm mb-3 text-white/90">
                        <span className="font-medium">Seu Progresso</span>
                        <span className="text-gold font-bold">{completedDays} de {totalDays} dias</span>
                    </div>
                    <Progress value={progressPercent} className="h-2 bg-black/20 [&>div]:bg-gold" />
                </div>
            </div>
        </div>
    );
};
