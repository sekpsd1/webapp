// /lib/utils.ts

// ฟังก์ชันแปลงวันที่เป็นรูปแบบไทย
export function formatThaiDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
    'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
    'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ]
  
  const day = d.getDate()
  const month = thaiMonths[d.getMonth()]
  const year = d.getFullYear() + 543 // แปลงเป็น พ.ศ.
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  
  return `${day} ${month} ${year} เวลา ${hours}:${minutes} น.`
}

// ฟังก์ชันแปลงวันที่แบบสั้น
export function formatShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear() + 543
  
  return `${day}/${month}/${year}`
}

// ฟังก์ชันแปลงเวลา
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  
  return `${hours}:${minutes} น.`
}

// ฟังก์ชันตรวจสอบว่าเป็นวันนี้หรือไม่
export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear()
}

// ฟังก์ชันจัดรูปแบบน้ำหนัก
export function formatWeight(weight: number): string {
  return `${weight.toFixed(2)} กก.`
}

// ฟังก์ชันสร้าง URL รูปภาพ
export function getImageUrl(filename: string): string {
  if (!filename) return '/images/no-image.png'
  if (filename.startsWith('http')) return filename
  return `/uploads/${filename}`
}

// ฟังก์ชันตัดข้อความยาว
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// ฟังก์ชัน merge className สำหรับ Tailwind CSS
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}