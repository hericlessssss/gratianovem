import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Ornament, OrnamentVariant } from '@/components/ui/Ornaments';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Settings2 } from 'lucide-react';

export const OrnamentView = (props: NodeViewProps) => {
    const currentVariant = props.node.attrs.variant as OrnamentVariant;

    const updateVariant = (variant: OrnamentVariant) => {
        props.updateAttributes({ variant });
    };

    const variants: OrnamentVariant[] = ['flourish-simple', 'flourish-complex', 'cross-divider', 'diamond-divider'];

    return (
        <NodeViewWrapper className="ornament-node relative group my-4">
            <div className="flex justify-center items-center py-2 hover:bg-gold/5 rounded-lg transition-colors cursor-default">
                <Ornament variant={currentVariant} className="w-full max-w-[200px] text-gold/80" />
            </div>

            {/* Controls - Visible on hover/selection */}
            <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                            <Settings2 className="h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-2" align="end">
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground mb-2 px-2">Escolha o estilo:</p>
                            {variants.map(v => (
                                <div
                                    key={v}
                                    onClick={() => updateVariant(v)}
                                    className={`p-2 rounded cursor-pointer hover:bg-gold/10 flex justify-center ${currentVariant === v ? 'bg-gold/10 ring-1 ring-gold/20' : ''}`}
                                >
                                    <Ornament variant={v} className="h-4 w-auto" />
                                </div>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </NodeViewWrapper>
    );
};
