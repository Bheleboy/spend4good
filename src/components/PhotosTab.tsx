import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Camera, Download, Share2 } from 'lucide-react'
import { PhotoShareModal } from './PhotoShareModal'

interface Photo {
  id: string
  storage_url: string | null
  label: string | null
  activity: string | null
  submitted_by_name: string | null
  taken_at: string
}

interface Props {
  projectId: string
  projectName: string
  activityCategories: string[]
  members: { user_id: string; user?: { full_name: string } }[]
  onCountChange?: (n: number) => void
}

const PALETTE = ['bg-primary text-primary-foreground', 'bg-success text-success-foreground', 'bg-warning text-warning-foreground', 'bg-destructive text-destructive-foreground', 'bg-[oklch(0.627_0.265_303.9)] text-primary-foreground', 'bg-[oklch(0.7_0.18_220)] text-primary-foreground', 'bg-[oklch(0.72_0.18_50)] text-primary-foreground', 'bg-[oklch(0.62_0.2_150)] text-primary-foreground']

export function PhotosTab({ projectId, projectName, activityCategories, members, onCountChange }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [activityFilter, setActivityFilter] = useState('all')
  const [agentFilter, setAgentFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [lightbox, setLightbox] = useState<Photo | null>(null)
  const [shareOpen, setShareOpen] = useState(false)

  useEffect(() => {
    (async () => {
      setLoading(true)
      const { data } = await supabase.from('project_photos').select('*').eq('project_id', projectId).order('taken_at', { ascending: false })
      const list = (data ?? []) as Photo[]
      setPhotos(list)
      onCountChange?.(list.length)
      setLoading(false)
    })()
  }, [projectId])

  const activityColor = (a: string | null) => {
    if (!a) return 'bg-muted text-muted-foreground'
    const idx = Math.max(0, activityCategories.indexOf(a))
    return PALETTE[idx % PALETTE.length]
  }

  const memberNames = useMemo(() => {
    const set = new Set<string>()
    for (const p of photos) if (p.submitted_by_name) set.add(p.submitted_by_name)
    for (const m of members) if (m.user?.full_name) set.add(m.user.full_name)
    return Array.from(set)
  }, [photos, members])

  const filtered = photos.filter((p) => {
    if (activityFilter !== 'all' && p.activity !== activityFilter) return false
    if (agentFilter !== 'all' && p.submitted_by_name !== agentFilter) return false
    if (dateFrom && p.taken_at < dateFrom) return false
    if (dateTo && p.taken_at > `${dateTo}T23:59:59`) return false
    return true
  })

  const clearFilters = () => { setActivityFilter('all'); setAgentFilter('all'); setDateFrom(''); setDateTo('') }
  const hasFilters = activityFilter !== 'all' || agentFilter !== 'all' || !!dateFrom || !!dateTo

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2 justify-between">
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium">Activity</label>
            <Select value={activityFilter} onValueChange={setActivityFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All activities</SelectItem>
                {activityCategories.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Agent</label>
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All agents</SelectItem>
                {memberNames.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">From</label>
            <Input type="date" className="w-40" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">To</label>
            <Input type="date" className="w-40" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          {hasFilters && <Button variant="link" onClick={clearFilters}>Clear filters</Button>}
        </div>
        <Button onClick={() => setShareOpen(true)}><Share2 className="mr-1 h-4 w-4" /> Share Update</Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading photos…</p>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <Camera className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {photos.length === 0
              ? 'No photos yet. Field agents submit photos by sending them to +16626414965 via WhatsApp.'
              : 'No photos match these filters.'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <button key={p.id} onClick={() => setLightbox(p)}
              className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted text-left">
              {p.storage_url ? (
                <img src={p.storage_url} alt={p.label ?? 'Photo'} loading="lazy"
                  className="h-full w-full object-cover transition-transform group-hover:scale-105" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No image</div>
              )}
              {p.activity && (
                <Badge className={`absolute top-2 left-2 text-[10px] ${activityColor(p.activity)}`}>{p.activity}</Badge>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between p-2 bg-gradient-to-t from-black/70 to-transparent text-white text-[11px]">
                <span className="truncate">{p.submitted_by_name ?? '—'}</span>
                <span>{new Date(p.taken_at).toLocaleDateString()}</span>
              </div>
              {p.label && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition p-3 text-center text-sm text-white">
                  {p.label}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!lightbox} onOpenChange={(v) => !v && setLightbox(null)}>
        <DialogContent className="max-w-4xl">
          {lightbox && (
            <div className="space-y-3">
              {lightbox.storage_url && (
                <img src={lightbox.storage_url} alt={lightbox.label ?? 'Photo'} className="w-full max-h-[70vh] object-contain rounded-md bg-black" />
              )}
              <div className="space-y-2">
                {lightbox.label && <p className="text-sm">{lightbox.label}</p>}
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{lightbox.submitted_by_name ?? 'Unknown'}</span>
                  <span>·</span>
                  <span>{new Date(lightbox.taken_at).toLocaleString()}</span>
                  {lightbox.activity && (<><span>·</span><Badge className={`text-[10px] ${activityColor(lightbox.activity)}`}>{lightbox.activity}</Badge></>)}
                </div>
                {lightbox.storage_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={lightbox.storage_url} download target="_blank" rel="noreferrer">
                      <Download className="mr-1 h-4 w-4" /> Download
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PhotoShareModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        projectName={projectName}
        photos={photos}
      />
    </div>
  )
}
