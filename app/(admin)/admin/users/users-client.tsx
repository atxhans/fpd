'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { toast } from 'sonner'
import { Search, UserPlus, Pencil } from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'
import { getRoleLabel } from '@/types/user'
import { inviteUser, updateAdminUser } from '@/lib/actions/admin-user-actions'
import type { UserRole } from '@/types/user'

interface Tenant { id: string; name: string }
interface UserRow {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  is_platform_user: boolean
  platform_role: string | null
  is_active: boolean
  created_at: string
}

// ─── Invite Sheet ────────────────────────────────────────────────────────────

const inviteSchema = z.object({
  email: z.string().email('Enter a valid email'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  userType: z.enum(['platform', 'tenant']),
  platformRole: z.string().optional(),
  tenantId: z.string().optional(),
  tenantRole: z.string().optional(),
})
type InviteForm = z.infer<typeof inviteSchema>

const PLATFORM_ROLES: UserRole[] = ['platform_super_admin', 'platform_support_admin', 'platform_support_agent']
const TENANT_ROLES: UserRole[] = ['company_admin', 'dispatcher', 'technician']

function InviteSheet({ tenants, onClose }: { tenants: Tenant[]; onClose: () => void }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { userType: 'tenant' },
  })

  const userType = watch('userType')
  const [platformRoleLabel, setPlatformRoleLabel] = useState('')
  const [tenantLabel, setTenantLabel] = useState('')
  const [tenantRoleLabel, setTenantRoleLabel] = useState('')

  function onSubmit(data: InviteForm) {
    startTransition(async () => {
      const result = await inviteUser({
        email: data.email,
        firstName: data.firstName ?? '',
        lastName: data.lastName ?? '',
        isPlatformUser: data.userType === 'platform',
        platformRole: data.userType === 'platform' ? (data.platformRole ?? null) : null,
        tenantId: data.userType === 'tenant' ? (data.tenantId ?? null) : null,
        tenantRole: data.userType === 'tenant' ? (data.tenantRole ?? null) : null,
      })
      if (result.error) { toast.error(result.error); return }
      toast.success('Invite sent')
      router.refresh()
      onClose()
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
      <div className="space-y-1.5">
        <Label>Email *</Label>
        <Input type="email" placeholder="user@example.com" {...register('email')} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>First name</Label>
          <Input placeholder="Jane" {...register('firstName')} />
        </div>
        <div className="space-y-1.5">
          <Label>Last name</Label>
          <Input placeholder="Smith" {...register('lastName')} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>User type</Label>
        <div className="flex gap-2">
          {(['tenant', 'platform'] as const).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setValue('userType', type)}
              className={cn(
                'flex-1 py-2 text-sm rounded-md border transition-colors',
                userType === type ? 'bg-black text-primary border-black' : 'border-border hover:bg-muted'
              )}
            >
              {type === 'platform' ? 'Fieldpiece Staff' : 'HVAC Contractor'}
            </button>
          ))}
        </div>
      </div>

      {userType === 'platform' && (
        <div className="space-y-1.5">
          <Label>Platform role</Label>
          <Select onValueChange={(v) => {
            setValue('platformRole', String(v))
            setPlatformRoleLabel(getRoleLabel(String(v) as UserRole))
          }}>
            <SelectTrigger>
              {platformRoleLabel
                ? <span className="flex flex-1 text-left text-sm">{platformRoleLabel}</span>
                : <SelectValue placeholder="Select role…" />}
            </SelectTrigger>
            <SelectContent>
              {PLATFORM_ROLES.map(r => <SelectItem key={r} value={r}>{getRoleLabel(r)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {userType === 'tenant' && (
        <>
          <div className="space-y-1.5">
            <Label>HVAC Contractor</Label>
            <Select onValueChange={(v) => {
              setValue('tenantId', String(v))
              setTenantLabel(tenants.find(t => t.id === String(v))?.name ?? '')
            }}>
              <SelectTrigger>
                {tenantLabel
                  ? <span className="flex flex-1 text-left text-sm truncate">{tenantLabel}</span>
                  : <SelectValue placeholder="Select HVAC contractor…" />}
              </SelectTrigger>
              <SelectContent>
                {tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select onValueChange={(v) => {
              setValue('tenantRole', String(v))
              setTenantRoleLabel(getRoleLabel(String(v) as UserRole))
            }}>
              <SelectTrigger>
                {tenantRoleLabel
                  ? <span className="flex flex-1 text-left text-sm">{tenantRoleLabel}</span>
                  : <SelectValue placeholder="Select role…" />}
              </SelectTrigger>
              <SelectContent>
                {TENANT_ROLES.map(r => <SelectItem key={r} value={r}>{getRoleLabel(r)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Sending invite…' : 'Send invite'}
      </Button>
    </form>
  )
}

// ─── Edit Sheet ───────────────────────────────────────────────────────────────

const editSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean(),
  isPlatformUser: z.boolean(),
  platformRole: z.string().optional(),
})
type EditForm = z.infer<typeof editSchema>

function EditSheet({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const { register, handleSubmit, watch, setValue } = useForm<EditForm>({
    defaultValues: {
      firstName: user.first_name ?? '',
      lastName: user.last_name ?? '',
      phone: user.phone ?? '',
      isActive: user.is_active,
      isPlatformUser: user.is_platform_user,
      platformRole: user.platform_role ?? '',
    },
  })

  const isPlatformUser = watch('isPlatformUser')
  const isActive = watch('isActive')
  const [platformRoleLabel, setPlatformRoleLabel] = useState(
    user.platform_role ? getRoleLabel(user.platform_role as UserRole) : ''
  )

  function onSubmit(data: EditForm) {
    startTransition(async () => {
      const result = await updateAdminUser({
        userId: user.id,
        firstName: data.firstName ?? '',
        lastName: data.lastName ?? '',
        phone: data.phone ?? '',
        isActive: data.isActive,
        isPlatformUser: data.isPlatformUser,
        platformRole: data.isPlatformUser ? (data.platformRole ?? null) : null,
      })
      if (result.error) { toast.error(result.error); return }
      toast.success('User updated')
      router.refresh()
      onClose()
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>First name</Label>
          <Input {...register('firstName')} />
        </div>
        <div className="space-y-1.5">
          <Label>Last name</Label>
          <Input {...register('lastName')} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Phone</Label>
        <Input type="tel" {...register('phone')} />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <div>
          <p className="text-sm font-medium">Active</p>
          <p className="text-xs text-muted-foreground">Inactive users cannot log in</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isActive}
          onClick={() => setValue('isActive', !isActive)}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            isActive ? 'bg-black' : 'bg-muted'
          )}
        >
          <span className={cn('inline-block h-4 w-4 rounded-full bg-white transition-transform', isActive ? 'translate-x-6' : 'translate-x-1')} />
        </button>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <div>
          <p className="text-sm font-medium">Fieldpiece Staff</p>
          <p className="text-xs text-muted-foreground">Grants access to admin console</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isPlatformUser}
          onClick={() => setValue('isPlatformUser', !isPlatformUser)}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            isPlatformUser ? 'bg-black' : 'bg-muted'
          )}
        >
          <span className={cn('inline-block h-4 w-4 rounded-full bg-white transition-transform', isPlatformUser ? 'translate-x-6' : 'translate-x-1')} />
        </button>
      </div>

      {isPlatformUser && (
        <div className="space-y-1.5">
          <Label>Platform role</Label>
          <Select
            defaultValue={user.platform_role ?? ''}
            onValueChange={(v) => {
              setValue('platformRole', String(v))
              setPlatformRoleLabel(getRoleLabel(String(v) as UserRole))
            }}
          >
            <SelectTrigger>
              {platformRoleLabel
                ? <span className="flex flex-1 text-left text-sm">{platformRoleLabel}</span>
                : <SelectValue placeholder="Select role…" />}
            </SelectTrigger>
            <SelectContent>
              {PLATFORM_ROLES.map(r => <SelectItem key={r} value={r}>{getRoleLabel(r)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Email: <span className="font-medium">{user.email}</span> — to change email use Supabase Auth dashboard.
      </p>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface UsersClientProps {
  users: UserRow[]
  tenants: Tenant[]
}

export function UsersClient({ users, tenants }: UsersClientProps) {
  const [search, setSearch] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editUser, setEditUser] = useState<UserRow | null>(null)

  const filtered = users.filter(u => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    const name = [u.first_name, u.last_name].filter(Boolean).join(' ').toLowerCase()
    return name.includes(q) || u.email.toLowerCase().includes(q)
  })

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setInviteOpen(true)} className="shrink-0">
          <UserPlus className="h-4 w-4 mr-2" /> Invite user
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 font-semibold">User</th>
                  <th className="text-left px-4 py-3 font-semibold">Role</th>
                  <th className="text-left px-4 py-3 font-semibold">Type</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Joined</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      {search ? 'No users match your search.' : 'No users found.'}
                    </td>
                  </tr>
                )}
                {filtered.map(u => {
                  const name = [u.first_name, u.last_name].filter(Boolean).join(' ')
                  return (
                    <tr key={u.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="font-medium">{name || u.email}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {u.platform_role ? getRoleLabel(u.platform_role as UserRole) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={u.is_platform_user ? 'default' : 'outline'} className={u.is_platform_user ? 'bg-black text-primary' : ''}>
                          {u.is_platform_user ? 'Fieldpiece' : 'HVAC Contractor'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={u.is_active ? 'outline' : 'secondary'} className={u.is_active ? 'text-green-700 border-green-300' : ''}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(u.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => setEditUser(u)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Invite sheet */}
      <Sheet open={inviteOpen} onOpenChange={setInviteOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Invite user</SheetTitle>
          </SheetHeader>
          {inviteOpen && <InviteSheet tenants={tenants} onClose={() => setInviteOpen(false)} />}
        </SheetContent>
      </Sheet>

      {/* Edit sheet */}
      <Sheet open={!!editUser} onOpenChange={open => { if (!open) setEditUser(null) }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit user</SheetTitle>
          </SheetHeader>
          {editUser && <EditSheet user={editUser} onClose={() => setEditUser(null)} />}
        </SheetContent>
      </Sheet>
    </>
  )
}
