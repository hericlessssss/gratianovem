import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { PrayerChecklistView } from '../nodeviews/PrayerChecklistView';

export interface PrayerChecklistItem {
    id: string;
    label_pt: string;
    label_en: string;
    repetition_count: number;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        prayerChecklist: {
            setPrayerChecklist: (attrs?: { items?: PrayerChecklistItem[] }) => ReturnType;
        };
    }
}

export const PrayerChecklist = Node.create({
    name: 'prayerChecklist',

    group: 'block',

    atom: true,

    addAttributes() {
        return {
            items: {
                default: [],
                parseHTML: (element) => {
                    const itemsStr = element.getAttribute('data-items');
                    return itemsStr ? JSON.parse(itemsStr) : [];
                },
                renderHTML: (attributes) => {
                    return {
                        'data-items': JSON.stringify(attributes.items),
                    };
                },
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'prayer-checklist',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['prayer-checklist', mergeAttributes(HTMLAttributes)];
    },

    addNodeView() {
        return ReactNodeViewRenderer(PrayerChecklistView);
    },

    addCommands() {
        return {
            setPrayerChecklist:
                (attrs) =>
                    ({ commands }) => {
                        return commands.insertContent({
                            type: this.name,
                            attrs: attrs,
                        });
                    },
        };
    },
});
