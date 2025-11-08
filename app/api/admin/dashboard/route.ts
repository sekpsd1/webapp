// /app/api/admin/dashboard/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // ตรวจสอบ cookie
    const adminId = request.cookies.get('admin_id')?.value;

    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ดึงข้อมูล admin
  const admin = await prisma.admin.findUnique({
  where: { id: adminId },  // ← ไม่ต้อง parseInt เพราะ id เป็น String (UUID)
  select: { id: true, name: true, username: true, isActive: true },
});

    if (!admin || !admin.isActive) {
      return NextResponse.json(
        { error: 'Admin not found or inactive' },
        { status: 401 }
      );
    }

    // ดึงสถิติต่างๆ
    const [
      totalPickups,
      totalDrivers,
      totalHospitals,
      collectedStatus,
      inTransitStatus,
      todayPickups,
      recentPickups,
    ] = await Promise.all([
      // การเก็บขยะทั้งหมด
      prisma.pickup.count(),

      // พนักงานทั้งหมด (active only)
      prisma.driver.count({
        where: { isActive: true },
      }),

      // โรงพยาบาลทั้งหมด (active only)
      prisma.hospital.count({
        where: { isActive: true },
      }),

      // สถานะ COLLECTED
      prisma.pickup.count({
        where: { status: 'COLLECTED' },
      }),

      // สถานะ IN_TRANSIT
      prisma.pickup.count({
        where: { status: 'IN_TRANSIT' },
      }),

      // การเก็บขยะวันนี้ (Asia/Bangkok timezone)
      prisma.pickup.count({
        where: {
          collectedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),

      // การเก็บขยะล่าสุด 10 รายการ
      prisma.pickup.findMany({
        take: 10,
        orderBy: { collectedAt: 'desc' },
        include: {
          hospital: {
            select: { name: true },
          },
          driver: {
            select: { name: true },
          },
        },
      }),
    ]);

    // จัดรูปแบบข้อมูลการเก็บขยะล่าสุด
    const formattedRecentPickups = recentPickups.map((pickup) => ({
      id: pickup.id,
      hospitalName: pickup.hospital.name,
      driverName: pickup.driver.name,
      collectedAt: pickup.collectedAt.toISOString(),
      weight: pickup.weightKg,
      status: pickup.status,
    }));

    const stats = {
      totalCollections: totalPickups,
      totalDrivers,
      totalHospitals,
      todayCollections: todayPickups,
      collectedStatus,
      inTransitStatus,
      recentCollections: formattedRecentPickups,
    };

    return NextResponse.json({
      success: true,
      adminName: admin.name,
      stats,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
