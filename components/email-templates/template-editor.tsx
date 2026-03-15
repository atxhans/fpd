'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { TextStyle, Color } from '@tiptap/extension-text-style'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { saveEmailTemplate } from '@/lib/actions/email-template-actions'
import type { TemplateDefinition } from '@/lib/email/template-defaults'
import {
  Bold, Italic, List, ListOrdered, Link2, Undo2, Redo2,
  Palette, Heading2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TemplateEditorProps {
  tenantId: string
  def: TemplateDefinition
  initialSubject: string
  initialHtml: string
}

export function TemplateEditor({ tenantId, def, initialSubject, initialHtml }: TemplateEditorProps) {
  const [subject, setSubject] = useState(initialSubject)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Write your email content here…' }),
    ],
    content: initialHtml,
  })

  function insertVariable(name: string) {
    editor?.chain().focus().insertContent(`{{${name}}}`).run()
  }

  function handleSave() {
    if (!editor) return
    const html = editor.getHTML()
    startTransition(async () => {
      const result = await saveEmailTemplate(tenantId, def.key, subject, html)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Template saved')
      }
    })
  }

  function handlePreview() {
    if (!editor) return
    setPreviewHtml(prev => prev === null ? editor.getHTML() : null)
  }

  if (!editor) return null

  return (
    <div className="space-y-6">
      {/* Subject */}
      <div className="space-y-2">
        <Label htmlFor="subject">Subject line</Label>
        <Input
          id="subject"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="Email subject…"
          className="max-w-xl"
        />
      </div>

      {/* Variables */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Click a variable to insert it at your cursor position:
        </p>
        <div className="flex flex-wrap gap-2">
          {def.variables.map(v => (
            <button
              key={v.name}
              type="button"
              onClick={() => insertVariable(v.name)}
              title={v.description}
              className="inline-flex items-center px-2 py-1 rounded bg-muted text-xs font-mono hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {`{{${v.name}}}`}
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="space-y-1">
        <Label>Email body</Label>
        <div className="border border-border rounded-lg overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-0.5 p-2 border-b border-border bg-muted/30 flex-wrap">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive('bold')}
              title="Bold"
            ><Bold className="h-4 w-4" /></ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive('italic')}
              title="Italic"
            ><Italic className="h-4 w-4" /></ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              active={editor.isActive('heading', { level: 2 })}
              title="Heading"
            ><Heading2 className="h-4 w-4" /></ToolbarButton>

            <div className="w-px h-5 bg-border mx-1" />

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive('bulletList')}
              title="Bullet list"
            ><List className="h-4 w-4" /></ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive('orderedList')}
              title="Numbered list"
            ><ListOrdered className="h-4 w-4" /></ToolbarButton>

            <div className="w-px h-5 bg-border mx-1" />

            <ToolbarButton
              onClick={() => {
                const url = window.prompt('URL')
                if (url) editor.chain().focus().setLink({ href: url }).run()
              }}
              active={editor.isActive('link')}
              title="Insert link"
            ><Link2 className="h-4 w-4" /></ToolbarButton>

            <div className="relative" title="Text color">
              <label className="cursor-pointer">
                <ToolbarButton onClick={() => {}} active={false} title="Text color">
                  <Palette className="h-4 w-4" />
                </ToolbarButton>
                <input
                  type="color"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  onInput={e => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
                />
              </label>
            </div>

            <div className="w-px h-5 bg-border mx-1" />

            <ToolbarButton onClick={() => editor.chain().focus().undo().run()} active={false} title="Undo">
              <Undo2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().redo().run()} active={false} title="Redo">
              <Redo2 className="h-4 w-4" />
            </ToolbarButton>
          </div>

          {/* Content area */}
          <EditorContent
            editor={editor}
            className="prose prose-sm max-w-none min-h-[300px] p-4 focus-within:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[280px]"
          />
        </div>
      </div>

      {/* Preview */}
      {previewHtml != null && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Preview</p>
          <div
            className="border border-border rounded-lg p-4 bg-white"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? 'Saving…' : 'Save template'}
        </Button>
        <Button variant="outline" type="button" onClick={handlePreview}>
          {previewHtml != null ? 'Hide preview' : 'Preview'}
        </Button>
      </div>
    </div>
  )
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void
  active: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'p-1.5 rounded transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
    </button>
  )
}
