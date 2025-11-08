// /app/driver/pickups/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Pickup {
  id: string
  weightKg: number
  status: string
  note: string | null
  collectedAt: string
  hospital: {
    name: string
    code: string
  }
  driver: {
    name: string
  }
  photos: Array<{
    id: string
    fileName: string
  }>
}

const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'SCHEDULED': 'กำหนดการ',
    'IN_PROGRESS': 'กำลังดำเนินการ',
    'DONE': 'เสร็จสิ้น',
    'COLLECTED': 'จัดเก็บสำเร็จ',
    'EN_ROUTE': 'ระหว่างขนส่ง',
    'INCINERATED': 'เผาทำลายแล้ว',
    'CANCELLED': 'ยกเลิก'
  }
  return statusMap[status] || status
}

const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    'SCHEDULED': '#6b7280',
    'IN_PROGRESS': '#f59e0b',
    'DONE': '#10b981',
    'COLLECTED': '#10b981',
    'EN_ROUTE': '#3b82f6',
    'INCINERATED': '#8b5cf6',
    'CANCELLED': '#ef4444'
  }
  return colorMap[status] || '#6b7280'
}

const formatThaiDate = (dateString: string): string => {
  const date = new Date(dateString)
  const utcTimestamp = date.getTime()
  const thailandTimestamp = utcTimestamp + (7 * 60 * 60 * 1000)
  const thailandDate = new Date(thailandTimestamp)
  
  const day = thailandDate.getUTCDate()
  const month = thailandDate.getUTCMonth() + 1
  const year = thailandDate.getUTCFullYear() + 543
  const hours = thailandDate.getUTCHours().toString().padStart(2, '0')
  const minutes = thailandDate.getUTCMinutes().toString().padStart(2, '0')
  
  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ]
  
  return `${day} ${monthNames[month - 1]} ${year} เวลา ${hours}:${minutes} น.`
}

export default function PickupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [pickupId, setPickupId] = useState<string>('')
  const [pickup, setPickup] = useState<Pickup | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

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
    } catch (error) {
      console.error('Error loading pickup:', error)
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล')
    } finally {
      setLoading(false)
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
            📋 รายละเอียดการเก็บขยะ
          </h1>
          <button
            onClick={() => router.push('/driver')}
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
            ← กลับหน้าหลัก
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
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
                {pickup.hospital.name}
              </h2>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>รหัส: {pickup.id}</p>
            </div>
            <Link 
              href={`/driver/pickups/${pickup.id}/edit`}
              style={{
                padding: '10px 20px',
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              ✏️ แก้ไข
            </Link>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            
            <div>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>สถานะ</p>
              <span style={{
                display: 'inline-block',
                padding: '8px 16px',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: '600',
                background: getStatusColor(pickup.status),
                color: 'white'
              }}>
                {getStatusText(pickup.status)}
              </span>
            </div>

            <div>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>พนักงานเก็บขยะ</p>
              <p style={{ fontWeight: '600', fontSize: '16px' }}>{pickup.driver.name}</p>
            </div>

            <div>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>น้ำหนัก</p>
              <p style={{ fontWeight: 'bold', fontSize: '24px', color: '#10b981' }}>
                {pickup.weightKg.toFixed(2)} กก.
              </p>
            </div>

            <div>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>วันที่เก็บ</p>
              <p style={{ fontWeight: '600', fontSize: '16px' }}>{formatThaiDate(pickup.collectedAt)}</p>
            </div>

            {pickup.note && (
              <div>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>หมายเหตุ</p>
                <p style={{ fontWeight: '600', fontSize: '16px' }}>{pickup.note}</p>
              </div>
            )}

            {pickup.photos.length > 0 && (
              <div>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                  รูปภาพ ({pickup.photos.length})
                </p>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '12px'
                }}>
                  {pickup.photos.map((photo) => (
                    <div 
                      key={photo.id}
                      style={{
                        width: '100%',
                        height: '150px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        background: '#f3f4f6'
                      }}
                      onClick={() => setSelectedPhoto(photo.fileName)}
                    >
                      <img
                        src={`/public/uploads/${photo.fileName}`}
                        alt="รูปภาพ"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedPhoto && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60
          }}
          onClick={() => setSelectedPhoto(null)}
        >
          <img src={`/public/uploads/${selectedPhoto}`} alt="รูปภาพขยาย" style={{ maxWidth: '90%', maxHeight: '90%' }} />
        </div>
      )}
    </div>
  )
}

