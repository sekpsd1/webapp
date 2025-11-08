// /app/api/driver/pickups/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'
import { writeFile, mkdir, access } from 'fs/promises'
import { join } from 'path'
import { constants } from 'fs'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params

    const pickup = await prisma.pickup.findUnique({
      where: { id },
      include: {
        hospital: {
          select: {
            name: true,
            code: true
          }
        },
        driver: {
          select: {
            name: true
          }
        },
        photos: {
          select: {
            id: true,
            fileName: true
          }
        }
      }
    })

    if (!pickup) {
      return NextResponse.json({ error: 'Pickup not found' }, { status: 404 })
    }

    return NextResponse.json(pickup)
  } catch (error) {
    console.error('Error fetching pickup:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params
    const formData = await request.formData()

    const weightKg = formData.get('weightKg') as string
    const status = formData.get('status') as string
    const note = formData.get('note') as string
    const collectedAt = formData.get('collectedAt') as string
    const photos = formData.getAll('photos') as File[]

    // Validate required fields
    if (!weightKg || !status || !collectedAt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = [
      'SCHEDULED',
      'IN_PROGRESS',
      'DONE',
      'COLLECTED',
      'EN_ROUTE',
      'INCINERATED',
      'CANCELLED'
    ]

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Update pickup
   const updatedPickup = await prisma.pickup.update({
  where: { id },
  data: {
    weightKg: parseFloat(weightKg),
    status: status as any,  // ← เปลี่ยนบรรทัดนี้
    note: note || null,
    collectedAt: new Date(collectedAt)
  },
  include: {
    hospital: {
      select: {
        name: true,
        code: true
      }
    },
    driver: {
      select: {
        name: true
      }
    },
    photos: {
      select: {
        id: true,
        fileName: true
      }
    }
  }
})
    // อัพโหลดรูปภาพใหม่ (ถ้ามี)
    if (photos && photos.length > 0) {
      const uploadDir = join(process.cwd(), 'public', 'uploads')
      
      // สร้างโฟลเดอร์ครั้งเดียว
      try {
        await access(uploadDir, constants.W_OK)
      } catch {
        await mkdir(uploadDir, { recursive: true })
      }

      // Loop upload แต่ละรูป
      for (const photo of photos) {
        if (photo && photo.size > 0) {
          try {
            const bytes = await photo.arrayBuffer()
            const buffer = Buffer.from(bytes)
            
            const timestamp = Date.now()
            const cleanFileName = photo.name.replace(/[^a-zA-Z0-9.-]/g, '_')
            const fileName = `${timestamp}-${cleanFileName}`
            const filePath = join(uploadDir, fileName)
            
            await writeFile(filePath, buffer)

            // บันทึกข้อมูลรูปภาพลงฐานข้อมูล
            await prisma.pickupPhoto.create({
              data: {
                pickupId: id,
                fileName: fileName,
                mimeType: photo.type,
                fileSize: photo.size
              }
            })
            
            // หน่วงเวลาเล็กน้อยเพื่อให้ timestamp ไม่ซ้ำ
            await new Promise(resolve => setTimeout(resolve, 10))
          } catch (uploadError) {
            console.error('Photo upload error:', uploadError)
          }
        }
      }
    }

    return NextResponse.json(updatedPickup)
  } catch (error) {
    console.error('Error updating pickup:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
