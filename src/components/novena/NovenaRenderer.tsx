import { JSONContent } from '@tiptap/react';
import { Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Ornament } from '@/components/ui/Ornaments';

interface NovenaRendererProps {
    doc: JSONContent | null;
    checklistState: Record<string, number | boolean>;
    onChecklistUpdate: (itemId: string, newValue: number | boolean) => void;
    isLocked?: boolean;
    readOnly?: boolean;
}

export const NovenaRenderer = ({
    doc,
    checklistState,
    onChecklistUpdate,
    isLocked = false,
    readOnly = false,
}: NovenaRendererProps) => {
    if (!doc || !doc.content) return null;

    const renderNode = (node: JSONContent, index: number) => {
        switch (node.type) {
            case 'heading': {
                const Level = `h${node.attrs?.level || 1}` as keyof JSX.IntrinsicElements;
                return (
                    <Level key={index} className={cn("font-display font-semibold text-primary mb-4",
                        node.attrs?.level === 1 ? "text-lg" :
                            node.attrs?.level === 2 ? "text-base" : "text-sm")}>
                        {node.content?.map((c) => c.text).join('')}
                    </Level>
                );
            }
            case 'ornament':
                return <Ornament variant={node.attrs?.variant} key={index} />;

            case 'paragraph':
                return (
                    <p key={index} className="text-foreground leading-relaxed whitespace-pre-line mb-4">
                        {node.content ? node.content.map(c => {
                            if (c.type === 'text') {
                                if (c.marks) {
                                    return c.marks.reduce((text, mark) => {
                                        if (mark.type === 'bold') return <strong>{text}</strong>;
                                        if (mark.type === 'italic') return <em>{text}</em>;
                                        if (mark.type === 'underline') return <u>{text}</u>;
                                        if (mark.type === 'link') return <a href={mark.attrs?.href} target="_blank" rel="noopener noreferrer" className="text-primary underline cursor-pointer">{text}</a>;
                                        return text;
                                    }, <>{c.text}</>);
                                }
                                return c.text;
                            }
                            if (c.type === 'hardBreak') {
                                return <br />;
                            }
                            return null;
                        }) : <br />}
                    </p>
                );
            case 'blockquote':
                return (
                    <blockquote key={index} className="border-l-4 border-gold/30 pl-4 py-1 my-4 italic text-muted-foreground">
                        {node.content?.map((c, i) => renderNode(c, i))}
                    </blockquote>
                );
            case 'prayerChecklist': {
                const items = node.attrs?.items || [];
                if (items.length === 0) return null;

                interface ChecklistItem {
                    id: string;
                    repetition_count: number;
                    label: string;
                    label_pt?: string;
                    label_en?: string;
                }

                return (
                    // Use readOnly to disable interaction without heavy visual locking (unless strictly locked)
                    <div key={index} className={cn("prayer-card mb-8", (isLocked || readOnly) && "opacity-60 pointer-events-none")}>
                        <h4 className="font-display text-lg font-semibold text-primary mb-4">
                            Orações do Dia
                        </h4>
                        <div className="space-y-6">
                            {items.map((item: ChecklistItem) => {
                                const isBeadMode = item.repetition_count > 1;
                                const currentValue = checklistState[item.id];

                                // Helper to get number value
                                const getCount = () => {
                                    if (typeof currentValue === 'number') return currentValue;
                                    return currentValue ? item.repetition_count : 0;
                                };

                                const count = getCount();

                                return (
                                    <div key={item.id} className="space-y-2">
                                        {isBeadMode ? (
                                            <div className="p-4 rounded-lg bg-gold/5 border border-gold/10">
                                                <p className="font-medium text-foreground mb-3">
                                                    {item.label_pt || item.label}
                                                </p>
                                                <div className="flex flex-wrap gap-3 items-center">
                                                    {Array.from({ length: item.repetition_count }).map((_, idx) => {
                                                        const beadNum = idx + 1;
                                                        const isActive = count >= beadNum;
                                                        return (
                                                            <button
                                                                key={beadNum}
                                                                onClick={() => !readOnly && !isLocked && onChecklistUpdate(item.id, isActive && count === beadNum ? beadNum - 1 : beadNum)}
                                                                disabled={isLocked || readOnly}
                                                                className={cn(
                                                                    "w-8 h-8 rounded-full border-2 transition-all duration-300 flex items-center justify-center",
                                                                    isActive
                                                                        ? "bg-gold border-gold text-white shadow-md scale-110"
                                                                        : "bg-transparent border-gold/30 text-muted-foreground",
                                                                    (!isLocked && !readOnly) && "hover:border-gold/60"
                                                                )}
                                                            >
                                                                {isActive && <Check className="w-4 h-4" />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : (
                                            <label
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-lg transition-colors",
                                                    currentValue ? "bg-gold/10" : "",
                                                    (!isLocked && !readOnly) ? "cursor-pointer hover:bg-muted/50" : "cursor-default"
                                                )}
                                            >
                                                <Checkbox
                                                    checked={!!currentValue}
                                                    onCheckedChange={(checked) => !readOnly && onChecklistUpdate(item.id, !!checked)}
                                                    disabled={isLocked || readOnly}
                                                    className="data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                                                />
                                                <span className={cn(
                                                    "flex-1",
                                                    currentValue ? "text-muted-foreground line-through" : "text-foreground"
                                                )}>
                                                    {item.label_pt || item.label_en || item.label}
                                                </span>
                                            </label>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            }
            default:
                // Fallback for nested content like in 'doc' top level if not iterating content directly
                if (node.content) {
                    return <div key={index}>{node.content.map((c, i) => renderNode(c, i))}</div>;
                }
                return null;
        }
    };

    return (
        <div className="novena-content max-w-none text-sm text-secondary/50 font-body leading-relaxed">
            {/* Automatic Top Ornament */}
            <div className="flex justify-center mb-8 opacity-70">
                <div
                    className="w-full max-w-[800px] h-32 bg-gold"
                    style={{
                        maskImage: 'url(/arabesco.png)',
                        maskSize: 'contain',
                        maskRepeat: 'no-repeat',
                        maskPosition: 'center',
                        WebkitMaskImage: 'url(/arabesco.png)',
                        WebkitMaskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                    }}
                />
            </div>

            <div className={cn("space-y-4", isLocked && "opacity-75")}>
                {doc.content.map((node, index) => renderNode(node, index))}
            </div>

            {/* Automatic Bottom Ornament */}
            <div className="flex justify-center mt-12 mb-4 opacity-60">
                <Ornament variant="diamond-divider" className="w-24 h-auto text-gold" />
            </div>
        </div>
    );
};
