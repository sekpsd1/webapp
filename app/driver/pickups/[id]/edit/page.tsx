// /app/driver/pickups/[id]/edit/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

type Pickup = {
  id: string
  weightKg: number | null
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'DONE' | 'COLLECTED' | 'EN_ROUTE' | 'INCINERATED' | 'CANCELLED'
  note: string | null
  collectedAt: string | null
  hospital?: { name?: string }
}

export default function EditPickupPage() {
  const router = useRouter()
  const { id } = useParams() as { id: string }

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // form states
  const [weightKg, setWeightKg] = useState('')
  const [status, setStatus] = useState<Pickup['status']>('SCHEDULED')
  const [note, setNote] = useState('')
  const [collectedAt, setCollectedAt] = useState('') // datetime-local (local time)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetch(`/api/driver/pickups/${id}`, { cache: 'no-store' })
        if (res.status === 401) { router.push('/driver/login'); return }
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error?.message || 'โหลดข้อมูลไม่สำเร็จ')
        const p: Pickup = (json?.data ?? json)
        if (!alive) return
        setWeightKg(p.weightKg != null ? String(p.weightKg) : '')
        setStatus(p.status)
        setNote(p.note ?? '')
        if (p.collectedAt) {
          const d = new Date(p.collectedAt)
          const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            .toISOString().slice(0, 16)
          setCollectedAt(local)
        }
      } catch (e: any) {
        setErr(e?.message ?? 'เกิดข้อผิดพลาด')
      } finally {
        setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [id, router])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setSaving(true)
    try {
      const body = {
        weightKg: weightKg ? Number(weightKg) : null,
        status,
        note: note || null,
        // บันทึกเป็น UTC โดยให้ JS แปลงจาก local → UTC อัตโนมัติ
        collectedAt: collectedAt ? new Date(collectedAt).toISOString() : null,
      }
      const res = await fetch(`/api/driver/pickups/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error?.message || 'บันทึกไม่สำเร็จ')
      router.push(`/driver/pickups/${id}`)
    } catch (e: any) {
      setErr(e?.message ?? 'เกิดข้อผิดพลาดในการบันทึก')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-4">กำลังโหลด…</div>

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-semibold">✏️ แก้ไขการเก็บขยะ</h1>
      {err && <div className="border p-3 rounded text-sm">{err}</div>}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">น้ำหนัก (กก.)</label>
          <input
            className="w-full border rounded p-2"
            type="number"
            step="0.01"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            placeholder="เช่น 12.5"
          />
        </div>

        <div>
          <label className="block mb-1">สถานะ</label>
          <select
            className="w-full border rounded p-2"
            value={status}
            onChange={(e) => setStatus(e.target.value as Pickup['status'])}
          >
            <option value="SCHEDULED">รอจัดเก็บ</option>
            <option value="IN_PROGRESS">กำลังดำเนินการ</option>
            <option value="DONE">เสร็จสิ้น</option>
            <option value="COLLECTED">จัดเก็บสำเร็จ</option>
            <option value="EN_ROUTE">กำลังนำส่ง</option>
            <option value="INCINERATED">ถึงเตาเผา</option>
            <option value="CANCELLED">ยกเลิก</option>
          </select>
        </div>

        <div>
          <label className="block mb-1">เวลาที่จัดเก็บ (ถ้ามี)</label>
          <input
            className="w-full border rounded p-2"
            type="datetime-local"
            value={collectedAt}
            onChange={(e) => setCollectedAt(e.target.value)}
          />
          <p className="text-xs mt-1 opacity-70">
            UI เป็นเวลาเครื่องคุณ (Asia/Bangkok) — ระบบจะเก็บเป็น UTC อัตโนมัติ
          </p>
        </div>

        <div>
          <label className="block mb-1">หมายเหตุ</label>
          <textarea
            className="w-full border rounded p-2"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="px-4 py-2 rounded border">
            {saving ? 'กำลังบันทึก…' : '💾 บันทึกการแก้ไข'}
          </button>
          <button type="button" onClick={() => router.push(`/driver/pickups/${id}`)} className="px-4 py-2 rounded border">
            ยกเลิก
          </button>
        </div>
      </form>
    </div>
  )
}
