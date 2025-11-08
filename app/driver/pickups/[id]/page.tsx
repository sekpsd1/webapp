// /app/driver/pickups/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type Pickup = {
  id: string
  weightKg: number
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'DONE' | 'COLLECTED' | 'EN_ROUTE' | 'INCINERATED' | 'CANCELLED'
  note: string | null
  collectedAt: string | null
  hospital: { name: string; code?: string }
  driver: { name: string }
  photos: { id: string; fileName: string }[]
}

const statusText: Record<Pickup['status'], string> = {
  SCHEDULED: 'กำหนดการ',
  IN_PROGRESS: 'กำลังดำเนินการ',
  DONE: 'เสร็จสิ้น',
  COLLECTED: 'จัดเก็บสำเร็จ',
  EN_ROUTE: 'ระหว่างขนส่ง',
  INCINERATED: 'เผาทำลายแล้ว',
  CANCELLED: 'ยกเลิก',
}

function formatThai(iso: string | null) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export default function PickupDetailPage() {
  const router = useRouter()
  const { id } = useParams() as { id: string }

  const [pickup, setPickup] = useState<Pickup | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetch(`/api/driver/pickups/${id}`, { cache: 'no-store' })
        if (res.status === 401) { router.push('/driver/login'); return }
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error?.message || 'ไม่พบข้อมูล')
        if (!alive) return
        setPickup((json?.data ?? json) as Pickup)
      } catch {
        router.push('/driver')
      } finally {
        setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [id, router])

  if (loading) return <div className="p-4">กำลังโหลด…</div>
  if (!pickup) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">📋 รายละเอียดการเก็บขยะ</h1>
          <button onClick={() => router.push('/driver')} className="px-3 py-2 border rounded">
            ← กลับหน้าหลัก
          </button>
        </div>

        <div className="bg-white rounded-xl p-4 shadow">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-lg font-semibold">{pickup.hospital?.name}</div>
              <div className="text-sm opacity-70">รหัส: {pickup.id}</div>
            </div>
            <Link href={`/driver/pickups/${pickup.id}/edit`} className="px-3 py-2 rounded bg-yellow-500 text-white">
              ✏️ แก้ไข
            </Link>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-sm opacity-70 mb-1">สถานะ</div>
              <div className="inline-block px-3 py-1 rounded-full text-white bg-gray-600">
                {statusText[pickup.status]}
              </div>
            </div>

            <div>
              <div className="text-sm opacity-70 mb-1">พนักงานเก็บขยะ</div>
              <div className="font-medium">{pickup.driver?.name || '-'}</div>
            </div>

            <div>
              <div className="text-sm opacity-70 mb-1">น้ำหนัก</div>
              <div className="text-2xl font-bold text-emerald-600">
                {(pickup.weightKg ?? 0).toFixed(2)} กก.
              </div>
            </div>

            <div>
              <div className="text-sm opacity-70 mb-1">วันที่เก็บ</div>
              <div className="font-medium">{formatThai(pickup.collectedAt)}</div>
            </div>

            {pickup.note && (
              <div>
                <div className="text-sm opacity-70 mb-1">หมายเหตุ</div>
                <div className="font-medium">{pickup.note}</div>
              </div>
            )}

            {pickup.photos?.length > 0 && (
              <div>
                <div className="text-sm opacity-70 mb-2">รูปภาพ ({pickup.photos.length})</div>
                <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
                  {pickup.photos.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPhoto(p.fileName)}
                      className="h-36 bg-gray-100 rounded overflow-hidden"
                    >
                      <img src={`/uploads/${p.fileName}`} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedPhoto && (
        <button onClick={() => setSelectedPhoto(null)} className="fixed inset-0 bg-black/90 flex items-center justify-center">
          <img src={`/uploads/${selectedPhoto}`} alt="" className="max-w-[90%] max-h-[90%]" />
        </button>
      )}
    </div>
  )
}
