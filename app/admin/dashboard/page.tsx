// /app/admin/dashboard/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  totalCollections: number;
  totalDrivers: number;
  totalHospitals: number;
  todayCollections: number;
  collectedStatus: number;
  inTransitStatus: number;
  recentCollections: Array<{
    id: string;
    hospitalName: string;
    driverName: string;
    collectedAt: string;
    weight: number;
    status: string;
  }>;
}

const formatThaiDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear() + 543;
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  const monthNames = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  
  return `${day} ${monthNames[month - 1]} ${year} ${hours}:${minutes} น.`;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard');
      
      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      const data = await response.json();
      setStats(data.stats);
      setAdminName(data.adminName);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #7c3aed',
            borderRadius: '50%',
            margin: '0 auto',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ marginTop: '16px', color: '#6b7280' }}>กำลังโหลดข้อมูล...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
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
            <h1 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '4px'
            }}>
              🛡️ Admin Dashboard
            </h1>
            <p style={{ color: '#e9d5ff', fontSize: '14px' }}>
              ยินดีต้อนรับ, {adminName}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => router.push('/admin/drivers')}
              style={{
                padding: '10px 20px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
            >
              👷 จัดการพนักงาน
            </button>
            <button
              onClick={() => router.push('/admin/hospitals')}
              style={{
                padding: '10px 20px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
            >
              🏥 จัดการโรงพยาบาล
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: '10px 20px',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      <main style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '32px 16px'
      }}>
        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          <StatCard
            title="การเก็บขยะทั้งหมด"
            value={stats?.totalCollections || 0}
            icon="📊"
            color="#3b82f6"
          />
          <StatCard
            title="พนักงานทั้งหมด"
            value={stats?.totalDrivers || 0}
            icon="👷"
            color="#10b981"
          />
          <StatCard
            title="โรงพยาบาลทั้งหมด"
            value={stats?.totalHospitals || 0}
            icon="🏥"
            color="#7c3aed"
          />
          <StatCard
            title="เก็บวันนี้"
            value={stats?.todayCollections || 0}
            icon="📅"
            color="#f59e0b"
          />
        </div>

        {/* Status Summary */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            padding: '24px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '16px'
            }}>
              สถานะการเก็บขยะ
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <StatusBar
                label="จัดเก็บสำเร็จ"
                value={stats?.collectedStatus || 0}
                total={stats?.totalCollections || 0}
                color="#10b981"
              />
              <StatusBar
                label="นำส่งเตาเผา"
                value={stats?.inTransitStatus || 0}
                total={stats?.totalCollections || 0}
                color="#3b82f6"
              />
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            padding: '24px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '16px'
            }}>
              ข้อมูลสรุป
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>สถานะ COLLECTED:</span>
                <span style={{ fontWeight: '600', color: '#10b981', fontSize: '16px' }}>
                  {stats?.collectedStatus || 0} รายการ
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>สถานะ IN_TRANSIT:</span>
                <span style={{ fontWeight: '600', color: '#3b82f6', fontSize: '16px' }}>
                  {stats?.inTransitStatus || 0} รายการ
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid #e5e7eb',
                paddingTop: '12px',
                marginTop: '4px'
              }}>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>รวมทั้งหมด:</span>
                <span style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '18px' }}>
                  {stats?.totalCollections || 0} รายการ
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Collections */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '24px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '16px'
          }}>
            การเก็บขยะล่าสุด
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '13px'
                  }}>
                    โรงพยาบาล
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '13px'
                  }}>
                    พนักงาน
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '13px'
                  }}>
                    วันที่เก็บ
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '13px'
                  }}>
                    น้ำหนัก (กก.)
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '13px'
                  }}>
                    สถานะ
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentCollections && stats.recentCollections.length > 0 ? (
                  stats.recentCollections.map((collection, index) => (
                    <tr
                      key={collection.id}
                      style={{
                        borderBottom: '1px solid #e5e7eb',
                        background: index % 2 === 0 ? 'white' : '#f9fafb',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'white' : '#f9fafb'}
                    >
                      <td style={{
                        padding: '12px 16px',
                        fontSize: '14px',
                        color: '#1f2937'
                      }}>
                        {collection.hospitalName}
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        fontSize: '14px',
                        color: '#1f2937'
                      }}>
                        {collection.driverName}
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        fontSize: '14px',
                        color: '#1f2937'
                      }}>
                        {formatThaiDate(collection.collectedAt)}
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: '600',
                        fontSize: '16px',
                        color: '#10b981'
                      }}>
                        {collection.weight.toFixed(2)}
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        textAlign: 'center'
                      }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: collection.status === 'COLLECTED' ? '#d1fae5' : '#dbeafe',
                          color: collection.status === 'COLLECTED' ? '#065f46' : '#1e40af'
                        }}>
                          {collection.status === 'COLLECTED' ? 'จัดเก็บสำเร็จ' : 'นำส่งเตาเผา'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: '48px 16px',
                        textAlign: 'center',
                        color: '#9ca3af',
                        fontSize: '14px'
                      }}
                    >
                      ไม่มีข้อมูลการเก็บขยะ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: string;
  color: string;
}) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      padding: '24px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            marginBottom: '8px'
          }}>
            {title}
          </p>
          <p style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#1f2937'
          }}>
            {value}
          </p>
        </div>
        <div style={{
          width: '64px',
          height: '64px',
          background: color,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px'
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function StatusBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '14px',
        marginBottom: '8px'
      }}>
        <span style={{ color: '#6b7280' }}>{label}</span>
        <span style={{ fontWeight: '600', color: '#1f2937' }}>
          {value} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div style={{
        width: '100%',
        background: '#e5e7eb',
        borderRadius: '9999px',
        height: '8px',
        overflow: 'hidden'
      }}>
        <div
          style={{
            background: color,
            height: '100%',
            width: `${percentage}%`,
            transition: 'width 0.3s ease'
          }}
        />
      </div>
    </div>
  );
}
