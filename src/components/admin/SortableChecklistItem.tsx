import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface ChecklistItem {
  id: string;
  label: string;
  label_pt: string | null;
  sort_order: number;
}

interface SortableChecklistItemProps {
  item: ChecklistItem;
  onUpdate: (id: string, updates: Partial<ChecklistItem>) => void;
  onDelete: (id: string) => void;
}

export const SortableChecklistItem = ({ item, onUpdate, onDelete }: SortableChecklistItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card border rounded-lg p-3 ${isDragging ? 'shadow-lg ring-2 ring-gold' : ''}`}
    >
      <div className="flex items-center gap-3">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Checkbox Icon */}
        <div className="w-5 h-5 rounded border border-gold/50 flex items-center justify-center text-gold/50">
          <Check className="h-3 w-3" />
        </div>

        {/* Label Fields */}
        <div className="flex-1 flex gap-2">
          <Input
            value={item.label_pt || ''}
            onChange={(e) => onUpdate(item.id, { label_pt: e.target.value })}
            placeholder="Rótulo (PT)"
            className="flex-1"
          />
          <Input
            value={item.label}
            onChange={(e) => onUpdate(item.id, { label: e.target.value })}
            placeholder="Label (EN)"
            className="flex-1 text-sm"
          />
        </div>

        {/* Delete Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(item.id)}
          className="text-muted-foreground hover:text-destructive shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
