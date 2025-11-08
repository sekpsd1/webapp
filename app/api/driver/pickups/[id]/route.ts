// /app/api/driver/pickups/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'

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
    const body = await request.json()

    const { weightKg, status, note, collectedAt } = body

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
        status,
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

    return NextResponse.json(updatedPickup)
  } catch (error) {
    console.error('Error updating pickup:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
