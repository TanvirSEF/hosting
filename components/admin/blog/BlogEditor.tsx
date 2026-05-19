'use client';

import { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Heading2,
  Heading3,
  Quote,
  Code,
  Undo,
  Redo,
  ImageIcon,
  Link as LinkIcon,
  Unlink,
  FileCode,
} from 'lucide-react';
import { uploadBlogImage } from '@/actions/blog-actions';
import { toast } from 'sonner';

interface BlogEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export default function BlogEditor({ content, onChange }: BlogEditorProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [htmlDialogOpen, setHtmlDialogOpen] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const [isEditingHtml, setIsEditingHtml] = useState(false);
  const [htmlSelectionRange, setHtmlSelectionRange] = useState<{
    from: number;
    to: number;
  } | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none min-h-[400px] p-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-4 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-3 [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-2 [&_ul_ul]:list-disc [&_ul_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-2 [&_ol_ol]:list-decimal [&_ol_ol]:ml-6 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4 [&_blockquote]:text-gray-700 [&_section]:my-4 [&_section_ul]:list-disc [&_section_ul]:ml-6 [&_section_ul]:my-2 [&_.html-content-wrapper_ul]:list-disc [&_.html-content-wrapper_ul]:ml-6 [&_.html-content-wrapper_ul]:my-2 [&_.html-content-wrapper_ol]:list-decimal [&_.html-content-wrapper_ol]:ml-6 [&_.html-content-wrapper_ol]:my-2',
      },
    },
    editable: true,
  });

  if (!editor) {
    return null;
  }

  async function handleImageUpload() {
    if (!editor) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !editor) return;

      const formData = new FormData();
      formData.append('image', file);

      toast.loading('Uploading image...');

      const result = await uploadBlogImage(formData);

      toast.dismiss();

      if (result.success && result.url) {
        editor.chain().focus().setImage({ src: result.url }).run();
        toast.success('Image uploaded successfully');
      } else {
        toast.error(result.error || 'Failed to upload image');
      }
    };

    input.click();
  }

  function handleOpenLinkDialog() {
    if (!editor) return;

    // Check if there's already a link selected
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);
    const existingLink = editor.getAttributes('link');

    if (existingLink.href) {
      // Editing existing link
      setLinkUrl(existingLink.href);
      setLinkText(selectedText || '');
    } else if (selectedText) {
      // Text is selected, use it as link text
      setLinkText(selectedText);
      setLinkUrl('');
    } else {
      // No selection, clear fields
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

    // Ensure URL has protocol
    let finalUrl = linkUrl.trim();
    if (!finalUrl.match(/^https?:\/\//)) {
      finalUrl = `https://${finalUrl}`;
    }

    const existingLink = editor.getAttributes('link');
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);

    if (existingLink.href) {
      // Editing existing link - update it
      if (linkText.trim() && linkText.trim() !== selectedText) {
        // Replace link text if different
        editor
          .chain()
          .focus()
          .extendMarkRange('link')
          .insertContent(`<a href="${finalUrl}">${linkText.trim()}</a>`)
          .run();
      } else {
        // Just update the URL
        editor
          .chain()
          .focus()
          .extendMarkRange('link')
          .setLink({ href: finalUrl })
          .run();
      }
    } else if (linkText.trim()) {
      // Insert link with custom text
      if (selectedText) {
        // Replace selected text with link
        editor
          .chain()
          .focus()
          .deleteSelection()
          .insertContent(`<a href="${finalUrl}">${linkText.trim()}</a>`)
          .run();
      } else {
        // Insert new link at cursor
        editor
          .chain()
          .focus()
          .insertContent(`<a href="${finalUrl}">${linkText.trim()}</a>`)
          .run();
      }
    } else {
      // No custom text provided
      if (selectedText) {
        // Apply link to selected text
        editor.chain().focus().setLink({ href: finalUrl }).run();
      } else {
        // Insert URL as clickable text
        editor
          .chain()
          .focus()
          .insertContent(`<a href="${finalUrl}">${finalUrl}</a>`)
          .run();
      }
    }

    setLinkDialogOpen(false);
    setLinkUrl('');
    setLinkText('');
    toast.success(
      existingLink.href
        ? 'Link updated successfully'
        : 'Link added successfully'
    );
  }

  function handleRemoveLink() {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
    setLinkDialogOpen(false);
    toast.success('Link removed');
  }

  function handleOpenHtmlDialog() {
    if (!editor) return;

    const { from, to } = editor.state.selection;

    // Always show the full HTML content for editing
    // This is simpler and more reliable than trying to extract just the selection
    const fullHtml = editor.getHTML();
    setHtmlContent(fullHtml);
    setIsEditingHtml(true);

    // Store selection range if there was one (for potential future use)
    if (from !== to) {
      setHtmlSelectionRange({ from, to });
    } else {
      setHtmlSelectionRange(null);
    }

    setHtmlDialogOpen(true);
  }

  function handleInsertHtml() {
    if (!editor) return;

    if (!htmlContent.trim()) {
      toast.error('Please enter HTML content');
      return;
    }

    try {
      const trimmedHtml = htmlContent.trim();

      if (isEditingHtml) {
        // Replace entire editor content when editing
        editor.commands.setContent(trimmedHtml);
      } else {
        // New insertion - check if we're in a list context
        const isInList =
          editor.isActive('bulletList') ||
          editor.isActive('orderedList') ||
          editor.isActive('listItem');

        // If we're in a list, exit it first to avoid creating nested lists
        if (isInList) {
          // Exit the list by creating a paragraph break
          editor.chain().focus().insertContent('<p></p>').run();
          // Wait a tick for the DOM to update
          setTimeout(() => {
            editor.chain().focus().run();
          }, 0);
        }

        // Check if HTML contains lists - if so, wrap in a div to prevent TipTap from nesting
        const hasLists = /<ul|<ol/.test(trimmedHtml);
        const htmlToInsert = hasLists
          ? `<div class="html-content-wrapper">${trimmedHtml}</div>`
          : trimmedHtml;

        // Insert the HTML content
        // TipTap will parse it according to its schema
        editor.chain().focus().insertContent(htmlToInsert).run();
      }

      setHtmlDialogOpen(false);
      setHtmlContent('');
      setIsEditingHtml(false);
      setHtmlSelectionRange(null);
      toast.success(
        isEditingHtml
          ? 'HTML content updated successfully'
          : 'HTML content inserted successfully'
      );
    } catch (error) {
      toast.error('Failed to insert HTML content');
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      {/* Toolbar */}
      <div className="bg-muted/50 flex flex-wrap gap-1 border-b p-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editor.chain().focus().toggleBold().run();
          }}
          className={editor.isActive('bold') ? 'bg-muted' : ''}
        >
          <Bold className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editor.chain().focus().toggleItalic().run();
          }}
          className={editor.isActive('italic') ? 'bg-muted' : ''}
        >
          <Italic className="h-4 w-4" />
        </Button>

        <div className="bg-border mx-1 h-6 w-px" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (editor.isActive('heading', { level: 2 })) {
              editor.chain().focus().setParagraph().run();
            } else {
              editor.chain().focus().setHeading({ level: 2 }).run();
            }
          }}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (editor.isActive('heading', { level: 3 })) {
              editor.chain().focus().setParagraph().run();
            } else {
              editor.chain().focus().setHeading({ level: 3 }).run();
            }
          }}
          className={editor.isActive('heading', { level: 3 }) ? 'bg-muted' : ''}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="bg-border mx-1 h-6 w-px" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editor.chain().focus().toggleBulletList().run();
          }}
          className={editor.isActive('bulletList') ? 'bg-muted' : ''}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editor.chain().focus().toggleOrderedList().run();
          }}
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
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editor.chain().focus().toggleBlockquote().run();
          }}
          className={editor.isActive('blockquote') ? 'bg-muted' : ''}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleOpenHtmlDialog();
          }}
          title="Insert/Edit HTML"
        >
          <FileCode className="h-4 w-4" />
        </Button>

        <div className="bg-border mx-1 h-6 w-px" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleImageUpload}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleOpenLinkDialog}
          className={editor.isActive('link') ? 'bg-muted' : ''}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>

        {editor.isActive('link') && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemoveLink}
            title="Remove link"
          >
            <Unlink className="h-4 w-4" />
          </Button>
        )}

        <div className="bg-border mx-1 h-6 w-px" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />

      {/* Link Dialog */}
      <Dialog
        open={linkDialogOpen}
        onOpenChange={(open) => {
          setLinkDialogOpen(open);
          if (!open) {
            // Reset form when dialog closes
            setLinkUrl('');
            setLinkText('');
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editor.isActive('link') ? 'Edit Link' : 'Add Link'}
            </DialogTitle>
            <DialogDescription>
              {editor.isActive('link')
                ? "Update the URL or link text. Click 'Remove Link' to remove the link entirely."
                : 'Enter the URL and optional link text. If no text is provided, the URL will be used as the link text.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-url">
                URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="link-url"
                type="url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddLink();
                  }
                }}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-text">Link Text (optional)</Label>
              <Input
                id="link-text"
                placeholder="Click here"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddLink();
                  }
                }}
              />
              <p className="text-muted-foreground text-xs">
                Leave empty to use the URL as link text
              </p>
            </div>
          </div>
          <DialogFooter>
            {editor.isActive('link') && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleRemoveLink}
              >
                Remove Link
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setLinkDialogOpen(false);
                setLinkUrl('');
                setLinkText('');
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleAddLink}>
              {editor.isActive('link') ? 'Update Link' : 'Add Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HTML Insert/Edit Dialog */}
      <Dialog
        open={htmlDialogOpen}
        onOpenChange={(open) => {
          setHtmlDialogOpen(open);
          if (!open) {
            setHtmlContent('');
            setIsEditingHtml(false);
            setHtmlSelectionRange(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {isEditingHtml ? 'Edit HTML Content' : 'Insert HTML Content'}
            </DialogTitle>
            <DialogDescription>
              {isEditingHtml
                ? htmlSelectionRange
                  ? 'Edit the selected HTML content below. Changes will replace the selection.'
                  : 'Edit the entire editor HTML content below. Changes will replace all content.'
                : 'Paste your HTML code below. It will be inserted at the current cursor position in the editor.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="html-content">
                HTML Content <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="html-content"
                placeholder="<section><h2>Title</h2><p>Content</p></section>"
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
                autoFocus
              />
              <p className="text-muted-foreground text-xs">
                {isEditingHtml
                  ? 'Edit the HTML content. The changes will be applied when you save.'
                  : 'Enter valid HTML. The content will be rendered in the editor.'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setHtmlDialogOpen(false);
                setHtmlContent('');
                setIsEditingHtml(false);
                setHtmlSelectionRange(null);
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleInsertHtml}>
              {isEditingHtml ? 'Update HTML' : 'Insert HTML'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
