'use client'
import { useEffect, useRef } from 'react'

type Props = { color: string; initial: string; size?: number }

export default function CharCanvas({ color, initial, size = 72 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const h = Math.round(size * 1.15)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, size, h)
    const cx = size / 2
    const headR = size * 0.22
    const headY = headR + 4

    // head
    ctx.fillStyle = color
    ctx.beginPath(); ctx.arc(cx, headY, headR, 0, Math.PI * 2); ctx.fill()

    // eyes
    ctx.fillStyle = '#fff'
    ctx.beginPath(); ctx.arc(cx - headR * 0.35, headY - headR * 0.12, headR * 0.22, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(cx + headR * 0.35, headY - headR * 0.12, headR * 0.22, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#333'
    ctx.beginPath(); ctx.arc(cx - headR * 0.35, headY - headR * 0.12, headR * 0.11, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(cx + headR * 0.35, headY - headR * 0.12, headR * 0.11, 0, Math.PI * 2); ctx.fill()

    // mouth
    ctx.strokeStyle = '#333'; ctx.lineWidth = 1.4
    ctx.beginPath(); ctx.arc(cx, headY + headR * 0.25, headR * 0.24, 0, Math.PI); ctx.stroke()

    // body
    const bodyY = headY + headR + 2
    const bodyW = size * 0.44
    const bodyH = size * 0.34
    ctx.fillStyle = color
    ctx.fillRect(cx - bodyW / 2, bodyY, bodyW, bodyH)

    // arms
    ctx.fillRect(cx - bodyW / 2 - size * 0.15, bodyY + 2, size * 0.15, size * 0.22)
    ctx.fillRect(cx + bodyW / 2, bodyY + 2, size * 0.15, size * 0.22)

    // legs
    ctx.fillRect(cx - bodyW / 2 + 2, bodyY + bodyH, size * 0.15, size * 0.22)
    ctx.fillRect(cx + bodyW / 2 - size * 0.15 - 2, bodyY + bodyH, size * 0.15, size * 0.22)

    // initial
    ctx.fillStyle = '#fff'
    ctx.font = `bold ${Math.round(size * 0.14)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(initial, cx, bodyY + bodyH * 0.65)
  }, [color, initial, size, h])

  return <canvas ref={ref} width={size} height={h} />
}
