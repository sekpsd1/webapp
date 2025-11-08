// /app/admin/dashboard/api.ts

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
      where: { id: parseInt(adminId) },
      select: { id: true, name: true, username: true },
    });

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 401 }
      );
    }

    // ดึงสถิติต่างๆ
    const [
      totalCollections,
      totalDrivers,
      totalHospitals,
      collectedStatus,
      inTransitStatus,
      todayCollections,
      recentCollections,
    ] = await Promise.all([
      // การเก็บขยะทั้งหมด
      prisma.wasteCollection.count(),

      // พนักงานทั้งหมด
      prisma.driver.count(),

      // โรงพยาบาลทั้งหมด
      prisma.hospital.count(),

      // สถานะ COLLECTED
      prisma.wasteCollection.count({
        where: { status: 'COLLECTED' },
      }),

      // สถานะ IN_TRANSIT
      prisma.wasteCollection.count({
        where: { status: 'IN_TRANSIT' },
      }),

      // การเก็บขยะวันนี้ (Asia/Bangkok timezone)
      prisma.wasteCollection.count({
        where: {
          collectionDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),

      // การเก็บขยะล่าสุด 10 รายการ
      prisma.wasteCollection.findMany({
        take: 10,
        orderBy: { collectionDate: 'desc' },
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
    const formattedRecentCollections = recentCollections.map((collection) => ({
      id: collection.id,
      hospitalName: collection.hospital.name,
      driverName: collection.driver.name,
      collectionDate: collection.collectionDate.toISOString(),
      weight: collection.weight,
      status: collection.status,
    }));

    const stats = {
      totalCollections,
      totalDrivers,
      totalHospitals,
      todayCollections,
      collectedStatus,
      inTransitStatus,
      recentCollections: formattedRecentCollections,
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
  }
}
