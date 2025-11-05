// /app/api/pickup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const hospital_code = request.cookies.get('hospital_id')?.value;

    if (!hospital_code) {
      return NextResponse.json(
        { error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    const hospital = await prisma.hospital.findUnique({
      where: { code: hospital_code }
    });

    if (!hospital) {
      return NextResponse.json(
        { error: 'ไม่พบโรงพยาบาล' },
        { status: 404 }
      );
    }

    const pickups = await prisma.pickup.findMany({
      where: {
        hospitalId: hospital.id
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
        photos: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(pickups);
  } catch (error) {
    console.error('Get pickups error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}