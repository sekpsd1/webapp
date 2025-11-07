// /app/driver/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Hospital {
  id: string
  code: string
  name: string
}

interface Pickup {
  id: string
  hospitalId: string
  driverId: string
  collectedAt: string
  status: string
  note: string | null
  weightKg: number
  createdAt: string
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
  switch (status) {
    case 'COLLECTED':
      return 'จัดเก็บสำเร็จ'
    case 'IN_TRANSIT':
      return 'นำส่งเตาเผา'
    default:
      return status
  }
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'COLLECTED':
      return '#10b981'
    case 'IN_TRANSIT':
      return '#3b82f6'
    default:
      return '#6b7280'
  }
}

const formatThaiDate = (dateString: string): string => {
  const date = new Date(dateString)
  
  // แปลงเป็น UTC timestamp
  const utcTimestamp = date.getTime()
  
  // เพิ่ม 7 ชั่วโมง (Thailand timezone)
  const thailandTimestamp = utcTimestamp + (7 * 60 * 60 * 1000)
  
  // สร้าง Date object ใหม่
  const thailandDate = new Date(thailandTimestamp)
  
  // ใช้ UTC methods เพื่อหลีกเลี่ยง browser timezone
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

const formatWeight = (weight: number): string => {
  return `${weight.toFixed(2)} กก.`
}

const formatDateForInput = (dateString: string): string => {
  const date = new Date(dateString)
  
  // แปลงเป็น UTC timestamp
  const utcTimestamp = date.getTime()
  
  // เพิ่ม 7 ชั่วโมง
  const thailandTimestamp = utcTimestamp + (7 * 60 * 60 * 1000)
  
  // สร้าง Date object ใหม่
  const thailandDate = new Date(thailandTimestamp)
  
  // ใช้ UTC methods
  const day = thailandDate.getUTCDate().toString().padStart(2, '0')
  const month = (thailandDate.getUTCMonth() + 1).toString().padStart(2, '0')
  const year = thailandDate.getUTCFullYear() + 543
  const hours = thailandDate.getUTCHours().toString().padStart(2, '0')
  const minutes = thailandDate.getUTCMinutes().toString().padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

const parseThaiDateToISO = (thaiDateStr: string): string => {
  try {
    // รูปแบบ: DD/MM/YYYY HH:mm
    const parts = thaiDateStr.trim().split(' ')
    const dateParts = parts[0].split('/')
    const timeParts = parts[1]?.split(':') || ['00', '00']
    
    const day = dateParts[0].padStart(2, '0')
    const month = dateParts[1].padStart(2, '0')
    const yearBE = parseInt(dateParts[2])
    const yearCE = yearBE - 543
    
    return `${yearCE}-${month}-${day}T${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}:00`
  } catch (error) {
    console.error('Error parsing Thai date:', error)
    return new Date().toISOString()
  }
}

export default function DriverPage() {
  const router = useRouter()
  const [pickups, setPickups] = useState<Pickup[]>([])
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)
  const [driverName, setDriverName] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingPickup, setEditingPickup] = useState<Pickup | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  // Form states
  const [hospitalId, setHospitalId] = useState('')
  const [weight, setWeight] = useState('')
  const [collectedAt, setCollectedAt] = useState('')
  const [status, setStatus] = useState('COLLECTED')
  const [note, setNote] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const pickupsRes = await fetch('/api/driver')
      
      if (pickupsRes.status === 401) {
        router.push('/driver/login')
        return
      }

      const pickupsData = await pickupsRes.json()

      if (Array.isArray(pickupsData)) {
        setPickups(pickupsData)
        
        if (pickupsData.length > 0 && pickupsData[0].driver) {
          setDriverName(pickupsData[0].driver.name)
        }
      }

      setHospitals([
        { id: '', code: 'TEST001', name: 'โรงพยาบาลทดสอบ' }
      ])

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/driver/logout', { method: 'POST' })
      router.push('/driver/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleEdit = (pickup: Pickup) => {
    setEditingPickup(pickup)
    setHospitalId(pickup.hospital.code)
    setWeight(pickup.weightKg.toString())
    setCollectedAt(formatDateForInput(pickup.collectedAt))
    setStatus(pickup.status)
    setNote(pickup.note || '')
    setPhotos([])
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!hospitalId || !weight || !collectedAt || !status) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    // Validate รูปแบบวันที่
    const datePattern = /^\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}$/
    if (!datePattern.test(collectedAt)) {
      alert('รูปแบบวันที่ไม่ถูกต้อง กรุณากรอกในรูปแบบ วว/ดด/ปปปป ชช:นน\nตัวอย่าง: 02/11/2568 14:30')
      return
    }

    setSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('hospital_id', hospitalId)
      formData.append('weight', weight)
      formData.append('collected_at', parseThaiDateToISO(collectedAt))
      formData.append('status', status)
      formData.append('note', note)
      
      if (photos.length > 0) {
        photos.forEach((photo) => {
          formData.append('photos', photo)
        })
      }

      const url = editingPickup 
        ? `/api/driver/${editingPickup.id}`
        : '/api/driver'
      
      const method = editingPickup ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        const successMessage = editingPickup ? 'แก้ไขข้อมูลสำเร็จ' : 'บันทึกการเก็บขยะสำเร็จ'
        
        // ปิดฟอร์มและเคลียร์ทุกอย่าง
        setShowForm(false)
        setEditingPickup(null)
        setHospitalId('')
        setWeight('')
        setCollectedAt('')
        setStatus('COLLECTED')
        setNote('')
        setPhotos([])
        
        // Reload ข้อมูล
        await loadData()
        
        alert(successMessage)
      } else {
        alert(data.error || 'เกิดข้อผิดพลาด')
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการบันทึก')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPhotos(Array.from(e.target.files))
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('ต้องการลบรูปภาพนี้หรือไม่?')) return

    try {
      const response = await fetch(`/api/driver/photo/${photoId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('ลบรูปภาพสำเร็จ')
        
        // อัพเดท editingPickup ให้แสดงรูปที่เหลือ
        if (editingPickup) {
          setEditingPickup({
            ...editingPickup,
            photos: editingPickup.photos.filter(p => p.id !== photoId)
          })
        }
        
        // Reload ข้อมูลทั้งหมด
        await loadData()
      } else {
        alert('เกิดข้อผิดพลาดในการลบรูปภาพ')
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการลบรูปภาพ')
    }
  }

  const handleCancelEdit = () => {
    setShowForm(false)
    setEditingPickup(null)
    setHospitalId('')
    setWeight('')
    setCollectedAt('')
    setStatus('COLLECTED')
    setNote('')
    setPhotos([])
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
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
              🚛 ระบบพนักงานเก็บขยะ
            </h1>
            <p style={{ color: '#d1fae5' }}>
              พนักงาน: {driverName || 'กำลังโหลด...'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handlePrint}
              style={{
                padding: '8px 16px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
            >
              🖨️ พิมพ์รายงาน
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 16px' }}>
        
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => {
              if (!showForm) {
                const now = new Date()
                const day = now.getDate().toString().padStart(2, '0')
                const month = (now.getMonth() + 1).toString().padStart(2, '0')
                const year = now.getFullYear() + 543
                const hours = now.getHours().toString().padStart(2, '0')
                const minutes = now.getMinutes().toString().padStart(2, '0')
                setCollectedAt(`${day}/${month}/${year} ${hours}:${minutes}`)
              }
              setShowForm(!showForm)
            }}
            style={{
              padding: '12px 24px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#059669'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#10b981'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            + บันทึกการเก็บขยะใหม่
          </button>
        </div>

        {showForm && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: 'bold', 
              color: '#1f2937',
              marginBottom: '16px'
            }}>
              {editingPickup ? 'แก้ไขการเก็บขยะ' : 'บันทึกการเก็บขยะ'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    โรงพยาบาล *
                  </label>
                  <select
                    value={hospitalId}
                    onChange={(e) => setHospitalId(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">เลือกโรงพยาบาล</option>
                    {hospitals.map((h) => (
                      <option key={h.code} value={h.code}>{h.name}</option>
                    ))}
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
                    น้ำหนัก (กิโลกรัม) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    required
                    placeholder="เช่น 50.5"
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
                    วันที่เก็บ *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={collectedAt}
                      onChange={(e) => setCollectedAt(e.target.value)}
                      required
                      placeholder="02/11/2568 14:30"
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
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      title="วันนี้"
                      onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
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

                <div style={{ gridColumn: '1 / -1' }}>
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
                    rows={3}
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

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    รูปภาพ {editingPickup && '(อัปโหลดใหม่เพื่อเพิ่มรูป)'}
                  </label>
                  
                  {editingPickup && editingPickup.photos.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                        รูปภาพปัจจุบัน:
                      </p>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                        gap: '12px'
                      }}>
                        {editingPickup.photos.map((photo) => (
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
                                objectFit: 'cover'
                              }}
                              onError={(e) => {
                                e.currentTarget.parentElement!.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:36px;">📷</div>'
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
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
                              onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
                            >
                              ลบ
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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

              <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    background: submitting ? '#9ca3af' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {submitting ? 'กำลังบันทึก...' : editingPickup ? 'บันทึกการแก้ไข' : 'บันทึก'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    background: '#e5e7eb',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        )}
		  
		  <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            color: '#1f2937',
            marginBottom: '4px'
          }}>
            ประวัติการเก็บขยะ
          </h2>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            ทั้งหมด {pickups.length} รายการ
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
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
        ) : pickups.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            padding: '48px 32px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>📋</p>
            <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              ยังไม่มีประวัติการเก็บขยะ
            </p>
            <p style={{ fontSize: '14px' }}>
              เริ่มต้นโดยการกดปุ่ม "+ บันทึกการเก็บขยะใหม่"
            </p>
          </div>
        ) : (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                      วันที่เก็บ
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                      โรงพยาบาล
                    </th>
                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                      น้ำหนัก
                    </th>
                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                      สถานะ
                    </th>
                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                      รูปภาพ
                    </th>
                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                      การจัดการ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pickups.map((pickup, index) => (
                    <tr 
                      key={pickup.id}
                      style={{
                        borderBottom: '1px solid #e5e7eb',
                        background: index % 2 === 0 ? 'white' : '#f9fafb',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'white' : '#f9fafb'}
                    >
                      <td style={{ padding: '16px' }}>
                        <p style={{ fontWeight: '600', fontSize: '14px', color: '#1f2937', marginBottom: '4px' }}>
                          {formatThaiDate(pickup.collectedAt).split(' ').slice(0, 3).join(' ')}
                        </p>
                        <p style={{ fontSize: '12px', color: '#6b7280' }}>
                          {formatThaiDate(pickup.collectedAt).split(' ').slice(3).join(' ')}
                        </p>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <p style={{ fontWeight: '600', fontSize: '14px', color: '#1f2937' }}>
                          {pickup.hospital.name}
                        </p>
                        {pickup.note && (
                          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                            📝 {pickup.note.length > 30 ? pickup.note.substring(0, 30) + '...' : pickup.note}
                          </p>
                        )}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <p style={{ fontWeight: 'bold', fontSize: '18px', color: '#10b981' }}>
                          {formatWeight(pickup.weightKg)}
                        </p>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '6px 12px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: getStatusColor(pickup.status),
                          color: 'white'
                        }}>
                          {getStatusText(pickup.status)}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        {pickup.photos.length > 0 ? (
                          <span 
                            style={{ 
                              fontSize: '14px', 
                              color: '#10b981',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                            onClick={() => setSelectedPhoto(pickup.photos[0].fileName)}
                          >
                            📷 {pickup.photos.length} ไฟล์
                          </span>
                        ) : (
                          <span style={{ fontSize: '14px', color: '#9ca3af' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleEdit(pickup)}
                          style={{
                            padding: '8px 16px',
                            background: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: '600',
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#d97706'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#f59e0b'}
                        >
                          ✏️ แก้ไข
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
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

      <style>{`
        @media print {
          button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
