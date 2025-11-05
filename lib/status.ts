// /lib/status.ts

// สถานะของการเก็บขยะ
export const PickupStatus = {
  PENDING: 'PENDING',       // รอพนักงานรับงาน
  ACCEPTED: 'ACCEPTED',     // พนักงานรับงานแล้ว
  COLLECTED: 'COLLECTED',   // เก็บขยะเรียบร้อยแล้ว
  CANCELLED: 'CANCELLED'    // ยกเลิก
} as const

export type PickupStatusType = typeof PickupStatus[keyof typeof PickupStatus]

// ฟังก์ชันแปลงสถานะเป็นภาษาไทย
export function getStatusText(status: PickupStatusType): string {
  const statusMap: Record<PickupStatusType, string> = {
    PENDING: 'รอพนักงานรับงาน',
    ACCEPTED: 'พนักงานรับงานแล้ว',
    COLLECTED: 'เก็บขยะเรียบร้อยแล้ว',
    CANCELLED: 'ยกเลิก'
  }
  return statusMap[status] || 'ไม่ทราบสถานะ'
}

// ฟังก์ชันเลือกสีสถานะ (สำหรับแสดงผล)
export function getStatusColor(status: PickupStatusType): string {
  const colorMap: Record<PickupStatusType, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    ACCEPTED: 'bg-blue-100 text-blue-800',
    COLLECTED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800'
  }
  return colorMap[status] || 'bg-gray-100 text-gray-800'
}

// ประเภทขยะ
export const WasteTypes = [
  { value: 'INFECTIOUS', label: 'ขยะติดเชื้อ', color: 'text-red-600' },
  { value: 'HAZARDOUS', label: 'ขยะอันตราย', color: 'text-orange-600' },
  { value: 'GENERAL', label: 'ขยะทั่วไป', color: 'text-gray-600' },
  { value: 'RECYCLABLE', label: 'ขยะรีไซเคิล', color: 'text-green-600' }
] as const

export type WasteType = typeof WasteTypes[number]['value']

// ฟังก์ชันหาชื่อประเภทขยะ
export function getWasteTypeLabel(type: string): string {
  const wasteType = WasteTypes.find(wt => wt.value === type)
  return wasteType?.label || type
}