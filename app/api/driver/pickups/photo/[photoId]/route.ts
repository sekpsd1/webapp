// /app/api/driver/pickups/photo/[photoId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'
import { unlink } from 'fs/promises'
import { join } from 'path'

const prisma = new PrismaClient()

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const cookieStore = await cookies()
    const driver_code = cookieStore.get('driver_id')?.value

    if (!driver_code) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 })
    }

    const driver = await prisma.driver.findUnique({
      where: { code: driver_code }
    })

    if (!driver) {
      return NextResponse.json({ error: 'ไม่พบพนักงาน' }, { status: 401 })
    }

    const { photoId } = await params

    const photo = await prisma.pickupPhoto.findUnique({
      where: { id: photoId }
    })

    if (!photo) {
      return NextResponse.json({ error: 'ไม่พบรูปภาพ' }, { status: 404 })
    }

    // ลบไฟล์จาก disk
    try {
      const filePath = join(process.cwd(), 'public', 'uploads', photo.fileName)
      await unlink(filePath)
    } catch (error) {
      console.error('Error deleting file:', error)
    }

    // ลบจาก database
    await prisma.pickupPhoto.delete({
      where: { id: photoId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting photo:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
