// /app/admin/hospitals/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Hospital {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    pickups: number;
  };
}

export default function AdminHospitalsPage() {
  const router = useRouter();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);
  
  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadHospitals();
  }, []);

  const loadHospitals = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/hospitals');
      
      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setHospitals(data.hospitals);
      }
    } catch (error) {
      console.error('Error loading hospitals:', error);
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingHospital(null);
    setCode('');
    setName('');
    setPassword('');
    setIsActive(true);
    setShowForm(true);
  };

  const handleEdit = (hospital: Hospital) => {
    setEditingHospital(hospital);
    setCode(hospital.code);
    setName(hospital.name);
    setPassword('');
    setIsActive(hospital.isActive);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code || !name) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (!editingHospital && !password) {
      alert('กรุณากรอกรหัสผ่าน');
      return;
    }

    setSubmitting(true);

    try {
      const url = editingHospital
        ? `/api/admin/hospitals/${editingHospital.id}`
        : '/api/admin/hospitals';
      
      const method = editingHospital ? 'PUT' : 'POST';

      const body: any = {
        code,
        name,
        isActive,
      };

      if (password) {
        body.password = password;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        alert(editingHospital ? 'แก้ไขโรงพยาบาลสำเร็จ' : 'เพิ่มโรงพยาบาลสำเร็จ');
        setShowForm(false);
        loadHospitals();
      } else {
        alert(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (hospital: Hospital) => {
    if (!confirm(`ต้องการลบโรงพยาบาล "${hospital.name}" หรือไม่?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/hospitals/${hospital.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        alert('ลบโรงพยาบาลสำเร็จ');
        loadHospitals();
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการลบ');
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการลบ');
    }
  };

  const handleToggleStatus = async (hospital: Hospital) => {
    try {
      const response = await fetch(`/api/admin/hospitals/${hospital.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: hospital.code,
          name: hospital.name,
          isActive: !hospital.isActive,
        }),
      });

      if (response.ok) {
        alert(`${hospital.isActive ? 'ระงับ' : 'เปิดใช้งาน'}โรงพยาบาลสำเร็จ`);
        loadHospitals();
      } else {
        alert('เกิดข้อผิดพลาด');
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาด');
    }
  };

  const handleResetPassword = async (hospital: Hospital) => {
    const newPassword = prompt(`ระบุรหัสผ่านใหม่สำหรับ "${hospital.name}":`);
    
    if (!newPassword) return;

    try {
      const response = await fetch(`/api/admin/hospitals/${hospital.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: hospital.code,
          name: hospital.name,
          password: newPassword,
          isActive: hospital.isActive,
        }),
      });

      if (response.ok) {
        alert('เปลี่ยนรหัสผ่านสำเร็จ');
      } else {
        alert('เกิดข้อผิดพลาด');
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาด');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        color: 'white'
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
              🏥 จัดการโรงพยาบาล
            </h1>
            <p style={{ color: '#d1fae5', fontSize: '14px' }}>
              จัดการข้อมูลโรงพยาบาล
            </p>
          </div>
          <button
            onClick={() => router.push('/admin/dashboard')}
            style={{
              padding: '10px 20px',
              background: 'white',
              color: '#10b981',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          >
            ← กลับ Dashboard
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 16px' }}>
        {/* Add Button */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={handleAdd}
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
              e.currentTarget.style.background = '#059669';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#10b981';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            + เพิ่มโรงพยาบาลใหม่
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '16px'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <div style={{
                padding: '24px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#1f2937'
                }}>
                  {editingHospital ? 'แก้ไขโรงพยาบาล' : 'เพิ่มโรงพยาบาลใหม่'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      รหัสโรงพยาบาล *
                    </label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                      placeholder="เช่น HOS001"
                      disabled={!!editingHospital}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px',
                        background: editingHospital ? '#f3f4f6' : 'white'
                      }}
                    />
                    {editingHospital && (
                      <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                        ไม่สามารถแก้ไขรหัสโรงพยาบาลได้
                      </p>
                    )}
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      ชื่อโรงพยาบาล *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="เช่น โรงพยาบาลกลาง"
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
                      รหัสผ่าน {editingHospital && '(เว้นว่างถ้าไม่ต้องการเปลี่ยน)'}
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required={!editingHospital}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      style={{
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer'
                      }}
                    />
                    <label
                      htmlFor="isActive"
                      style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        cursor: 'pointer'
                      }}
                    >
                      เปิดใช้งาน
                    </label>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginTop: '24px'
                }}>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: submitting ? '#9ca3af' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#e5e7eb',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    ยกเลิก
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Hospitals Table */}
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
        ) : hospitals.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            padding: '48px 32px',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>🏥</p>
            <p style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
              ยังไม่มีโรงพยาบาล
            </p>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>
              เริ่มต้นโดยการกดปุ่ม "+ เพิ่มโรงพยาบาลใหม่"
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
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#374151',
                      fontSize: '14px'
                    }}>
                      รหัส
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#374151',
                      fontSize: '14px'
                    }}>
                      ชื่อโรงพยาบาล
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: '#374151',
                      fontSize: '14px'
                    }}>
                      จำนวนการเก็บ
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: '#374151',
                      fontSize: '14px'
                    }}>
                      สถานะ
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: '#374151',
                      fontSize: '14px'
                    }}>
                      การจัดการ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {hospitals.map((hospital, index) => (
                    <tr
                      key={hospital.id}
                      style={{
                        borderBottom: '1px solid #e5e7eb',
                        background: index % 2 === 0 ? 'white' : '#f9fafb'
                      }}
                    >
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                        {hospital.code}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#1f2937' }}>
                        {hospital.name}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center', fontSize: '16px', fontWeight: '600', color: '#10b981' }}>
                        {hospital._count?.pickups || 0}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: hospital.isActive ? '#d1fae5' : '#fee2e2',
                          color: hospital.isActive ? '#065f46' : '#991b1b'
                        }}>
                          {hospital.isActive ? 'เปิดใช้งาน' : 'ระงับ'}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{
                          display: 'flex',
                          gap: '8px',
                          justifyContent: 'center',
                          flexWrap: 'wrap'
                        }}>
                          <button
                            onClick={() => handleEdit(hospital)}
                            style={{
                              padding: '6px 12px',
                              background: '#f59e0b',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            แก้ไข
                          </button>
                          <button
                            onClick={() => handleToggleStatus(hospital)}
                            style={{
                              padding: '6px 12px',
                              background: hospital.isActive ? '#ef4444' : '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            {hospital.isActive ? 'ระงับ' : 'เปิด'}
                          </button>
                          <button
                            onClick={() => handleResetPassword(hospital)}
                            style={{
                              padding: '6px 12px',
                              background: '#8b5cf6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            รหัสผ่าน
                          </button>
                          <button
                            onClick={() => handleDelete(hospital)}
                            style={{
                              padding: '6px 12px',
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
