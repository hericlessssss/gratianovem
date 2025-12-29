import { JSONContent } from '@tiptap/react';
import { v4 as uuidv4 } from 'uuid';

interface LegacyBlock {
    block_type: string;
    content: string;
    content_pt?: string;
}

interface LegacyChecklist {
    label: string;
    label_pt?: string;
    repetition_count?: number;
}

export const convertLegacyToTipTap = (
    blocks: LegacyBlock[],
    checklist: LegacyChecklist[],
    targetLocale: 'pt' | 'en'
): JSONContent => {
    const content: JSONContent[] = [];

    // Convert blocks
    blocks.forEach((block) => {
        const text = targetLocale === 'pt' ? (block.content_pt || block.content) : block.content;

        if (!text) return;

        if (block.block_type === 'prayer') {
            content.push({
                type: 'blockquote',
                content: [{ type: 'paragraph', text }],
            });
        } else if (block.block_type === 'quote') {
            content.push({
                type: 'blockquote', // Quotes also as blockquotes for now
                content: [{ type: 'paragraph', text }],
            });
        } else {
            // Paragraph
            content.push({
                type: 'paragraph',
                text, // Simple text, formatting is lost if HTML was not used. 
                // If legacy content has HTML, we might need a parser. 
                // Assuming plain text for now as per previous schema 'text'.
            });
        }
    });

    // Append checklist at the end
    if (checklist.length > 0) {
        content.push({
            type: 'prayerChecklist',
            attrs: {
                items: checklist.map((item) => ({
                    id: uuidv4(),
                    label_pt: item.label_pt || item.label,
                    label_en: item.label,
                    repetition_count: item.repetition_count || 1,
                })),
            },
        });
    }

    return {
        type: 'doc',
        content,
    };
};
