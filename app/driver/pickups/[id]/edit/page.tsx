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
  photos: Array<{
    id: string
    fileName: string
  }>
}

export default function EditPickupPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [pickupId, setPickupId] = useState<string>('')
  const [pickup, setPickup] = useState<Pickup | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  
  // Form states
  const [weightKg, setWeightKg] = useState('')
  const [status, setStatus] = useState('')
  const [note, setNote] = useState('')
  const [collectedAt, setCollectedAt] = useState('')
  const [photos, setPhotos] = useState<File[]>([])

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
      
      // แปลง ISO → Thai format (DD/MM/YYYY HH:mm)
      const date = new Date(data.collectedAt)
      const utcTimestamp = date.getTime()
      const thailandTimestamp = utcTimestamp + (7 * 60 * 60 * 1000)
      const thailandDate = new Date(thailandTimestamp)
      
      const day = thailandDate.getUTCDate().toString().padStart(2, '0')
      const month = (thailandDate.getUTCMonth() + 1).toString().padStart(2, '0')
      const year = thailandDate.getUTCFullYear() + 543
      const hours = thailandDate.getUTCHours().toString().padStart(2, '0')
      const minutes = thailandDate.getUTCMinutes().toString().padStart(2, '0')
      
      setCollectedAt(`${day}/${month}/${year} ${hours}:${minutes}`)
    } catch (error) {
      console.error('Error loading pickup:', error)
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate รูปแบบวันที่
    const datePattern = /^\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}$/
    if (!datePattern.test(collectedAt)) {
      alert('รูปแบบวันที่ไม่ถูกต้อง กรุณากรอกในรูปแบบ วว/ดด/ปปปป ชช:นน\nตัวอย่าง: 08/11/2568 14:30')
      return
    }
    
    if (!weightKg || !status || !collectedAt) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    setSubmitting(true)

    try {
      // แปลง Thai format → UTC ISO
      const parts = collectedAt.trim().split(' ')
      const dateParts = parts[0].split('/')
      const timeParts = parts[1].split(':')
      
      const day = dateParts[0].padStart(2, '0')
      const month = dateParts[1].padStart(2, '0')
      const yearBE = parseInt(dateParts[2])
      const yearCE = yearBE - 543
      
      const isoString = `${yearCE}-${month}-${day}T${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}:00`

      // ใช้ FormData แทน JSON
      const formData = new FormData()
      formData.append('weightKg', weightKg)
      formData.append('status', status)
      formData.append('note', note || '')
      formData.append('collectedAt', isoString)
      
      // เพิ่มรูปภาพ (ถ้ามี)
      if (photos.length > 0) {
        photos.forEach((photo) => {
          formData.append('photos', photo)
        })
      }

      const response = await fetch(`/api/driver/pickups/${pickupId}`, {
        method: 'PATCH',
        body: formData,
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

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('ต้องการลบรูปภาพนี้หรือไม่?')) return

    try {
      const response = await fetch(`/api/driver/pickups/photo/${photoId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('ลบรูปภาพสำเร็จ')
        // Reload ข้อมูล
        await loadPickup(pickupId)
      } else {
        alert('เกิดข้อผิดพลาดในการลบรูปภาพ')
      }
    } catch (error) {
      console.error('Error deleting photo:', error)
      alert('เกิดข้อผิดพลาดในการลบรูปภาพ')
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPhotos(Array.from(e.target.files))
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
                  <option value="COLLECTED">จัดเก็บสำเร็จ</option>
                  <option value="IN_TRANSIT">นำส่งเตาเผา</option>
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
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={collectedAt}
                    onChange={(e) => setCollectedAt(e.target.value)}
                    required
                    placeholder="08/11/2568 14:30"
                    style={{
                      width: '100%',
                      padding: '12px 40px 12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date()
                      const day = now.getDate().toString().padStart(2, '0')
                      const month = (now.getMonth() + 1).toString().padStart(2, '0')
                      const year = now.getFullYear() + 543
                      const hours = now.getHours().toString().padStart(2, '0')
                      const minutes = now.getMinutes().toString().padStart(2, '0')
                      setCollectedAt(`${day}/${month}/${year} ${hours}:${minutes}`)
                    }}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      padding: '6px 8px',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    title="วันนี้"
                  >
                    📅
                  </button>
                </div>
                <p style={{ 
                  fontSize: '12px', 
                  color: '#6b7280',
                  marginTop: '4px'
                }}>
                  รูปแบบ: วัน/เดือน/ปี ชั่วโมง:นาที (กด 📅 = วันนี้)
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

              {pickup.photos && pickup.photos.length > 0 && (
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    รูปภาพปัจจุบัน
                  </label>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: '12px'
                  }}>
                    {pickup.photos.map((photo) => (
                      <div 
                        key={photo.id}
                        style={{
                          position: 'relative',
                          width: '100%',
                          height: '150px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          background: '#f3f4f6',
                          border: '2px solid #e5e7eb'
                        }}
                      >
                        <img
                          src={`/public/uploads/${photo.fileName}`}
                          alt="รูปภาพ"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            cursor: 'pointer'
                          }}
                          onClick={() => setSelectedPhoto(photo.fileName)}
                          onError={(e) => {
                            (e.currentTarget.parentElement as HTMLElement)!.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:36px;">📷</div>'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(photo.id)}
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            padding: '6px 10px',
                            background: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          ลบ
                        </button>
                      </div>
                    ))}
                  </div>
                  <p style={{ 
                    fontSize: '12px', 
                    color: '#6b7280',
                    marginTop: '8px'
                  }}>
                    คลิกที่รูปเพื่อดูขนาดเต็ม
                  </p>
                </div>
              )}

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  อัปโหลดรูปเพิ่ม
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
                {photos.length > 0 && (
                  <p style={{ 
                    fontSize: '14px', 
                    color: '#6b7280',
                    marginTop: '8px'
                  }}>
                    เลือก {photos.length} ไฟล์: {photos.map(p => p.name).join(', ')}
                  </p>
                )}
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
                type="button"
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

      {/* Modal แสดงรูปใหญ่ */}
      {selectedPhoto && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
            padding: '16px'
          }}
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              padding: '12px',
              background: 'white',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '24px',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
          <img
            src={`/public/uploads/${selectedPhoto}`}
            alt="รูปภาพขยาย"
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain'
            }}
          />
        </div>
      )}
    </div>
  )
}
