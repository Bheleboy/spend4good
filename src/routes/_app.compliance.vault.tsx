import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
import {
  FileText, Upload, FolderOpen, Download, Trash2, Loader2,
  ShieldCheck, FileSignature, ScrollText, Gavel, Award, Files, AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'

export const Route = createFileRoute('/_app/compliance/vault')({
  component: VaultPage,
})

type Category =
  | 'dsd_submission' | 'cipc_filing' | 'audit_report' | 'board_resolution'
  | 'policy' | 'certificate' | 'other'

type ComplianceDoc = {
  id: string
  org_id: string
  name: string
  category: Category
  file_path: string
  expiry_date: string | null
  status: 'current' | 'expiring_soon' | 'expired'
  uploaded_by: string | null
  created_at: string
}

const CATEGORIES: { id: Category | 'all'; label: string; icon: typeof FileText }[] = [
  { id: 'all', label: 'All documents', icon: Files },
  { id: 'dsd_submission', label: 'DSD submissions', icon: FileSignature },
  { id: 'cipc_filing', label: 'CIPC filings', icon: ScrollText },
  { id: 'audit_report', label: 'Audit reports', icon: ShieldCheck },
  { id: 'board_resolution', label: 'Board resolutions', icon: Gavel },
  { id: 'policy', label: 'Policies', icon: FileText },
  { id: 'certificate', label: 'Certificates', icon: Award },
  { id: 'other', label: 'Other', icon: FolderOpen },
]

function VaultPage() {
  const { user } = useAuth()
  const orgId = user?.org_id ?? null

  const [docs, setDocs] = useState<ComplianceDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCat, setActiveCat] = useState<Category | 'all'>('all')
  const [uploadOpen, setUploadOpen] = useState(false)

  useEffect(() => {
    if (!orgId) return
    void load()
  }, [orgId])

  async function load() {
    if (!orgId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('compliance_documents')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
    if (error) {
      toast.error(error.message)
    } else {
      setDocs((data ?? []).map(withComputedStatus) as ComplianceDoc[])
    }
    setLoading(false)
  }

  const filtered = useMemo(
    () => (activeCat === 'all' ? docs : docs.filter((d) => d.category === activeCat)),
    [docs, activeCat],
  )

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: docs.length }
    for (const d of docs) c[d.category] = (c[d.category] ?? 0) + 1
    return c
  }, [docs])

  const expiringCount = docs.filter((d) => d.status === 'expiring_soon').length
  const expiredCount = docs.filter((d) => d.status === 'expired').length

  if (!orgId) {
    return (
      <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        Sign in with an organisation account to access the Document Vault.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Document Vault</h1>
          <p className="text-sm text-muted-foreground">
            Organised, secure storage for every compliance document — with expiry tracking.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(expiringCount > 0 || expiredCount > 0) && (
            <div className="flex items-center gap-2 text-xs">
              {expiredCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" /> {expiredCount} expired
                </Badge>
              )}
              {expiringCount > 0 && (
                <Badge className="gap-1 bg-[oklch(0.75_0.16_75)] text-foreground hover:bg-[oklch(0.75_0.16_75)]">
                  <AlertTriangle className="h-3 w-3" /> {expiringCount} expiring soon
                </Badge>
              )}
            </div>
          )}
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" /> Upload document
              </Button>
            </DialogTrigger>
            <UploadDialog
              orgId={orgId}
              defaultCategory={activeCat === 'all' ? 'other' : (activeCat as Category)}
              onUploaded={async () => {
                setUploadOpen(false)
                await load()
              }}
            />
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr]">
        {/* Folder sidebar */}
        <Card className="h-fit p-2">
          <nav className="space-y-0.5">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              const active = activeCat === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCat(cat.id)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {cat.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{counts[cat.id] ?? 0}</span>
                </button>
              )
            })}
          </nav>
        </Card>

        {/* File grid */}
        <div>
          {loading ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading documents…
            </div>
          ) : filtered.length === 0 ? (
            <Card className="flex h-64 flex-col items-center justify-center gap-2 border-dashed text-center">
              <FolderOpen className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">No documents here yet</p>
              <p className="text-xs text-muted-foreground">
                Upload your first {activeCat === 'all' ? 'document' : prettyCategory(activeCat as Category)}.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((doc) => (
                <DocCard key={doc.id} doc={doc} onChanged={load} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DocCard({ doc, onChanged }: { doc: ComplianceDoc; onChanged: () => void }) {
  const [busy, setBusy] = useState<null | 'download' | 'delete'>(null)

  async function download() {
    setBusy('download')
    const { data, error } = await supabase.storage
      .from('compliance-docs')
      .createSignedUrl(doc.file_path, 60)
    setBusy(null)
    if (error || !data?.signedUrl) return toast.error(error?.message ?? 'Download failed')
    window.open(data.signedUrl, '_blank', 'noopener')
  }

  async function remove() {
    if (!confirm(`Delete "${doc.name}"? This cannot be undone.`)) return
    setBusy('delete')
    const { error: storageErr } = await supabase.storage
      .from('compliance-docs')
      .remove([doc.file_path])
    if (storageErr) {
      setBusy(null)
      return toast.error(storageErr.message)
    }
    const { error: dbErr } = await supabase
      .from('compliance_documents')
      .delete()
      .eq('id', doc.id)
    setBusy(null)
    if (dbErr) return toast.error(dbErr.message)
    toast.success('Document deleted')
    onChanged()
  }

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-3">
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground" title={doc.name}>
              {doc.name}
            </p>
            <p className="text-xs text-muted-foreground">{prettyCategory(doc.category)}</p>
          </div>
        </div>
        <StatusBadge status={doc.status} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div>
          <p className="text-[10px] uppercase tracking-wide">Uploaded</p>
          <p className="text-foreground">{formatDate(doc.created_at)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide">Expires</p>
          <p className="text-foreground">{doc.expiry_date ? formatDate(doc.expiry_date) : '—'}</p>
        </div>
      </div>

      <div className="mt-1 flex items-center justify-end gap-2 border-t pt-3">
        <Button size="sm" variant="outline" onClick={download} disabled={!!busy}>
          {busy === 'download' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button size="sm" variant="outline" onClick={remove} disabled={!!busy}>
          {busy === 'delete' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </Card>
  )
}

function UploadDialog({
  orgId,
  defaultCategory,
  onUploaded,
}: {
  orgId: string
  defaultCategory: Category
  onUploaded: () => void | Promise<void>
}) {
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<Category>(defaultCategory)
  const [expiry, setExpiry] = useState('')
  const [uploading, setUploading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return toast.error('Choose a file to upload')
    setUploading(true)

    const safeName = file.name.replace(/[^\w.\-]+/g, '_')
    const path = `${orgId}/${Date.now()}-${safeName}`

    const { error: upErr } = await supabase.storage
      .from('compliance-docs')
      .upload(path, file, { upsert: false, contentType: file.type || undefined })

    if (upErr) {
      setUploading(false)
      return toast.error(upErr.message)
    }

    const { error: dbErr } = await supabase.from('compliance_documents').insert({
      org_id: orgId,
      name: name.trim() || file.name,
      category,
      file_path: path,
      expiry_date: expiry || null,
      status: computeStatus(expiry || null),
      uploaded_by: user?.id ?? null,
    })

    setUploading(false)
    if (dbErr) {
      // best-effort cleanup
      await supabase.storage.from('compliance-docs').remove([path])
      return toast.error(dbErr.message)
    }

    toast.success('Document uploaded')
    setFile(null); setName(''); setExpiry('')
    await onUploaded()
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Upload compliance document</DialogTitle>
      </DialogHeader>
      <form className="space-y-4" onSubmit={submit}>
        <div className="space-y-1.5">
          <Label htmlFor="file">File</Label>
          <Input
            id="file"
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null
              setFile(f)
              if (f && !name) setName(f.name.replace(/\.[^.]+$/, ''))
            }}
          />
          <p className="text-xs text-muted-foreground">PDF, Word, Excel or image. Max 50 MB.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="name">Display name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 2024 DSD Narrative Report" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger id="category"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="expiry">Expiry date (optional)</Label>
            <Input id="expiry" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button type="submit" disabled={uploading || !file}>
            {uploading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading…</>
            ) : (
              <><Upload className="mr-2 h-4 w-4" /> Upload</>
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

function StatusBadge({ status }: { status: ComplianceDoc['status'] }) {
  if (status === 'expired')
    return <Badge variant="destructive" className="text-[10px]">Expired</Badge>
  if (status === 'expiring_soon')
    return (
      <Badge className="bg-[oklch(0.75_0.16_75)] text-foreground text-[10px] hover:bg-[oklch(0.75_0.16_75)]">
        Expiring soon
      </Badge>
    )
  return (
    <Badge className="bg-primary/10 text-primary text-[10px] hover:bg-primary/10">
      Current
    </Badge>
  )
}

function computeStatus(expiry: string | null): ComplianceDoc['status'] {
  if (!expiry) return 'current'
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const exp = new Date(expiry); exp.setHours(0, 0, 0, 0)
  const diffDays = Math.round((exp.getTime() - today.getTime()) / 86_400_000)
  if (diffDays < 0) return 'expired'
  if (diffDays <= 30) return 'expiring_soon'
  return 'current'
}

function withComputedStatus(d: ComplianceDoc): ComplianceDoc {
  return { ...d, status: computeStatus(d.expiry_date) }
}

function prettyCategory(c: Category): string {
  return CATEGORIES.find((x) => x.id === c)?.label.toLowerCase().replace(/s$/, '') ?? 'document'
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })
}
