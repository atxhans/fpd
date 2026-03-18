'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { MessageSquare, Lock } from 'lucide-react'
import { formatRelativeTime, cn } from '@/lib/utils'
import { addSupportComment, updateSupportCaseStatus } from '@/lib/actions/support-actions'

type CaseStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

interface Comment {
  id: string
  body: string
  is_internal: boolean
  created_at: string
  author: { first_name: string | null; last_name: string | null; email: string } | null
}

interface CaseDetailClientProps {
  caseId: string
  currentStatus: CaseStatus
  comments: Comment[]
}

const STATUS_TRANSITIONS: Record<CaseStatus, { label: string; next: CaseStatus }[]> = {
  open:        [{ label: 'Mark In Progress', next: 'in_progress' }, { label: 'Close', next: 'closed' }],
  in_progress: [{ label: 'Mark Resolved',    next: 'resolved'    }, { label: 'Close', next: 'closed' }],
  resolved:    [{ label: 'Reopen',            next: 'open'        }, { label: 'Close', next: 'closed' }],
  closed:      [{ label: 'Reopen',            next: 'open'        }],
}

const STATUS_COLORS: Record<CaseStatus, string> = {
  open:        'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved:    'bg-green-100 text-green-800',
  closed:      'bg-gray-100 text-gray-600',
}

export function CaseDetailClient({ caseId, currentStatus, comments }: CaseDetailClientProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [body, setBody] = useState('')
  const [isInternal, setIsInternal] = useState(false)

  function handleStatusChange(next: CaseStatus) {
    startTransition(async () => {
      const result = await updateSupportCaseStatus(caseId, next)
      if (result.error) { toast.error(result.error); return }
      toast.success('Status updated')
      router.refresh()
    })
  }

  function handleComment() {
    if (!body.trim()) { toast.error('Enter a comment'); return }
    startTransition(async () => {
      const result = await addSupportComment({ caseId, body, isInternal })
      if (result.error) { toast.error(result.error); return }
      setBody('')
      toast.success(isInternal ? 'Internal note added' : 'Comment added')
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* Status controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize', STATUS_COLORS[currentStatus])}>
          {currentStatus.replace('_', ' ')}
        </span>
        {STATUS_TRANSITIONS[currentStatus].map(({ label, next }) => (
          <Button
            key={next}
            size="sm"
            variant={next === 'closed' ? 'outline' : 'default'}
            disabled={pending}
            onClick={() => handleStatusChange(next)}
            className={next !== 'closed' ? 'bg-black text-primary hover:bg-black/90' : ''}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Comments thread */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Comments {comments.length > 0 && `(${comments.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          )}
          {comments.map(c => {
            const name = c.author
              ? [c.author.first_name, c.author.last_name].filter(Boolean).join(' ') || c.author.email
              : 'Unknown'
            return (
              <div
                key={c.id}
                className={cn(
                  'rounded-lg p-4 text-sm',
                  c.is_internal ? 'bg-yellow-50 border border-yellow-200' : 'bg-muted/40 border border-border'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold">{name}</span>
                  {c.is_internal && (
                    <Badge variant="outline" className="text-[10px] text-yellow-700 border-yellow-400 flex items-center gap-1">
                      <Lock className="h-2.5 w-2.5" /> Internal
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">{formatRelativeTime(c.created_at)}</span>
                </div>
                <p className="whitespace-pre-wrap">{c.body}</p>
              </div>
            )
          })}

          {/* Add comment */}
          {currentStatus !== 'closed' && (
            <div className="space-y-3 pt-2 border-t border-border">
              <textarea
                rows={3}
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Add a comment…"
                className={cn(
                  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none',
                  'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                )}
              />
              <div className="flex items-center gap-3">
                {/* Internal toggle */}
                <button
                  type="button"
                  onClick={() => setIsInternal(!isInternal)}
                  className={cn(
                    'flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border transition-colors',
                    isInternal
                      ? 'bg-yellow-50 border-yellow-300 text-yellow-800'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  )}
                >
                  <Lock className="h-3 w-3" />
                  Internal note
                </button>
                <Button size="sm" disabled={pending || !body.trim()} onClick={handleComment} className="ml-auto">
                  {pending ? 'Saving…' : 'Add comment'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
