import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SortableContentBlock, ContentBlock } from './SortableContentBlock';
import { SortableChecklistItem, ChecklistItem } from './SortableChecklistItem';

interface DayEditorProps {
  dayId: string;
  dayNumber: number;
  dayTitle: string;
  dayTitlePt: string | null;
  contentBlocks: ContentBlock[];
  checklistItems: ChecklistItem[];
  onUpdateDayTitle: (title: string, titlePt: string) => void;
  onUpdateContentBlocks: (blocks: ContentBlock[]) => void;
  onUpdateChecklistItems: (items: ChecklistItem[]) => void;
  isSaving: boolean;
}

export const DayEditor = ({
  dayNumber,
  dayTitle,
  dayTitlePt,
  contentBlocks,
  checklistItems,
  onUpdateDayTitle,
  onUpdateContentBlocks,
  onUpdateChecklistItems,
  isSaving,
}: DayEditorProps) => {
  const [localTitle, setLocalTitle] = useState(dayTitle);
  const [localTitlePt, setLocalTitlePt] = useState(dayTitlePt || '');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Content block handlers
  const handleContentDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = contentBlocks.findIndex((b) => b.id === active.id);
      const newIndex = contentBlocks.findIndex((b) => b.id === over.id);
      const newBlocks = arrayMove(contentBlocks, oldIndex, newIndex).map((b, i) => ({
        ...b,
        sort_order: i,
      }));
      onUpdateContentBlocks(newBlocks);
    }
  }, [contentBlocks, onUpdateContentBlocks]);

  const handleUpdateBlock = useCallback((id: string, updates: Partial<ContentBlock>) => {
    const newBlocks = contentBlocks.map((b) =>
      b.id === id ? { ...b, ...updates } : b
    );
    onUpdateContentBlocks(newBlocks);
  }, [contentBlocks, onUpdateContentBlocks]);

  const handleDeleteBlock = useCallback((id: string) => {
    const newBlocks = contentBlocks
      .filter((b) => b.id !== id)
      .map((b, i) => ({ ...b, sort_order: i }));
    onUpdateContentBlocks(newBlocks);
  }, [contentBlocks, onUpdateContentBlocks]);

  const handleAddBlock = useCallback(() => {
    const newBlock: ContentBlock = {
      id: `new-${Date.now()}`,
      block_type: 'paragraph',
      content: '',
      content_pt: '',
      sort_order: contentBlocks.length,
    };
    onUpdateContentBlocks([...contentBlocks, newBlock]);
  }, [contentBlocks, onUpdateContentBlocks]);

  // Checklist item handlers
  const handleChecklistDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = checklistItems.findIndex((i) => i.id === active.id);
      const newIndex = checklistItems.findIndex((i) => i.id === over.id);
      const newItems = arrayMove(checklistItems, oldIndex, newIndex).map((item, i) => ({
        ...item,
        sort_order: i,
      }));
      onUpdateChecklistItems(newItems);
    }
  }, [checklistItems, onUpdateChecklistItems]);

  const handleUpdateItem = useCallback((id: string, updates: Partial<ChecklistItem>) => {
    const newItems = checklistItems.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    onUpdateChecklistItems(newItems);
  }, [checklistItems, onUpdateChecklistItems]);

  const handleDeleteItem = useCallback((id: string) => {
    const newItems = checklistItems
      .filter((item) => item.id !== id)
      .map((item, i) => ({ ...item, sort_order: i }));
    onUpdateChecklistItems(newItems);
  }, [checklistItems, onUpdateChecklistItems]);

  const handleAddItem = useCallback(() => {
    const newItem: ChecklistItem = {
      id: `new-${Date.now()}`,
      label: '',
      label_pt: '',
      sort_order: checklistItems.length,
    };
    onUpdateChecklistItems([...checklistItems, newItem]);
  }, [checklistItems, onUpdateChecklistItems]);

  const handleTitleBlur = () => {
    if (localTitle !== dayTitle || localTitlePt !== (dayTitlePt || '')) {
      onUpdateDayTitle(localTitle, localTitlePt);
    }
  };

  return (
    <div className="space-y-8">
      {/* Day Title */}
      <div className="prayer-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold font-display font-semibold">
            {dayNumber}
          </div>
          <h3 className="font-display text-xl font-semibold text-primary">
            Dia {dayNumber}
          </h3>
          {isSaving && <Loader2 className="h-4 w-4 animate-spin text-gold" />}
        </div>

        <div className="grid gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Título (Português)
            </label>
            <input
              type="text"
              value={localTitlePt}
              onChange={(e) => setLocalTitlePt(e.target.value)}
              onBlur={handleTitleBlur}
              className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 ring-gold/50 outline-none"
              placeholder="Ex: Dia 1: São José, Modelo de Humildade"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Title (English)
            </label>
            <input
              type="text"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={handleTitleBlur}
              className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 ring-gold/50 outline-none text-sm"
              placeholder="Ex: Day 1: Saint Joseph, Model of Humility"
            />
          </div>
        </div>
      </div>

      {/* Content Blocks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-display text-lg font-semibold text-foreground">
            Blocos de Conteúdo
          </h4>
          <Button variant="gold-outline" size="sm" onClick={handleAddBlock}>
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Bloco
          </Button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleContentDragEnd}
        >
          <SortableContext
            items={contentBlocks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {contentBlocks.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
                  Nenhum bloco de conteúdo. Clique em "Adicionar Bloco" para começar.
                </div>
              ) : (
                contentBlocks.map((block) => (
                  <SortableContentBlock
                    key={block.id}
                    block={block}
                    onUpdate={handleUpdateBlock}
                    onDelete={handleDeleteBlock}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Checklist Items */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-display text-lg font-semibold text-foreground">
            Checklist de Orações
          </h4>
          <Button variant="gold-outline" size="sm" onClick={handleAddItem}>
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Item
          </Button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleChecklistDragEnd}
        >
          <SortableContext
            items={checklistItems.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {checklistItems.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
                  Nenhum item de checklist.
                </div>
              ) : (
                checklistItems.map((item) => (
                  <SortableChecklistItem
                    key={item.id}
                    item={item}
                    onUpdate={handleUpdateItem}
                    onDelete={handleDeleteItem}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};
