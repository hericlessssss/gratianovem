import { useEditor, EditorContent, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { PrayerChecklist } from './extensions/prayerChecklist';
import { EditorToolbar } from './EditorToolbar';
import { useEffect } from 'react';

interface RichTextEditorProps {
    content: JSONContent | null;
    onChange: (content: JSONContent) => void;
    editable?: boolean;
    placeholder?: string;
    className?: string;
}

export const RichTextEditor = ({
    content,
    onChange,
    editable = true,
    placeholder = 'Comece a escrever...',
    className = '',
}: RichTextEditorProps) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
                dropcursor: {
                    color: '#DBB05D',
                    class: 'text-gold',
                },
            }),
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary underline cursor-pointer',
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
            PrayerChecklist,
        ],
        content: content,
        editable,
        onUpdate: ({ editor }) => {
            onChange(editor.getJSON());
        },
        editorProps: {
            attributes: {
                class: `min-h-[300px] w-full rounded-b-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 prose prose-stone dark:prose-invert max-w-none ${className}`,
            },
        },
    });

    // Update content if it changes externally (e.g. loading data)
    useEffect(() => {
        if (editor && content) {
            const currentContent = editor.getJSON();
            // Simple check to avoid loops/resets while typing
            // A deeper comparison might be needed for robust two-way binding, 
            // but for "load then edit" it's usually fine to only set if editor is empty or significantly different.
            // However, for this use case (admin loading a day), we usually load once.
            // We'll trust the parent to pass valid initial content.

            // If the editor is empty and content is provided, set it.
            if (editor.isEmpty && content.content && content.content.length > 0) {
                editor.commands.setContent(content);
            }
        }
    }, [content, editor]);

    return (
        <div className="w-full">
            {editable && <EditorToolbar editor={editor} />}
            <EditorContent editor={editor} />
        </div>
    );
};
