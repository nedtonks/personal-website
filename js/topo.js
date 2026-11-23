// ===============================
// TOPOGRAPHIC HALFTONE BACKGROUND
// <topo-field eye="top|bottom"> draws drifting contour rings as a speckled
// dot field. Every field shares one noise seed, clock and ring centre (the
// "eye"), measured from the edge named in `eye`. Put eye="bottom" on one
// section and eye="top" on the next, and the rings join across the boundary.
// The eye leans towards the mouse, and moving the mouse pushes the contours
// around the cursor (smoothing/velocity as in the wave background).
// Needs js/noise.js loaded first.
// USED: About (eye="bottom") and Projects (eye="top") section backdrops

const TOPO = {
  pitch: 5,            // CSS px between dot centres
  scale: 1 / 320,      // CSS px -> noise units
  eyeX: 0.72,          // ring centre, as a fraction of the width
  ringFreq: 3.4,       // rings per noise unit of radius
  flow: 0.00012,       // rings per ms rippling outwards (~one every 8s)
  drift: 0.00008,      // how fast the terrain itself morphs
  follow: 0.18,        // how far the eye leans towards the mouse (0..1)
  bumpRadius: 190,     // CSS px, size of the cursor's influence
  frameMs: 33,         // ~30fps
  noise: new Noise(Math.random()),
  fields: new Set(),
  reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  // pointer state, smoothed once per frame
  mouse: { x: -9999, y: -9999, sx: -9999, sy: -9999, lx: 0, ly: 0, vs: 0, set: false },
  eyeOffset: 0,        // smoothed horizontal lean of the eye, CSS px
  last: 0,
}

window.addEventListener('mousemove', (e) => {
  const m = TOPO.mouse
  m.x = e.clientX
  m.y = e.clientY
  if (!m.set) {
    m.sx = m.lx = m.x
    m.sy = m.ly = m.y
    m.set = true
  }
})

function topoTick(time) {
  requestAnimationFrame(topoTick)
  if (TOPO.reduced || time - TOPO.last < TOPO.frameMs) return
  TOPO.last = time

  const m = TOPO.mouse
  m.sx += (m.x - m.sx) * 0.12
  m.sy += (m.y - m.sy) * 0.12
  const v = Math.hypot(m.x - m.lx, m.y - m.ly)
  m.vs += (v - m.vs) * 0.15
  m.vs = Math.min(100, m.vs)
  m.lx = m.x
  m.ly = m.y

  const target = m.set ? (m.sx - window.innerWidth * TOPO.eyeX) * TOPO.follow : 0
  TOPO.eyeOffset += (target - TOPO.eyeOffset) * 0.05

  for (const field of TOPO.fields) {
    if (field.visible) field.draw(time)
  }
}
requestAnimationFrame(topoTick)

class TopoField extends HTMLElement {
  connectedCallback() {
    // GSAP pinning re-parents the section, which re-runs this; set up only once
    if (this.canvas) return
    this.eyeAtBottom = this.getAttribute('eye') === 'bottom'
    this.visible = false

    this.canvas = document.createElement('canvas')
    this.canvas.setAttribute('aria-hidden', 'true')
    this.appendChild(this.canvas)
    this.ctx = this.canvas.getContext('2d')

    new ResizeObserver(() => this.resize()).observe(this)
    new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting
    }).observe(this)
    TOPO.fields.add(this)
  }

  resize() {
    const w = this.clientWidth
    const h = this.clientHeight
    if (!w || !h) return
    const { pitch } = TOPO

    const cols = (this.cols = Math.ceil(w / pitch) + 1)
    const rows = (this.rows = Math.ceil(h / pitch) + 1)

    // Each dot is one pixel inside a 2x2 cell, then scaled up with
    // pixelated rendering, so dots stay crisp with a gap between them.
    this.canvas.width = cols * 2
    this.canvas.height = rows * 2
    this.canvas.style.width = cols * pitch + 'px'
    this.canvas.style.height = rows * pitch + 'px'
    this.image = this.ctx.createImageData(cols * 2, rows * 2)
    this.pixels = new Uint32Array(this.image.data.buffer)

    // Fixed random threshold per dot: halftone grain without flicker
    this.thresholds = new Float32Array(cols * rows)
    for (let i = 0; i < this.thresholds.length; i++) this.thresholds[i] = Math.random()

    // Height is sampled on a coarser grid (every 2nd dot) and interpolated
    this.cc = Math.ceil(cols / 2) + 1
    this.cr = Math.ceil(rows / 2) + 1
    this.field = new Float32Array(this.cc * this.cr)

    this.draw(performance.now())
  }

  draw(time) {
    if (!this.pixels) return
    const { cols, rows, cc, cr, field, pixels, thresholds } = this
    const { pitch, scale, noise, ringFreq, mouse, bumpRadius } = TOPO
    const t = time * TOPO.drift

    // Everything is measured from the shared eye, so neighbouring
    // fields line up exactly at their shared edge.
    const ex = this.clientWidth * TOPO.eyeX + TOPO.eyeOffset
    const ey = this.eyeAtBottom ? this.clientHeight : 0

    // Cursor in this field's own coordinates
    const rect = this.getBoundingClientRect()
    const mx = mouse.sx - rect.left
    const my = mouse.sy - rect.top
    const bumpAmp = mouse.set ? 0.25 + (mouse.vs / 100) * 1.4 : 0
    const invR2 = 1 / (bumpRadius * bumpRadius)
    const ringShift = time * TOPO.flow

    const step = pitch * 2
    for (let j = 0; j < cr; j++) {
      const py = j * step
      const dy = (py - ey) * scale
      for (let i = 0; i < cc; i++) {
        const px = i * step
        const dx = (px - ex) * scale
        const n =
          0.7 * noise.simplex3(dx * 0.9, dy * 0.9, t) +
          0.3 * noise.simplex3(dx * 2.3 + 17, dy * 2.3 - 9, t * 1.4)
        const bx = px - mx
        const by = py - my
        const bump = bumpAmp * Math.exp(-(bx * bx + by * by) * invR2)
        field[j * cc + i] = Math.hypot(dx, dy) * ringFreq + n * 1.1 - ringShift + bump
      }
    }

    pixels.fill(0)
    const dot = 0xfff7ffff // #FFFFF7, little-endian ABGR
    const w2 = cols * 2

    for (let y = 0; y < rows; y++) {
      const gy = y / 2
      const j0 = gy | 0
      const fy = gy - j0
      for (let x = 0; x < cols; x++) {
        const gx = x / 2
        const i0 = gx | 0
        const fx = gx - i0
        const a = field[j0 * cc + i0]
        const b = field[j0 * cc + i0 + 1]
        const c = field[(j0 + 1) * cc + i0]
        const d = field[(j0 + 1) * cc + i0 + 1]
        const h = (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy

        // Position within the current contour band, 0..1: a dotted band
        // over roughly half the cycle, brighter at its edges, then a gap.
        const f = h - Math.floor(h)
        const band = f < 0.55 ? Math.sin((f / 0.55) * Math.PI) : 0
        const edge = Math.exp(-(((f - 0.04) / 0.045) ** 2)) + Math.exp(-(((f - 0.53) / 0.045) ** 2))
        const density = 0.012 + band * 0.3 + edge * 0.24

        if (thresholds[y * cols + x] < density) {
          pixels[y * 2 * w2 + x * 2] = dot
        }
      }
    }

    this.ctx.putImageData(this.image, 0, 0)
  }
}
customElements.define('topo-field', TopoField)
