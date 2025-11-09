// /app/api/hospital/dashboard/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // ตรวจสอบ cookie
    const hospitalId = request.cookies.get('hospital_id')?.value;

    if (!hospitalId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ดึงข้อมูล hospital
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      select: { id: true, name: true, code: true, isActive: true },
    });

    if (!hospital || !hospital.isActive) {
      return NextResponse.json(
        { error: 'Hospital not found or inactive' },
        { status: 401 }
      );
    }

    // ดึงข้อมูลการเก็บขยะทั้งหมดของโรงพยาบาลนี้
    const pickups = await prisma.pickup.findMany({
      where: { hospitalId: hospital.id },
      orderBy: { collectedAt: 'desc' },
      include: {
        driver: {
          select: { name: true, code: true },
        },
        photos: {
          select: { id: true, fileName: true },
        },
      },
    });

    // คำนวณสถิติ
    const stats = {
      totalPickups: pickups.length,
      collectedStatus: pickups.filter(p => p.status === 'COLLECTED').length,
      inTransitStatus: pickups.filter(p => p.status === 'IN_TRANSIT').length,
      totalWeight: pickups.reduce((sum, p) => sum + p.weightKg, 0),
      todayPickups: pickups.filter(p => {
        const today = new Date();
        const pickupDate = new Date(p.collectedAt);
        return pickupDate.toDateString() === today.toDateString();
      }).length,
    };

    return NextResponse.json({
      success: true,
      hospital: {
        name: hospital.name,
        code: hospital.code,
      },
      stats,
      pickups: pickups.map(pickup => ({
        id: pickup.id,
        driverName: pickup.driver.name,
        collectedAt: pickup.collectedAt.toISOString(),
        weightKg: pickup.weightKg,
        status: pickup.status,
        note: pickup.note,
        photos: pickup.photos,
      })),
    });
  } catch (error) {
    console.error('Hospital dashboard error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
