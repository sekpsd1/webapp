// /app/hospital/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
  
  // แปลงเป็นเวลาไทย (UTC+7)
  const thaiDate = new Date(date.getTime() + (7 * 60 * 60 * 1000))
  
  const day = thaiDate.getDate()
  const month = thaiDate.getMonth() + 1
  const year = thaiDate.getFullYear() + 543 // แปลง ค.ศ. เป็น พ.ศ.
  const hours = thaiDate.getHours().toString().padStart(2, '0')
  const minutes = thaiDate.getMinutes().toString().padStart(2, '0')
  
  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ]
  
  return `${day} ${monthNames[month - 1]} ${year} เวลา ${hours}:${minutes} น.`
}

const formatWeight = (weight: number): string => {
  return `${weight.toFixed(2)} กก.`
}

export default function HospitalDashboardPage() {
  const router = useRouter()
  const [pickups, setPickups] = useState<Pickup[]>([])
  const [loading, setLoading] = useState(true)
  const [hospitalName, setHospitalName] = useState('')
  const [selectedPickup, setSelectedPickup] = useState<Pickup | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  useEffect(() => {
    loadPickups()
  }, [])

  const loadPickups = async () => {
    try {
      const response = await fetch('/api/pickup')
      
      if (response.status === 401) {
        router.push('/hospital/login')
        return
      }

      const data = await response.json()

      if (Array.isArray(data)) {
        setPickups(data)
        if (data.length > 0) {
          setHospitalName(data[0].hospital.name)
        }
      }
    } catch (error) {
      console.error('Error loading pickups:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/hospital/logout', { method: 'POST' })
      router.push('/hospital/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handlePrintDetail = () => {
  if (!selectedPickup) return
  
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>รายละเอียดการเก็บขยะ - ${selectedPickup.hospital.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            @page {
              size: A4;
              margin: 15mm;
            }
            
            body {
              font-family: 'Sarabun', sans-serif;
              font-size: 14pt;
              line-height: 1.6;
              color: #333;
              background: white;
            }
            
            .container {
              max-width: 210mm;
              margin: 0 auto;
              padding: 20px;
            }
            
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #3b82f6;
              padding-bottom: 20px;
            }
            
            .header h1 {
              font-size: 24pt;
              font-weight: 700;
              color: #1f2937;
              margin-bottom: 10px;
            }
            
            .header .subtitle {
              font-size: 14pt;
              color: #6b7280;
            }
            
            .info-section {
              margin-bottom: 25px;
            }
            
            .info-row {
              display: flex;
              padding: 12px;
              border-bottom: 1px solid #e5e7eb;
              align-items: center;
            }
            
            .info-row:nth-child(even) {
              background: #f9fafb;
            }
            
            .info-label {
              font-weight: 600;
              color: #6b7280;
              width: 180px;
              flex-shrink: 0;
            }
            
            .info-value {
              font-weight: 400;
              color: #1f2937;
              flex: 1;
            }
            
            .info-value.highlight {
              font-size: 20pt;
              font-weight: 700;
              color: #3b82f6;
            }
            
            .status-badge {
              display: inline-block;
              padding: 8px 20px;
              border-radius: 20px;
              font-weight: 600;
              font-size: 12pt;
              background: ${getStatusColor(selectedPickup.status)};
              color: white;
            }
            
            .photos-section {
              margin-top: 30px;
              page-break-inside: avoid;
            }
            
            .photos-section h2 {
              font-size: 16pt;
              font-weight: 600;
              color: #1f2937;
              margin-bottom: 15px;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 10px;
            }
            
            .photos-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              margin-top: 15px;
            }
            
            .photo-item {
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              overflow: hidden;
              background: #f9fafb;
              page-break-inside: avoid;
            }
            
            .photo-item img {
              width: 100%;
              height: 200px;
              object-fit: cover;
              display: block;
            }
            
            .photo-caption {
              padding: 8px;
              text-align: center;
              font-size: 10pt;
              color: #6b7280;
              background: white;
            }
            
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
              text-align: center;
              font-size: 10pt;
              color: #6b7280;
            }
            
            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
              
              .container {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏥 รายละเอียดการเก็บขยะติดเชื้อ</h1>
              <div class="subtitle">${selectedPickup.hospital.name}</div>
            </div>
            
            <div class="info-section">
              <div class="info-row">
                <div class="info-label">รหัสรายการ:</div>
                <div class="info-value">${selectedPickup.id}</div>
              </div>
              
              <div class="info-row">
                <div class="info-label">สถานะ:</div>
                <div class="info-value">
                  <span class="status-badge">${getStatusText(selectedPickup.status)}</span>
                </div>
              </div>
              
              <div class="info-row">
                <div class="info-label">โรงพยาบาล:</div>
                <div class="info-value">${selectedPickup.hospital.name}</div>
              </div>
              
              <div class="info-row">
                <div class="info-label">พนักงานเก็บขยะ:</div>
                <div class="info-value">${selectedPickup.driver.name}</div>
              </div>
              
              <div class="info-row">
                <div class="info-label">น้ำหนักขยะ:</div>
                <div class="info-value highlight">${formatWeight(selectedPickup.weightKg)}</div>
              </div>
              
              <div class="info-row">
                <div class="info-label">วันที่เก็บ:</div>
                <div class="info-value">${formatThaiDate(selectedPickup.collectedAt)}</div>
              </div>
              
              ${selectedPickup.note ? `
              <div class="info-row">
                <div class="info-label">หมายเหตุ:</div>
                <div class="info-value">${selectedPickup.note}</div>
              </div>
              ` : ''}
            </div>
            
            ${selectedPickup.photos.length > 0 ? `
            <div class="photos-section">
              <h2>📷 รูปภาพประกอบ (${selectedPickup.photos.length} รูป)</h2>
              <div class="photos-grid">
                ${selectedPickup.photos.map((photo, index) => `
                  <div class="photo-item">
                    <img 
                      src="/uploads/${photo.fileName}" 
                      alt="รูปที่ ${index + 1}"
                      onerror="this.style.display='none';this.parentElement.innerHTML='<div style=\\'padding:50px;text-align:center;color:#9ca3af;\\'>📷<br>ไม่สามารถโหลดรูปได้</div>'"
                    />
                    <div class="photo-caption">รูปที่ ${index + 1}</div>
                  </div>
                `).join('')}
              </div>
            </div>
            ` : ''}
            
            <div class="footer">
              <p>พิมพ์เมื่อ: ${formatThaiDate(new Date().toISOString())}</p>
              <p>ระบบจัดเก็บขยะติดเชื้อโรงพยาบาล</p>
            </div>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    
    // รอให้รูปโหลดเสร็จก่อน print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus()
        printWindow.print()
      }, 500)
    }
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
            borderTop: '4px solid #3b82f6',
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

  return (
    <div style={{ minHeight: '100vh', background: '#f7fafc' }}>
      <div style={{ 
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
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
              🏥 ระบบจัดเก็บขยะโรงพยาบาล
            </h1>
            <p style={{ color: '#dbeafe' }}>
              {hospitalName || 'กำลังโหลด...'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handlePrint}
              style={{
                padding: '8px 16px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
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
            รายการขยะที่เก็บแล้ว
          </h2>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            ทั้งหมด {pickups.length} รายการ
          </p>
        </div>

        {pickups.length === 0 ? (
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
              ยังไม่มีรายการขยะที่เก็บแล้ว
            </p>
            <p style={{ fontSize: '14px' }}>
              รอพนักงานบันทึกการเก็บขยะ
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
                      พนักงาน
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
                          {pickup.driver.name}
                        </p>
                        {pickup.note && (
                          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                            📝 {pickup.note.length > 30 ? pickup.note.substring(0, 30) + '...' : pickup.note}
                          </p>
                        )}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <p style={{ fontWeight: 'bold', fontSize: '18px', color: '#3b82f6' }}>
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
                          <span style={{ 
                            fontSize: '14px', 
                            color: '#10b981',
                            fontWeight: '600'
                          }}>
                            📷 {pickup.photos.length} ไฟล์
                          </span>
                        ) : (
                          <span style={{ fontSize: '14px', color: '#9ca3af' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <button
                          onClick={() => setSelectedPickup(pickup)}
                          style={{
                            padding: '8px 16px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: '600',
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                        >
                          ดูรายละเอียด
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

      {/* Modal รายละเอียด */}
      {selectedPickup && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '16px'
          }}
          onClick={() => setSelectedPickup(null)}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: '24px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                รายละเอียดการเก็บขยะ
              </h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handlePrintDetail}
                  style={{
                    padding: '8px 12px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                  title="พิมพ์รายละเอียด"
                >
                  🖨️
                </button>
                <button
                  onClick={() => setSelectedPickup(null)}
                  style={{
                    padding: '8px',
                    background: '#e5e7eb',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '20px'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>รหัส</p>
              <p style={{ fontWeight: '600', fontSize: '16px' }}>{selectedPickup.id}</p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>สถานะ</p>
              <span style={{
                display: 'inline-block',
                padding: '8px 16px',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: '600',
                background: getStatusColor(selectedPickup.status),
                color: 'white'
              }}>
                {getStatusText(selectedPickup.status)}
              </span>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>พนักงานเก็บขยะ</p>
              <p style={{ fontWeight: '600', fontSize: '16px' }}>{selectedPickup.driver.name}</p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>น้ำหนัก</p>
              <p style={{ fontWeight: 'bold', fontSize: '24px', color: '#3b82f6' }}>
                {formatWeight(selectedPickup.weightKg)}
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>วันที่เก็บ</p>
              <p style={{ fontWeight: '600', fontSize: '16px' }}>{formatThaiDate(selectedPickup.collectedAt)}</p>
            </div>

            {selectedPickup.note && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>หมายเหตุ</p>
                <p style={{ fontWeight: '600', fontSize: '16px' }}>{selectedPickup.note}</p>
              </div>
            )}

            {selectedPickup.photos.length > 0 && (
              <div>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>รูปภาพ ({selectedPickup.photos.length})</p>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '12px'
                }}>
                  {selectedPickup.photos.map((photo) => (
                    <div 
                      key={photo.id}
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '200px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        background: '#f3f4f6'
                      }}
                      onClick={() => setSelectedPhoto(photo.fileName)}
                    >
                      <img
                        src={`/uploads/${photo.fileName}`}
                        alt={`รูปที่ ${photo.id}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          e.currentTarget.parentElement!.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;flex-direction:column;height:100%;"><p style="font-size:48px;">📷</p><p style="font-size:12px;color:#6b7280;padding:0 8px;text-align:center;">ไม่สามารถโหลดรูปได้</p></div>'
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
            src={`/uploads/${selectedPhoto}`}
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
