// /lib/hospital-auth.ts
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export interface HospitalSession {
  id: string
  name: string
  code: string
}

export async function loginHospital(code: string, password: string) {
  try {
    const hospital = await prisma.hospital.findUnique({
      where: { code }
    })

    if (!hospital) {
      return { success: false, message: 'ไม่พบรหัสโรงพยาบาล' }
    }

    const isValidPassword = await bcrypt.compare(password, hospital.passwordHash)
    
    if (!isValidPassword) {
      return { success: false, message: 'รหัสผ่านไม่ถูกต้อง' }
    }

    return {
      success: true,
      hospital: {
        id: hospital.id,
        name: hospital.name,
        code: hospital.code
      }
    }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, message: 'เกิดข้อผิดพลาดในระบบ' }
  }
}

export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10)
}

export async function createHospital(name: string, code: string, password: string) {
  try {
    const hashedPassword = await hashPassword(password)
    
    const hospital = await prisma.hospital.create({
      data: {
        name,
        code,
        passwordHash: hashedPassword
      }
    })
    return { success: true, hospital }
  } catch (error) {
    console.error('Create hospital error:', error)
    return { success: false, message: 'เกิดข้อผิดพลาดในการสร้างโรงพยาบาล' }
  }
}