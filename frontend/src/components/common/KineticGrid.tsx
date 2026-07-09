import { useRef, useEffect } from "react"

interface KineticGridProps {
  /** Background color */
  background?: string
  /** Dot color */
  dotColor?: string
  /** Mesh line color */
  lineColor?: string
  /** Cursor trail color */
  trailColor?: string
  /** Grid spacing in pixels */
  spacing?: number
  /** Cursor attraction radius in pixels */
  radius?: number
  /** Attraction strength 1–10 */
  strength?: number
  /** Show cursor trail line */
  trail?: boolean
}

/**
 * Kinetic Grid — a reactive dot grid that follows the cursor.
 *
 * Canvas-based physics animation: dots are pulled toward the mouse
 * within a radius, with mesh lines that brighten near the cursor.
 */
export default function KineticGrid({
  background = "#fafafa",
  dotColor = "#1a1a2e",
  lineColor = "#6688cc",
  trailColor = "#4477dd",
  spacing = 30,
  radius = 300,
  strength = 4,
  trail = false,
}: KineticGridProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -9999, y: -9999, active: false })
  const trailRef = useRef<{ x: number; y: number; t: number }[]>([])

interface Dot {
  hx: number; hy: number; x: number; y: number; vx: number; vy: number;
}

  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const GAP = Math.max(8, spacing)
    const R = Math.max(1, radius)
    const PULL = (Math.max(1, Math.min(10, strength)) / 10) * 4

    let W = 1
    let H = 1
    let dots: Dot[] = []
    let cols: Dot[][] = []

    const build = (mw?: number, mh?: number) => {
      const r = host.getBoundingClientRect()
      W = Math.max(1, Math.floor(mw ?? r.width))
      H = Math.max(1, Math.floor(mh ?? r.height))
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.floor(W * dpr)
      canvas.height = Math.floor(H * dpr)
      canvas.style.width = W + "px"
      canvas.style.height = H + "px"
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      cols = []
      dots = []
      const nCols = Math.floor(W / GAP) + 2
      const nRows = Math.floor(H / GAP) + 2
      for (let c = 0; c < nCols; c++) {
        const col: Dot[] = []
        for (let r = 0; r < nRows; r++) {
          const hx = c * GAP
          const hy = r * GAP
          const d = { hx, hy, x: hx, y: hy, vx: 0, vy: 0 }
          col.push(d)
          dots.push(d)
        }
        cols.push(col)
      }
    }

    build()

    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect
      build(cr?.width, cr?.height)
    })
    ro.observe(host)

    const setMouse = (clientX: number, clientY: number) => {
      const r = canvas.getBoundingClientRect()
      const mx = clientX - r.left
      const my = clientY - r.top
      mouseRef.current.x = mx
      mouseRef.current.y = my
      mouseRef.current.active = true
      const now = performance.now()
      const tr = trailRef.current
      tr.push({ x: mx, y: my, t: now })
      if (tr.length > 80) tr.shift()
    }

    const onMove = (e: MouseEvent) => setMouse(e.clientX, e.clientY)
    const onLeave = () => {
      mouseRef.current.active = false
      mouseRef.current.x = -9999
      mouseRef.current.y = -9999
    }
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0]
      if (t) setMouse(t.clientX, t.clientY)
    }

    host.addEventListener("mousemove", onMove)
    host.addEventListener("mouseleave", onLeave)
    host.addEventListener("touchmove", onTouch, { passive: true })
    host.addEventListener("touchend", onLeave)

    let raf = 0
    const frame = () => {
      const m = mouseRef.current
      ctx.clearRect(0, 0, W, H)

      // Physics: spring home + cursor attraction
      for (const d of dots) {
        let ax = (d.hx - d.x) * 0.08
        let ay = (d.hy - d.y) * 0.08
        if (m.active) {
          const dx = m.x - d.x
          const dy = m.y - d.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < R && dist > 0.001) {
            const f = (1 - dist / R) * PULL
            ax += (dx / dist) * f
            ay += (dy / dist) * f
          }
        }
        d.vx = (d.vx + ax) * 0.82
        d.vy = (d.vy + ay) * 0.82
        d.x += d.vx
        d.y += d.vy
      }

      // Mesh lines
      for (let c = 0; c < cols.length; c++) {
        for (let r = 0; r < cols[c].length; r++) {
          const d = cols[c][r]
          const right = cols[c + 1]?.[r]
          const down = cols[c]?.[r + 1]
          const prox = m.active
            ? Math.max(0, 1 - Math.sqrt((m.x - d.x) ** 2 + (m.y - d.y) ** 2) / R)
            : 0
          if (right) {
            ctx.globalAlpha = 0.06 + prox * 0.7
            ctx.strokeStyle = lineColor
            ctx.lineWidth = 0.5 + prox * 1.5
            ctx.beginPath()
            ctx.moveTo(d.x, d.y)
            ctx.lineTo(right.x, right.y)
            ctx.stroke()
          }
          if (down) {
            ctx.globalAlpha = 0.06 + prox * 0.7
            ctx.strokeStyle = lineColor
            ctx.lineWidth = 0.5 + prox * 1.5
            ctx.beginPath()
            ctx.moveTo(d.x, d.y)
            ctx.lineTo(down.x, down.y)
            ctx.stroke()
          }
        }
      }

      // Dots
      for (const d of dots) {
        const prox = m.active
          ? Math.max(0, 1 - Math.sqrt((m.x - d.x) ** 2 + (m.y - d.y) ** 2) / R)
          : 0
        ctx.globalAlpha = 0.22 + prox * 0.78
        ctx.fillStyle = dotColor
        ctx.beginPath()
        ctx.arc(d.x, d.y, 0.8 + prox * 2.2, 0, 2 * Math.PI)
        ctx.fill()
      }

      // Cursor trail
      if (trail) {
        const now = performance.now()
        const tr = trailRef.current
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        for (let i = 1; i < tr.length; i++) {
          const a = tr[i - 1]
          const b = tr[i]
          const age = now - b.t
          if (age > 260) continue
          ctx.globalAlpha = Math.max(0, 1 - age / 260) * 0.85
          ctx.strokeStyle = trailColor
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
      }

      ctx.globalAlpha = 1
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      host.removeEventListener("mousemove", onMove)
      host.removeEventListener("mouseleave", onLeave)
      host.removeEventListener("touchmove", onTouch)
      host.removeEventListener("touchend", onLeave)
    }
  }, [background, dotColor, lineColor, trailColor, spacing, radius, strength, trail])

  return (
    <div
      ref={hostRef}
      className="absolute inset-0 overflow-hidden"
      style={{ background, cursor: "crosshair" }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>
  )
}
