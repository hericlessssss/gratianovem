import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { OrnamentView } from '../nodeviews/OrnamentView';

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        ornament: {
            setOrnament: (variant?: string) => ReturnType;
        };
    }
}

export const OrnamentExtension = Node.create({
    name: 'ornament',

    group: 'block',

    atom: true,

    addAttributes() {
        return {
            variant: {
                default: 'flourish-simple',
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="ornament"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'ornament' })];
    },

    addCommands() {
        return {
            setOrnament:
                (variant = 'flourish-simple') =>
                    ({ commands }) => {
                        return commands.insertContent({
                            type: 'ornament',
                            attrs: { variant },
                        });
                    },
        };
    },

    addNodeView() {
        return ReactNodeViewRenderer(OrnamentView);
    },
});
