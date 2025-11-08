// /app/api/admin/drivers/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// GET - ดึงรายการพนักงานทั้งหมด
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

    // ตรวจสอบ admin
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { id: true, isActive: true },
    });

    if (!admin || !admin.isActive) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ดึงข้อมูลพนักงานทั้งหมด พร้อมนับจำนวนการเก็บขยะ
    const drivers = await prisma.driver.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { pickups: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      drivers,
    });
  } catch (error) {
    console.error('Get drivers error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - เพิ่มพนักงานใหม่
export async function POST(request: NextRequest) {
  try {
    // ตรวจสอบ cookie
    const adminId = request.cookies.get('admin_id')?.value;

    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ตรวจสอบ admin
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { id: true, isActive: true },
    });

    if (!admin || !admin.isActive) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { code, name, password, isActive } = await request.json();

    // Validate
    if (!code || !name || !password) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // ตรวจสอบรหัสซ้ำ
    const existingDriver = await prisma.driver.findUnique({
      where: { code },
    });

    if (existingDriver) {
      return NextResponse.json(
        { error: 'รหัสพนักงานนี้มีอยู่แล้ว' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // สร้างพนักงานใหม่
    const driver = await prisma.driver.create({
      data: {
        code,
        name,
        passwordHash,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'เพิ่มพนักงานสำเร็จ',
      driver: {
        id: driver.id,
        code: driver.code,
        name: driver.name,
        isActive: driver.isActive,
      },
    });
  } catch (error) {
    console.error('Create driver error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
