import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import ChristianCross from '@/components/ui/ChristianCross';
import { Novena } from '@/hooks/useHomeData';

interface FeaturedNovenasCarouselProps {
    novenas: Novena[];
    isLoading: boolean;
}

const FeaturedNovenasCarousel = ({ novenas, isLoading }: FeaturedNovenasCarouselProps) => {
    if (isLoading) {
        return (
            <div className="w-full h-[400px] flex items-center justify-center bg-primary/5 rounded-xl border border-gold/20 animate-pulse">
                <div className="h-8 w-8 text-gold animate-spin" />
            </div>
        );
    }

    if (!novenas || novenas.length === 0) {
        return null;
    }

    return (
        <div className="w-full max-w-5xl mx-auto px-4">
            <div className="text-center mb-12">
                <div className="text-gold flex justify-center mb-4">
                    <ChristianCross className="h-10 w-10 drop-shadow-[0_0_15px_rgba(255,215,0,0.3)]" />
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/10 rounded-full text-[10px] md:text-xs font-medium text-gold uppercase tracking-wider mb-3 border border-gold/20">
                    Sugestões da Comunidade
                </div>
                <h2 className="font-display text-3xl md:text-4xl font-semibold text-white">
                    Novenas em Destaque
                </h2>
            </div>

            <Carousel
                opts={{
                    align: "start",
                    loop: true,
                }}
                plugins={[
                    Autoplay({
                        delay: 3000,
                    }),
                ]}
                className="w-full"
            >
                <CarouselContent className="-ml-6 py-4">
                    {novenas.map((novena) => (
                        <CarouselItem key={novena.id} className="pl-6 md:basis-1/2 lg:basis-1/3">
                            <div className="h-full bg-primary-foreground/5 backdrop-blur-sm hover:bg-primary-foreground/10 transition-all duration-300 border border-white/10 hover:border-gold/50 rounded-xl p-6 flex flex-col items-start justify-between group hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]">
                                <div className="w-full">
                                    <div className="mb-6 w-full h-48 md:h-40 rounded-lg overflow-hidden bg-black/20 relative group-hover:shadow-inner transition-all">
                                        {novena.image_url ? (
                                            <img
                                                src={novena.image_url}
                                                alt={novena.title}
                                                className="w-full h-full object-cover object-top opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gold/30">
                                                <ChristianCross className="h-16 w-16" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md p-2 rounded-full text-gold group-hover:text-white transition-colors border border-white/10">
                                            <BookOpen className="h-4 w-4" />
                                        </div>
                                    </div>

                                    <h3 className="font-display text-xl font-semibold text-white mb-3 line-clamp-2 min-h-[3.5rem] group-hover:text-gold transition-colors">
                                        {novena.title_pt || novena.title}
                                    </h3>

                                    <p className="text-white/70 text-sm line-clamp-3 mb-6 min-h-[3.75rem]">
                                        {novena.description_pt || novena.description}
                                    </p>
                                </div>

                                <Button asChild variant="outline" size="sm" className="w-full justify-between bg-transparent border-white/20 text-white hover:bg-gold hover:text-primary-foreground hover:border-gold group-hover:border-white/40 transition-all">
                                    <Link to={`/novena/${novena.slug}`}>
                                        Ler mais
                                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </Button>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <div className="hidden md:block">
                    <CarouselPrevious className="-left-12 bg-transparent border-white/20 text-white hover:text-primary hover:bg-gold hover:border-gold" />
                    <CarouselNext className="-right-12 bg-transparent border-white/20 text-white hover:text-primary hover:bg-gold hover:border-gold" />
                </div>
            </Carousel>
        </div>
    );
};

export default FeaturedNovenasCarousel;
