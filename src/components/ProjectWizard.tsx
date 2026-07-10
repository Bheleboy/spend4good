import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { useNavigate } from '@tanstack/react-router'
import { Check, ChevronLeft, ChevronRight, GripVertical, Plus, Trash2, X, Copy, PartyPopper } from 'lucide-react'

const SA_PROVINCES = [
  'Eastern Cape','Free State','Gauteng','KwaZulu-Natal','Limpopo',
  'Mpumalanga','Northern Cape','North West','Western Cape',
]
const SUGGESTED_ACTIVITIES = [
  'Water Installation','Sanitation','Training','Monitoring',
  'Community Engagement','Construction','Repairs','Distribution',
]
const WHATSAPP_BUSINESS_NUMBER = '+16626414965'

type Role = 'field_agent' | 'project_manager' | 'accountant' | 'viewer'

type Member =
  | { kind: 'existing'; user_id: string; full_name: string; whatsapp_number: string | null; role: Role }
  | { kind: 'new'; full_name: string; whatsapp_number: string; role: Role }

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated?: () => void
}

const STEPS = ['Details', 'Activities', 'Team', 'Review', 'Done'] as const

export function ProjectWizard({ open, onOpenChange, onCreated }: Props) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  // step 1
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [funderId, setFunderId] = useState<string>('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [budget, setBudget] = useState('')
  const [province, setProvince] = useState('')
  const [locationDesc, setLocationDesc] = useState('')

  // step 2
  const [activities, setActivities] = useState<string[]>([])
  const [activityInput, setActivityInput] = useState('')

  // step 3
  const [orgUsers, setOrgUsers] = useState<any[]>([])
  const [funders, setFunders] = useState<any[]>([])
  const [selectedExistingId, setSelectedExistingId] = useState('')
  const [selectedExistingRole, setSelectedExistingRole] = useState<Role>('field_agent')
  const [newName, setNewName] = useState('')
  const [newWhatsapp, setNewWhatsapp] = useState('')
  const [members, setMembers] = useState<Member[]>([])

  // step 5
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null)
  const [invitedAgents, setInvitedAgents] = useState<{ name: string; whatsapp: string }[]>([])

  useEffect(() => {
    if (!open || !user?.org_id) return
    ;(async () => {
      const [u, f] = await Promise.all([
        supabase.from('users').select('id, full_name, email, whatsapp_number, phone_number')
          .eq('org_id', user.org_id).eq('is_active', true),
        supabase.from('funder_nonprofits')
          .select('funder_id, status, funder:organizations!funder_nonprofits_funder_id_fkey(id, name)')
          .eq('nonprofit_id', user.org_id).eq('status', 'accepted'),
      ])
      setOrgUsers(u.data ?? [])
      setFunders((f.data ?? []).filter((x: any) => x.funder))
    })()
  }, [open, user?.org_id])

  const reset = () => {
    setStep(0); setName(''); setDescription(''); setFunderId(''); setStartDate('')
    setEndDate(''); setBudget(''); setProvince(''); setLocationDesc('')
    setActivities([]); setActivityInput('')
    setSelectedExistingId(''); setSelectedExistingRole('field_agent')
    setNewName(''); setNewWhatsapp(''); setMembers([])
    setCreatedProjectId(null); setInvitedAgents([])
  }

  const handleClose = (v: boolean) => {
    if (!v && step === 4) { reset(); onCreated?.() }
    if (!v && step !== 4) reset()
    onOpenChange(v)
  }

  const addActivity = (raw: string) => {
    const v = raw.trim()
    if (!v) return
    if (activities.includes(v)) return
    setActivities((a) => [...a, v])
    setActivityInput('')
  }

  const removeActivity = (i: number) => setActivities((a) => a.filter((_, idx) => idx !== i))

  const moveActivity = (from: number, to: number) => {
    if (to < 0 || to >= activities.length) return
    setActivities((a) => {
      const copy = a.slice()
      const [it] = copy.splice(from, 1)
      copy.splice(to, 0, it)
      return copy
    })
  }

  const addExistingMember = () => {
    if (!selectedExistingId) return
    const u = orgUsers.find((x) => x.id === selectedExistingId)
    if (!u) return
    if (members.some((m) => m.kind === 'existing' && m.user_id === u.id)) {
      toast.error('Already added'); return
    }
    setMembers((ms) => [...ms, {
      kind: 'existing', user_id: u.id, full_name: u.full_name,
      whatsapp_number: u.whatsapp_number ?? u.phone_number ?? null,
      role: selectedExistingRole,
    }])
    setSelectedExistingId('')
  }

  const addNewMember = () => {
    if (!newName.trim() || !newWhatsapp.trim()) { toast.error('Name and WhatsApp required'); return }
    if (!/^\+\d{7,}$/.test(newWhatsapp.trim())) { toast.error('WhatsApp must be E.164 like +27...'); return }
    setMembers((ms) => [...ms, { kind: 'new', full_name: newName.trim(), whatsapp_number: newWhatsapp.trim(), role: 'field_agent' }])
    setNewName(''); setNewWhatsapp('')
  }

  const removeMember = (i: number) => setMembers((ms) => ms.filter((_, idx) => idx !== i))

  const canNext = useMemo(() => {
    if (step === 0) return !!name.trim()
    if (step === 1) return activities.length > 0
    return true
  }, [step, name, activities])

  const funderName = funders.find((f) => f.funder_id === funderId)?.funder?.name

  const submit = async () => {
    if (!user?.org_id) return
    setSubmitting(true)
    try {
      const budgetNum = Number(budget) || 0
      const { data: proj, error: pErr } = await supabase.from('projects').insert({
        org_id: user.org_id,
        funder_id: funderId || null,
        name: name.trim(),
        description: description.trim() || null,
        budget: budgetNum,
        budget_amount: budgetNum,
        currency: 'ZAR',
        start_date: startDate || null,
        end_date: endDate || null,
        province: province || null,
        location_description: locationDesc.trim() || null,
        activity_categories: activities,
        status: 'active',
      }).select('id').single()
      if (pErr || !proj) throw new Error(pErr?.message ?? 'Failed to create project')

      const newAgentsInvited: { name: string; whatsapp: string }[] = []

      for (const m of members) {
        if (m.kind === 'existing') {
          await supabase.from('project_members').insert({
            project_id: proj.id, user_id: m.user_id, org_id: user.org_id, role: m.role,
          })
        } else {
          const email = `wa-${m.whatsapp_number.replace(/\D/g, '')}@spend4good.local`
          const { data: existing } = await supabase.from('users').select('id')
            .eq('org_id', user.org_id).eq('whatsapp_number', m.whatsapp_number).maybeSingle()
          let userId = existing?.id as string | undefined
          if (!userId) {
            const { data: newU, error: uErr } = await supabase.from('users').insert({
              org_id: user.org_id,
              full_name: m.full_name,
              email,
              whatsapp_number: m.whatsapp_number,
              role: 'field_agent',
              is_active: true,
            }).select('id').single()
            if (uErr || !newU) { toast.error(`Could not create ${m.full_name}: ${uErr?.message}`); continue }
            userId = newU.id
          }
          await supabase.from('project_members').insert({
            project_id: proj.id, user_id: userId, org_id: user.org_id, role: 'field_agent',
          })
          try {
            await supabase.functions.invoke('send-project-invite', {
              body: {
                to_number: m.whatsapp_number,
                agent_name: m.full_name,
                project_name: name.trim(),
                org_name: user.organization?.name ?? 'your organisation',
                manager_name: user.full_name,
              },
            })
          } catch (e) { console.error('invite send failed', e) }
          newAgentsInvited.push({ name: m.full_name, whatsapp: m.whatsapp_number })
        }
      }

      setCreatedProjectId(proj.id)
      setInvitedAgents(newAgentsInvited)
      setStep(4)
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to create project')
    } finally {
      setSubmitting(false)
    }
  }

  const shareMessage = `Hi team, you have been added to ${name} on Spend4Good. To submit photos and expenses, save this number: ${WHATSAPP_BUSINESS_NUMBER} and send a message or photo. No app needed.`

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0 gap-0">
        {/* Stepper */}
        <div className="border-b px-6 py-4">
          <div className="flex items-center gap-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                  i < step ? 'bg-success text-success-foreground' :
                  i === step ? 'bg-primary text-primary-foreground' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`text-sm ${i === step ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{label}</span>
                {i < STEPS.length - 1 && <div className={`h-px flex-1 ${i < step ? 'bg-success' : 'bg-border'}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-4">
          {step === 0 && (
            <>
              <h2 className="text-xl font-bold">Project details</h2>
              <div className="space-y-3">
                <Field label="Project name *"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
                <Field label="Description">
                  <textarea rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={description} onChange={(e) => setDescription(e.target.value)} />
                </Field>
                <Field label="Funder">
                  <Select value={funderId || 'none'} onValueChange={(v) => setFunderId(v === 'none' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {funders.map((f) => <SelectItem key={f.funder_id} value={f.funder_id}>{f.funder.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Start date"><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
                  <Field label="End date"><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></Field>
                </div>
                <Field label="Budget (ZAR)"><Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Province">
                    <Select value={province} onValueChange={setProvince}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {SA_PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Location description"><Input value={locationDesc} onChange={(e) => setLocationDesc(e.target.value)} placeholder="Lusikisiki, OR Tambo District" /></Field>
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div>
                <h2 className="text-xl font-bold">What activities will happen on this project?</h2>
                <p className="text-sm text-muted-foreground mt-1">Field agents choose from these when submitting photos via WhatsApp.</p>
              </div>
              <div className="flex gap-2">
                <Input value={activityInput} onChange={(e) => setActivityInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addActivity(activityInput) } }}
                  placeholder="Type an activity and press Enter" />
                <Button type="button" variant="outline" onClick={() => addActivity(activityInput)}><Plus className="h-4 w-4" /></Button>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground mb-2">Suggested</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_ACTIVITIES.filter((s) => !activities.includes(s)).map((s) => (
                    <button key={s} type="button" onClick={() => addActivity(s)}
                      className="rounded-full border border-dashed border-border px-3 py-1 text-xs hover:border-primary hover:text-primary">
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground mb-2">Selected ({activities.length})</p>
                {activities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Add at least one activity to continue.</p>
                ) : (
                  <ul className="space-y-1">
                    {activities.map((a, i) => (
                      <li key={a} className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        <span className="flex-1 text-sm">{a}</span>
                        <Button variant="ghost" size="sm" onClick={() => moveActivity(i, i - 1)} disabled={i === 0}>↑</Button>
                        <Button variant="ghost" size="sm" onClick={() => moveActivity(i, i + 1)} disabled={i === activities.length - 1}>↓</Button>
                        <Button variant="ghost" size="sm" onClick={() => removeActivity(i)}><X className="h-4 w-4" /></Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-bold">Add team members</h2>

              <section className="rounded-md border border-border p-4 space-y-3">
                <h3 className="font-semibold text-sm">From your organisation</h3>
                <div className="grid grid-cols-[1fr_180px_auto] gap-2">
                  <Select value={selectedExistingId} onValueChange={setSelectedExistingId}>
                    <SelectTrigger><SelectValue placeholder="Select active user" /></SelectTrigger>
                    <SelectContent>
                      {orgUsers.filter((u) => !members.some((m) => m.kind === 'existing' && m.user_id === u.id)).length === 0
                        ? <div className="px-2 py-1.5 text-sm text-muted-foreground">No more users</div>
                        : orgUsers.filter((u) => !members.some((m) => m.kind === 'existing' && m.user_id === u.id)).map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.full_name} — {u.email}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedExistingRole} onValueChange={(v) => setSelectedExistingRole(v as Role)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="field_agent">Field agent</SelectItem>
                      <SelectItem value="project_manager">Project manager</SelectItem>
                      <SelectItem value="accountant">Accountant</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={addExistingMember}>Add</Button>
                </div>
              </section>

              <section className="rounded-md border border-border p-4 space-y-3">
                <h3 className="font-semibold text-sm">Add new field agent</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Full name *"><Input value={newName} onChange={(e) => setNewName(e.target.value)} /></Field>
                  <Field label="WhatsApp number *"><Input value={newWhatsapp} onChange={(e) => setNewWhatsapp(e.target.value)} placeholder="+27..." /></Field>
                </div>
                <p className="text-xs text-muted-foreground">This person will receive a WhatsApp invitation when the project launches.</p>
                <Button type="button" variant="secondary" onClick={addNewMember}><Plus className="mr-1 h-4 w-4" /> Add field agent</Button>
              </section>

              {members.length > 0 && (
                <section>
                  <h3 className="font-semibold text-sm mb-2">Team ({members.length})</h3>
                  <ul className="space-y-1">
                    {members.map((m, i) => (
                      <li key={i} className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
                        <div className="flex-1">
                          <div className="text-sm font-medium">{m.full_name}
                            {m.kind === 'new' && <Badge variant="outline" className="ml-2 text-[10px]">new</Badge>}
                          </div>
                          <div className="text-xs text-muted-foreground">{m.whatsapp_number ?? '—'}</div>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{m.role.replace('_', ' ')}</Badge>
                        <Button variant="ghost" size="sm" onClick={() => removeMember(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-xl font-bold">Review</h2>

              <ReviewSection title="Project details" onEdit={() => setStep(0)}>
                <ReviewRow k="Name" v={name} />
                {description && <ReviewRow k="Description" v={description} />}
                {funderName && <ReviewRow k="Funder" v={funderName} />}
                {(startDate || endDate) && <ReviewRow k="Dates" v={`${startDate || '—'} → ${endDate || '—'}`} />}
                <ReviewRow k="Budget" v={`ZAR ${(Number(budget) || 0).toLocaleString()}`} />
                {province && <ReviewRow k="Province" v={province} />}
                {locationDesc && <ReviewRow k="Location" v={locationDesc} />}
              </ReviewSection>

              <ReviewSection title={`Activities (${activities.length})`} onEdit={() => setStep(1)}>
                <div className="flex flex-wrap gap-1">
                  {activities.map((a) => <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>)}
                </div>
              </ReviewSection>

              <ReviewSection title={`Team (${members.length})`} onEdit={() => setStep(2)}>
                {members.length === 0 ? <p className="text-sm text-muted-foreground">No team members added.</p> : (
                  <ul className="space-y-1 text-sm">
                    {members.map((m, i) => (
                      <li key={i} className="flex justify-between">
                        <span>{m.full_name} {m.kind === 'new' && <span className="text-xs text-muted-foreground">(new)</span>}</span>
                        <span className="text-muted-foreground text-xs">{m.role.replace('_', ' ')} · {m.whatsapp_number ?? '—'}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </ReviewSection>
            </>
          )}

          {step === 4 && (
            <div className="space-y-5 text-center py-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
                <PartyPopper className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Project created</h2>
                <p className="text-sm text-muted-foreground mt-1">{name} is ready to go.</p>
              </div>

              {invitedAgents.length > 0 && (
                <div className="rounded-md border border-border p-4 text-left">
                  <p className="text-xs font-medium uppercase text-muted-foreground mb-2">WhatsApp invitations sent</p>
                  <ul className="space-y-1 text-sm">
                    {invitedAgents.map((a, i) => (
                      <li key={i} className="flex justify-between">
                        <span>{a.name}</span><span className="text-muted-foreground">{a.whatsapp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-md bg-muted/50 border border-border p-4 text-left text-sm text-muted-foreground">
                Team members will receive a WhatsApp message to <span className="text-foreground font-medium">{WHATSAPP_BUSINESS_NUMBER}</span>. Ask them to save this as <span className="text-foreground font-medium">Spend4Good</span>.
              </div>

              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button variant="outline" onClick={async () => {
                  await navigator.clipboard.writeText(shareMessage)
                  toast.success('Setup message copied')
                }}>
                  <Copy className="mr-1 h-4 w-4" /> Share setup message
                </Button>
                <Button onClick={() => {
                  handleClose(false)
                  if (createdProjectId) navigate({ to: '/projects/$id', params: { id: createdProjectId } })
                }}>Go to Project</Button>
              </div>
            </div>
          )}
        </div>

        {step !== 4 && (
          <div className="border-t px-6 py-4 flex justify-between">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            {step < 3 ? (
              <Button disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button disabled={submitting} onClick={submit}>
                {submitting ? 'Creating…' : 'Create Project & Invite Team'}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1 block text-xs font-medium">{label}</label>{children}</div>
}

function ReviewSection({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">{title}</h3>
        <Button variant="ghost" size="sm" onClick={onEdit}>Edit</Button>
      </div>
      {children}
    </div>
  )
}

function ReviewRow({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-4 text-sm"><span className="text-muted-foreground">{k}</span><span className="text-foreground text-right">{v}</span></div>
}
