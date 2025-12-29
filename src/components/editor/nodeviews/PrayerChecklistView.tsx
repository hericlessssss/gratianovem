import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, GripVertical, ListTodo } from 'lucide-react';
import { PrayerChecklistItem } from '../extensions/prayerChecklist';
import { v4 as uuidv4 } from 'uuid';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

export const PrayerChecklistView = (props: NodeViewProps) => {
    const items: PrayerChecklistItem[] = props.node.attrs.items || [];

    const updateItems = (newItems: PrayerChecklistItem[]) => {
        props.updateAttributes({
            items: newItems,
        });
    };

    const addItem = () => {
        const newItem: PrayerChecklistItem = {
            id: uuidv4(),
            label_pt: '',
            label_en: '',
            repetition_count: 1,
        };
        updateItems([...items, newItem]);
    };

    const removeItem = (id: string) => {
        updateItems(items.filter((item) => item.id !== id));
    };

    const updateItem = (id: string, updates: Partial<PrayerChecklistItem>) => {
        updateItems(
            items.map((item) => (item.id === id ? { ...item, ...updates } : item))
        );
    };

    return (
        <NodeViewWrapper className="my-6 not-prose">
            <Card className="border-gold/20 bg-muted/30">
                <CardHeader className="py-3 px-4 border-b border-gold/10 flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-medium flex items-center gap-2 text-primary">
                        <ListTodo className="h-4 w-4" />
                        Checklist de Orações
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={addItem} className="h-7 text-xs">
                        <Plus className="h-3 w-3 mr-1" />
                        Adicionar Item
                    </Button>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                    {items.length === 0 ? (
                        <div className="text-center py-4 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                            Nenhum item no checklist ainda.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {items.map((item, index) => (
                                <div
                                    key={item.id}
                                    className="group flex gap-3 items-start p-3 bg-background rounded-md border border-border/50 hover:border-gold/30 transition-colors"
                                >
                                    <div className="mt-2 text-muted-foreground cursor-grab active:cursor-grabbing">
                                        <GripVertical className="h-4 w-4" />
                                    </div>

                                    <div className="flex-1 space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label className="text-xs text-muted-foreground mb-1 block">Português</Label>
                                                <Input
                                                    value={item.label_pt}
                                                    onChange={(e) => updateItem(item.id, { label_pt: e.target.value })}
                                                    placeholder="Ex: Rezar 1 Pai Nosso"
                                                    className="h-8 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs text-muted-foreground mb-1 block">English</Label>
                                                <Input
                                                    value={item.label_en}
                                                    onChange={(e) => updateItem(item.id, { label_en: e.target.value })}
                                                    placeholder="Ex: Pray 1 Our Father"
                                                    className="h-8 text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <Label className="text-xs text-muted-foreground">Repetições:</Label>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    value={item.repetition_count}
                                                    onChange={(e) => updateItem(item.id, { repetition_count: parseInt(e.target.value) || 1 })}
                                                    className="h-7 w-20 text-xs text-center"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeItem(item.id)}
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive mt-1"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </NodeViewWrapper>
    );
};
