'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Copy, Pencil, Check, Link2, Mail } from 'lucide-react'
import { updateTenantSlug } from '@/lib/actions/tenant-actions'

interface Props {
  tenantId: string
  slug: string
  appUrl: string
  canEdit: boolean
}

export function ServiceRequestLinks({ tenantId, slug: initialSlug, appUrl, canEdit }: Props) {
  const router = useRouter()
  const [slug, setSlug] = useState(initialSlug)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(initialSlug)
  const [saving, setSaving] = useState(false)

  const formUrl   = `${appUrl}/request-service/${slug}`
  const emailAddr = `${slug}@inbound.${new URL(appUrl).hostname.replace(/^www\./, '')}`

  async function copyToClipboard(text: string, label: string) {
    await navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  async function saveSlug() {
    setSaving(true)
    const result = await updateTenantSlug(tenantId, draft.trim().toLowerCase())
    setSaving(false)
    if (result.error) { toast.error(result.error); return }
    setSlug(draft.trim().toLowerCase())
    setEditing(false)
    toast.success('Slug updated')
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Request Links</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Slug */}
        <div className="space-y-2">
          <Label>Company Slug</Label>
          {editing ? (
            <div className="flex gap-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="your-company"
                className="font-mono"
                autoFocus
              />
              <Button size="sm" onClick={saveSlug} disabled={saving || !draft.trim()}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setEditing(false); setDraft(slug) }}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md bg-muted px-3 py-2 text-sm font-mono">{slug}</code>
              {canEdit && (
                <Button size="icon-sm" variant="ghost" onClick={() => setEditing(true)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}
          {editing && (
            <p className="text-xs text-muted-foreground">
              Changing the slug will break any existing form links or inbound email addresses you've shared.
            </p>
          )}
        </div>

        {/* Form URL */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5" /> Service Request Form URL
          </Label>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-md bg-muted px-3 py-2 text-xs font-mono truncate">{formUrl}</code>
            <Button size="icon-sm" variant="ghost" onClick={() => copyToClipboard(formUrl, 'Form URL')}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Share this link with customers so service requests are attributed to your company.</p>
        </div>

        {/* Inbound email */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" /> Inbound Email Address
          </Label>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-md bg-muted px-3 py-2 text-xs font-mono truncate">{emailAddr}</code>
            <Button size="icon-sm" variant="ghost" onClick={() => copyToClipboard(emailAddr, 'Email address')}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Customers who email this address will have a service request created automatically and attributed to your company.</p>
        </div>

      </CardContent>
    </Card>
  )
}
