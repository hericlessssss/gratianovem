import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Type, BookOpen, Quote, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface ContentBlock {
  id: string;
  block_type: 'paragraph' | 'prayer' | 'quote' | 'intention';
  content: string;
  content_pt: string | null;
  sort_order: number;
}

interface SortableContentBlockProps {
  block: ContentBlock;
  onUpdate: (id: string, updates: Partial<ContentBlock>) => void;
  onDelete: (id: string) => void;
}

const blockTypeIcons = {
  paragraph: Type,
  prayer: BookOpen,
  quote: Quote,
  intention: Lightbulb,
};

const blockTypeLabels = {
  paragraph: 'Parágrafo',
  prayer: 'Oração',
  quote: 'Citação',
  intention: 'Intenção',
};

export const SortableContentBlock = ({ block, onUpdate, onDelete }: SortableContentBlockProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = blockTypeIcons[block.block_type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card border rounded-lg p-4 ${isDragging ? 'shadow-lg ring-2 ring-gold' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-1 p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <div className="flex-1 space-y-3">
          {/* Block Type Selector */}
          <div className="flex items-center gap-3">
            <Icon className="h-4 w-4 text-gold" />
            <Select
              value={block.block_type}
              onValueChange={(value) => onUpdate(block.id, { block_type: value as ContentBlock['block_type'] })}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paragraph">Parágrafo</SelectItem>
                <SelectItem value="prayer">Oração</SelectItem>
                <SelectItem value="quote">Citação</SelectItem>
                <SelectItem value="intention">Intenção</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">
              {blockTypeLabels[block.block_type]}
            </span>
          </div>

          {/* Content Fields */}
          <div className="grid gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Conteúdo (Português)
              </label>
              <Textarea
                value={block.content_pt || ''}
                onChange={(e) => onUpdate(block.id, { content_pt: e.target.value })}
                placeholder="Conteúdo em português..."
                rows={3}
                className="resize-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Content (English - fallback)
              </label>
              <Textarea
                value={block.content}
                onChange={(e) => onUpdate(block.id, { content: e.target.value })}
                placeholder="Content in English..."
                rows={2}
                className="resize-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Delete Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(block.id)}
          className="text-muted-foreground hover:text-destructive shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
