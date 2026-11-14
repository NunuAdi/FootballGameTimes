import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

const BG = [2, 6, 23, 255]
const AQUA = [0, 245, 212, 255]
const WHITE = [248, 250, 252, 255]

function crc32(buffer) {
  let crc = ~0
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i]
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
    }
  }
  return ~crc >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const name = Buffer.from(type)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])), 0)
  return Buffer.concat([length, name, data, crc])
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const vx = x2 - x1
  const vy = y2 - y1
  const len = vx * vx + vy * vy
  const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((px - x1) * vx + (py - y1) * vy) / len))
  const dx = px - (x1 + t * vx)
  const dy = py - (y1 + t * vy)
  return Math.hypot(dx, dy)
}

function sample(x, y, size, scale) {
  const cx = (size - 1) / 2
  const cy = (size - 1) / 2
  const dx = (x - cx) / scale
  const dy = (y - cy) / scale
  const distance = Math.hypot(dx, dy)
  const ringOuter = size * 0.34
  const ringInner = size * 0.275
  if (distance <= ringOuter && distance >= ringInner) return AQUA

  const ticks = [0, 90, 180, 270]
  for (const deg of ticks) {
    const angle = (deg * Math.PI) / 180
    const x1 = cx + Math.sin(angle) * size * 0.232
    const y1 = cy - Math.cos(angle) * size * 0.232
    const x2 = cx + Math.sin(angle) * size * 0.262
    const y2 = cy - Math.cos(angle) * size * 0.262
    if (distToSegment(cx + dx, cy + dy, x1, y1, x2, y2) <= size * 0.012) return AQUA
  }

  const minute = distToSegment(cx + dx, cy + dy, cx, cy, cx, cy - size * 0.2)
  if (minute <= size * 0.016) return WHITE
  const hourAngle = (58 * Math.PI) / 180
  const hour = distToSegment(
    cx + dx,
    cy + dy,
    cx,
    cy,
    cx + Math.sin(hourAngle) * size * 0.125,
    cy - Math.cos(hourAngle) * size * 0.125,
  )
  if (hour <= size * 0.02) return WHITE
  if (distance <= size * 0.028) return AQUA
  return BG
}

function paint(x, y, size, scale) {
  const points = [
    [0.25, 0.25],
    [0.75, 0.25],
    [0.25, 0.75],
    [0.75, 0.75],
  ]
  let r = 0
  let g = 0
  let b = 0
  let a = 0
  for (const [ox, oy] of points) {
    const color = sample(x + ox - 0.5, y + oy - 0.5, size, scale)
    r += color[0]
    g += color[1]
    b += color[2]
    a += color[3]
  }
  return [Math.round(r / 4), Math.round(g / 4), Math.round(b / 4), Math.round(a / 4)]
}

function createPNG(size, scale) {
  const stride = size * 4 + 1
  const raw = Buffer.alloc(stride * size)
  for (let y = 0; y < size; y += 1) {
    const row = y * stride
    raw[row] = 0
    for (let x = 0; x < size; x += 1) {
      const [r, g, b, a] = paint(x, y, size, scale)
      const index = row + 1 + x * 4
      raw[index] = r
      raw[index + 1] = g
      raw[index + 2] = b
      raw[index + 3] = a
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const files = [
  ['public/icon-192.png', 192, 1],
  ['public/icon-512.png', 512, 1],
  ['public/icon-maskable-512.png', 512, 0.82],
  ['public/apple-touch-icon.png', 180, 1],
]

for (const [file, size, scale] of files) {
  writeFileSync(file, createPNG(size, scale))
  console.log(`wrote ${file}`)
}
