// /app/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/hospital/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, password }),
      })

      const data = await response.json()

      if (data.success) {
        // เก็บข้อมูลใน localStorage
        localStorage.setItem('hospital', JSON.stringify(data.hospital))
        
        // ไปหน้า Dashboard
        router.push('/hospital/dashboard')
      } else {
        setError(data.message || 'เข้าสู่ระบบไม่สำเร็จ')
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ระบบจัดเก็บขยะโรงพยาบาล
          </h1>
          <p className="text-gray-600">เข้าสู่ระบบสำหรับโรงพยาบาล</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* รหัสโรงพยาบาล */}
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              รหัสโรงพยาบาล
            </label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
              placeholder="กรอกรหัสโรงพยาบาล"
              required
              disabled={loading}
            />
          </div>

          {/* รหัสผ่าน */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              รหัสผ่าน
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
              placeholder="กรอกรหัสผ่าน"
              required
              disabled={loading}
            />
          </div>

          {/* ปุ่ม Login */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-8 text-center space-y-2">
          <a 
            href="/driver" 
            className="block text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            เข้าสู่ระบบสำหรับพนักงานเก็บขยะ →
          </a>
        </div>
      </div>
    </div>
  )
}