// /app/driver/pickups/[id]/edit/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Pickup {
  id: string
  weightKg: number
  status: string
  note: string | null
  collectedAt: string
  hospital: {
    name: string
  }
}

export default function EditPickupPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [pickupId, setPickupId] = useState<string>('')
  const [pickup, setPickup] = useState<Pickup | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Form states
  const [weightKg, setWeightKg] = useState('')
  const [status, setStatus] = useState('')
  const [note, setNote] = useState('')
  const [collectedAt, setCollectedAt] = useState('')

  useEffect(() => {
    params.then(p => {
      setPickupId(p.id)
      loadPickup(p.id)
    })
  }, [])

  const loadPickup = async (id: string) => {
    try {
      const response = await fetch(`/api/driver/pickups/${id}`)
      
      if (response.status === 401) {
        router.push('/driver/login')
        return
      }

      if (!response.ok) {
        alert('ไม่พบข้อมูล')
        router.push('/driver')
        return
      }

      const data = await response.json()
      setPickup(data)
      
      // Preload form
      setWeightKg(data.weightKg.toString())
      setStatus(data.status)
      setNote(data.note || '')
      
      // แปลง ISO → datetime-local (Asia/Bangkok)
      const date = new Date(data.collectedAt)
      const utcTimestamp = date.getTime()
      const thailandTimestamp = utcTimestamp + (7 * 60 * 60 * 1000)
      const thailandDate = new Date(thailandTimestamp)
      
      const year = thailandDate.getUTCFullYear()
      const month = (thailandDate.getUTCMonth() + 1).toString().padStart(2, '0')
      const day = thailandDate.getUTCDate().toString().padStart(2, '0')
      const hours = thailandDate.getUTCHours().toString().padStart(2, '0')
      const minutes = thailandDate.getUTCMinutes().toString().padStart(2, '0')
      
      setCollectedAt(`${year}-${month}-${day}T${hours}:${minutes}`)
    } catch (error) {
      console.error('Error loading pickup:', error)
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!weightKg || !status || !collectedAt) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    setSubmitting(true)

    try {
      // แปลง datetime-local (Asia/Bangkok) → UTC ISO
      const localDate = new Date(collectedAt)
      const thailandTimestamp = localDate.getTime()
      const utcTimestamp = thailandTimestamp - (7 * 60 * 60 * 1000)
      const utcDate = new Date(utcTimestamp)
      const isoString = utcDate.toISOString()

      const response = await fetch(`/api/driver/pickups/${pickupId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weightKg: parseFloat(weightKg),
          status,
          note: note || null,
          collectedAt: isoString,
        }),
      })

      if (response.ok) {
        alert('แก้ไขข้อมูลสำเร็จ')
        router.push(`/driver/pickups/${pickupId}`)
      } else {
        const data = await response.json()
        alert(data.error || 'เกิดข้อผิดพลาด')
      }
    } catch (error) {
      console.error('Error updating pickup:', error)
      alert('เกิดข้อผิดพลาดในการบันทึก')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f7fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #10b981',
            borderRadius: '50%',
            margin: '0 auto',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ marginTop: '16px', color: '#6b7280' }}>กำลังโหลด...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  if (!pickup) {
    return null
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7fafc' }}>
      <div style={{ 
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
        color: 'white',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          maxWidth: '1280px', 
          margin: '0 auto', 
          padding: '24px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>
            ✏️ แก้ไขการเก็บขยะ
          </h1>
          <button
            onClick={() => router.back()}
            style={{
              padding: '8px 16px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ← ย้อนกลับ
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '32px auto', padding: '0 16px' }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          padding: '24px'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
              {pickup.hospital.name}
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>
              รหัส: {pickup.id}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: '20px' }}>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  น้ำหนัก (กิโลกรัม) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  สถานะ *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="SCHEDULED">กำหนดการ</option>
                  <option value="IN_PROGRESS">กำลังดำเนินการ</option>
                  <option value="DONE">เสร็จสิ้น</option>
                  <option value="COLLECTED">จัดเก็บสำเร็จ</option>
                  <option value="EN_ROUTE">ระหว่างขนส่ง</option>
                  <option value="INCINERATED">เผาทำลายแล้ว</option>
                  <option value="CANCELLED">ยกเลิก</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  วันที่เก็บ *
                </label>
                <input
                  type="datetime-local"
                  value={collectedAt}
                  onChange={(e) => setCollectedAt(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
                <p style={{ 
                  fontSize: '12px', 
                  color: '#6b7280',
                  marginTop: '4px'
                }}>
                  เวลาประเทศไทย (GMT+7)
                </p>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  หมายเหตุ
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  placeholder="ระบุรายละเอียดเพิ่มเติม..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  background: submitting ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '16px',
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? 'กำลังบันทึก...' : '💾 บันทึกการแก้ไข'}
              </button>
              <button
                type="button'
                onClick={() => router.back()}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  background: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '16px',
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
