'use client';

import { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Unlink,
  Undo,
  Redo,
} from 'lucide-react';
import { toast } from 'sonner';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder,
  minHeight = '200px',
}: RichTextEditorProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
    ],
    content,
    immediatelyRender: false,
    // Ensure initial content is synced if it changes externally (controlled component behavior)
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-full w-full focus:outline-none p-4 min-h-[${minHeight}] [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 break-words overflow-wrap-anywhere`,
        style: 'word-break: break-word; overflow-wrap: anywhere;',
      },
    },
  });

  if (!editor) {
    return null;
  }

  function handleOpenLinkDialog() {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);
    const existingLink = editor.getAttributes('link');

    if (existingLink.href) {
      setLinkUrl(existingLink.href);
      setLinkText(selectedText || '');
    } else if (selectedText) {
      setLinkText(selectedText);
      setLinkUrl('');
    } else {
      setLinkText('');
      setLinkUrl('');
    }

    setLinkDialogOpen(true);
  }

  function handleAddLink() {
    if (!editor) return;

    if (!linkUrl.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    let finalUrl = linkUrl.trim();
    if (!finalUrl.match(/^https?:\/\//)) {
      finalUrl = `https://${finalUrl}`;
    }

    const existingLink = editor.getAttributes('link');
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);

    if (existingLink.href) {
      if (linkText.trim() && linkText.trim() !== selectedText) {
        editor
          .chain()
          .focus()
          .extendMarkRange('link')
          .insertContent(`<a href="${finalUrl}">${linkText.trim()}</a>`)
          .run();
      } else {
        editor
          .chain()
          .focus()
          .extendMarkRange('link')
          .setLink({ href: finalUrl })
          .run();
      }
    } else {
      if (selectedText) {
        editor.chain().focus().setLink({ href: finalUrl }).run();
      } else {
        editor
          .chain()
          .focus()
          .insertContent(
            `<a href="${finalUrl}">${linkText.trim() || finalUrl}</a>`
          )
          .run();
      }
    }

    setLinkDialogOpen(false);
    setLinkUrl('');
    setLinkText('');
  }

  function handleRemoveLink() {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
    setLinkDialogOpen(false);
  }

  return (
    <div className="bg-background w-full max-w-full overflow-hidden rounded-md border">
      {/* Toolbar */}
      <div className="bg-muted/50 flex flex-wrap gap-1 border-b p-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-muted' : ''}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-muted' : ''}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>

        <div className="bg-border mx-1 h-6 w-px" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-muted' : ''}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-muted' : ''}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="bg-border mx-1 h-6 w-px" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleOpenLinkDialog}
          className={editor.isActive('link') ? 'bg-muted' : ''}
          title="Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>

        {editor.isActive('link') && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemoveLink}
            title="Remove Link"
          >
            <Unlink className="h-4 w-4" />
          </Button>
        )}

        <div className="flex-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <EditorContent
        editor={editor}
        className="min-h-[150px] break-words"
        style={{
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
        }}
      />

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editor.isActive('link') ? 'Edit Link' : 'Add Link'}
            </DialogTitle>
            <DialogDescription>Enter the URL for the link.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
              />
            </div>
            <div className="space-y-2">
              <Label>Link Text</Label>
              <Input
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Click here"
                onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddLink}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
