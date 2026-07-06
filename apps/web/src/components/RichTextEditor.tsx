import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

const BUTTON_CLASS =
  'rounded-md px-2 py-1 text-xs font-semibold text-tb-muted transition-colors hover:bg-tb-surface-2 hover:text-tb-text data-[active=true]:bg-tb-accent-tint data-[active=true]:text-tb-accent';

/** Editor de reglas del panel de admin. Tiptap solo serializa nodos/marcas de su propio
 * esquema (negrita, listas, títulos, enlaces…) — no puede producir `<script>` ni atributos
 * arbitrarios, por eso no hace falta un sanitizador aparte antes de guardar el HTML. */
export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'tb-rich-text min-h-[200px] px-3 py-2 text-sm text-tb-text focus:outline-none',
      },
    },
  });

  useEffect(() => {
    if (!editor || value === editor.getHTML()) return;
    editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-tb-border bg-tb-surface">
      <div className="flex flex-wrap gap-1 border-b border-tb-border p-1.5">
        <button
          type="button"
          data-active={editor.isActive('bold')}
          className={BUTTON_CLASS}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          B
        </button>
        <button
          type="button"
          data-active={editor.isActive('italic')}
          className={BUTTON_CLASS}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          I
        </button>
        <button
          type="button"
          data-active={editor.isActive('heading', { level: 2 })}
          className={BUTTON_CLASS}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </button>
        <button
          type="button"
          data-active={editor.isActive('heading', { level: 3 })}
          className={BUTTON_CLASS}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </button>
        <button
          type="button"
          data-active={editor.isActive('bulletList')}
          className={BUTTON_CLASS}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • Lista
        </button>
        <button
          type="button"
          data-active={editor.isActive('orderedList')}
          className={BUTTON_CLASS}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. Lista
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
