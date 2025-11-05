// /create-hospital.js
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createHospital() {
  try {
    // ข้อมูลโรงพยาบาลทดสอบ
    const hospitalData = {
      name: 'โรงพยาบาลทดสอบ',
      code: 'TEST001',
      password: '123456',
      address: '123 ถนนทดสอบ ตำบลทดสอบ อำเภอเมือง จังหวัดระยอง 21000',
      phone: '038-123-456'
    }

    // เข้ารหัสรหัสผ่าน
    const hashedPassword = await bcrypt.hash(hospitalData.password, 10)

    // สร้างโรงพยาบาล
    const hospital = await prisma.hospital.create({
      data: {
        name: hospitalData.name,
        code: hospitalData.code,
        password: hashedPassword,
        address: hospitalData.address,
        phone: hospitalData.phone
      }
    })

    console.log('✅ สร้างโรงพยาบาลสำเร็จ!')
    console.log('-----------------------------------')
    console.log('ชื่อ:', hospital.name)
    console.log('รหัส:', hospital.code)
    console.log('รหัสผ่าน:', hospitalData.password)
    console.log('ที่อยู่:', hospital.address)
    console.log('เบอร์โทร:', hospital.phone)
    console.log('-----------------------------------')
    console.log('ใช้ข้อมูลนี้ในการ Login ทดสอบระบบ')

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createHospital()