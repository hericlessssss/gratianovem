import { Star, Heart, BookOpen, Clock, Shield, Lock } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ChristianCross from '@/components/ui/ChristianCross';

const ConsecrationPage = () => {
    return (
        <Layout>
            <div className="container py-12 md:py-20">

                {/* Header */}
                <div className="text-center mb-16 space-y-4">
                    <Badge variant="outline" className="border-gold text-gold mb-2">
                        Vida Interior
                    </Badge>
                    <h1 className="font-display text-3xl md:text-5xl font-semibold text-primary">
                        Consagrações Totais
                    </h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
                        Aprofunde sua fé através da entrega total a Jesus pelas mãos de Maria e sob a proteção de São José.
                        Um caminho de santidade trilhado por nossos maiores exemplos de fé e obediência a Deus.
                    </p>
                </div>

                <div className="max-w-4xl mx-auto space-y-8">

                    {/* Section: Nossa Senhora */}
                    <div className="prayer-card hover:shadow-lg transition-shadow animate-fade-in-up">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gold/10 flex items-center justify-center text-gold shrink-0">
                                <ChristianCross className="w-8 h-8 md:w-10 md:h-10" />
                            </div>

                            <div className="flex-1 space-y-6">
                                <div>
                                    <h2 className="font-display text-2xl md:text-3xl font-semibold text-primary mb-2">
                                        Consagração a Nossa Senhora
                                    </h2>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Método de São Luís Maria Grignion de Montfort (Totus Tuus)
                                    </p>
                                </div>

                                <div className="prose prose-stone dark:prose-invert max-w-none text-muted-foreground">
                                    <p>
                                        A "Escravidão de Amor" é um ato de entrega total a Jesus Cristo pelas mãos de Maria.
                                        São Luís ensina que Maria é o caminho mais seguro, fácil, curto e perfeito para chegarmos a Deus e nos configurarmos a Cristo.
                                    </p>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-primary font-medium">
                                            <BookOpen className="w-4 h-4 text-gold" />
                                            Como funciona?
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Uma preparação de 33 dias de orações e meditações, dividida em quatro etapas para o desapego do mundo e conhecimento de si, de Maria e de Jesus.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-primary font-medium">
                                            <Heart className="w-4 h-4 text-gold" />
                                            O que esperar?
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Uma profunda renovação das promessas do Batismo e uma proteção maternal especial. "Tudo o que é meu é teu, ó Maria".
                                        </p>
                                    </div>
                                </div>

                                {/* Coming Soon Box */}
                                <div className="mt-8 bg-muted/50 border border-border/50 rounded-xl p-5 flex items-center gap-4">
                                    <div className="bg-background p-2 rounded-full shrink-0 border border-border/50">
                                        <Clock className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-primary text-sm mb-1">
                                            Em breve no App
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Estamos preparando o itinerário completo de 33 dias, com todas as leituras do Tratado e orações diárias integradas ao seu progresso.
                                        </p>
                                    </div>
                                    <Button disabled variant="outline" className="opacity-75">
                                        Aguarde
                                    </Button>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* Section: São José */}
                    <div className="prayer-card hover:shadow-lg transition-shadow animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gold/10 flex items-center justify-center text-gold shrink-0">
                                <Shield className="w-8 h-8 md:w-10 md:h-10" />
                            </div>

                            <div className="flex-1 space-y-6">
                                <div>
                                    <h2 className="font-display text-2xl md:text-3xl font-semibold text-primary mb-2">
                                        Consagração a São José
                                    </h2>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Patrocínio e Paternidade Espiritual
                                    </p>
                                </div>

                                <div className="prose prose-stone dark:prose-invert max-w-none text-muted-foreground">
                                    <p>
                                        Busca imitar as virtudes e confiar na proteção daquele que foi escolhido por Deus para ser o guardião da Sagrada Família.
                                        Entregar-se a São José é pedir sua ajuda paterna para crescer em santidade e servir a Jesus e Maria com maior fidelidade.
                                    </p>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-primary font-medium">
                                            <BookOpen className="w-4 h-4 text-gold" />
                                            Como funciona?
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Semelhante à Mariama, consiste em 33 dias de preparação meditando sobre os títulos e dores e alegrias do Santo Patriarca.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-primary font-medium">
                                            <Lock className="w-4 h-4 text-gold" />
                                            O que esperar?
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            O aumento da força espiritual contra as tentações, amor pelo trabalho santificado e defesa da família. "Ide a José".
                                        </p>
                                    </div>
                                </div>

                                {/* Coming Soon Box */}
                                <div className="mt-8 bg-muted/50 border border-border/50 rounded-xl p-5 flex items-center gap-4">
                                    <div className="bg-background p-2 rounded-full shrink-0 border border-border/50">
                                        <Clock className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-primary text-sm mb-1">
                                            Em breve no App
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            O roteiro completo de consagração e acompanhamento espiritual estará disponível aqui em futuras atualizações.
                                        </p>
                                    </div>
                                    <Button disabled variant="outline" className="opacity-75">
                                        Aguarde
                                    </Button>
                                </div>

                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </Layout>
    );
};

export default ConsecrationPage;
