import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Copy, Download } from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  projectName: string
  photos: { storage_url: string | null }[]
}

export function PhotoShareModal({ open, onOpenChange, projectName, photos }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [rendered, setRendered] = useState(false)

  const top6 = photos.filter((p) => !!p.storage_url).slice(0, 6)
  const date = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })

  useEffect(() => {
    if (!open) { setRendered(false); return }
    const canvas = canvasRef.current
    if (!canvas) return
    const W = 1200, H = 900
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#0F172A'
    ctx.fillRect(0, 0, W, H)

    const cols = 3, rows = 2
    const gap = 12
    const padY = 40
    const footer = 120
    const cellW = (W - gap * (cols + 1)) / cols
    const cellH = (H - footer - padY - gap * (rows + 1)) / rows

    const loadImg = (src: string) => new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => resolve(null)
      img.src = src
    })

    ;(async () => {
      for (let i = 0; i < cols * rows; i++) {
        const row = Math.floor(i / cols)
        const col = i % cols
        const x = gap + col * (cellW + gap)
        const y = padY + row * (cellH + gap)
        ctx.fillStyle = '#1E293B'
        ctx.fillRect(x, y, cellW, cellH)
        const src = top6[i]?.storage_url
        if (src) {
          const img = await loadImg(src)
          if (img) {
            // cover
            const scale = Math.max(cellW / img.width, cellH / img.height)
            const dw = img.width * scale, dh = img.height * scale
            const dx = x + (cellW - dw) / 2
            const dy = y + (cellH - dh) / 2
            ctx.save()
            ctx.beginPath(); ctx.rect(x, y, cellW, cellH); ctx.clip()
            ctx.drawImage(img, dx, dy, dw, dh)
            ctx.restore()
          }
        }
      }
      // footer
      const fy = H - footer
      ctx.fillStyle = '#0F172A'
      ctx.fillRect(0, fy, W, footer)
      ctx.fillStyle = '#F8FAFC'
      ctx.font = 'bold 40px system-ui, sans-serif'
      ctx.fillText(projectName, 32, fy + 55)
      ctx.fillStyle = '#94A3B8'
      ctx.font = '24px system-ui, sans-serif'
      ctx.fillText(`${date} · ${top6.length} photo${top6.length === 1 ? '' : 's'}`, 32, fy + 92)
      ctx.fillStyle = '#94A3B8'
      ctx.font = '20px system-ui, sans-serif'
      const brand = 'spend4good.com'
      const tw = ctx.measureText(brand).width
      ctx.fillText(brand, W - tw - 32, fy + 92)
      setRendered(true)
    })()
  }, [open, projectName, JSON.stringify(top6.map((p) => p.storage_url)), date])

  const download = () => {
    try {
      const canvas = canvasRef.current!
      const url = canvas.toDataURL('image/jpeg', 0.9)
      const a = document.createElement('a')
      a.href = url
      a.download = `${projectName.replace(/\s+/g, '-').toLowerCase()}-update.jpg`
      a.click()
    } catch (e) {
      toast.error('Download blocked — bucket CORS may need configuring')
    }
  }

  const copyMsg = async () => {
    const msg = `${projectName} update - ${date}\n${top6.length} photos submitted\nView on Spend4Good: spend4good.com`
    await navigator.clipboard.writeText(msg)
    toast.success('Share message copied')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Share update</DialogTitle></DialogHeader>
        <div className="border border-border rounded-md overflow-hidden bg-muted">
          <canvas ref={canvasRef} className="w-full h-auto" />
        </div>
        {top6.length === 0 && <p className="text-sm text-muted-foreground text-center">No photos to share yet.</p>}
        <div className="flex flex-col sm:flex-row gap-2 justify-end">
          <Button variant="outline" onClick={copyMsg}><Copy className="mr-1 h-4 w-4" /> Copy share message</Button>
          <Button onClick={download} disabled={!rendered || top6.length === 0}><Download className="mr-1 h-4 w-4" /> Download JPG</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
