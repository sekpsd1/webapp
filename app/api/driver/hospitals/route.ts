// /app/api/driver/hospitals/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - ดึงรายการโรงพยาบาลที่เปิดใช้งาน
export async function GET(request: NextRequest) {
  try {
    // ตรวจสอบ cookie
    const driverId = request.cookies.get('driver_id')?.value;

    if (!driverId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ดึงโรงพยาบาลที่เปิดใช้งานเท่านั้น
    const hospitals = await prisma.hospital.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(hospitals);
  } catch (error) {
    console.error('Get hospitals error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
