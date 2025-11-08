// /app/api/admin/drivers/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// PUT - แก้ไขพนักงาน
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const { id } = await context.params;
    const { code, name, password, isActive } = await request.json();

    // Validate
    if (!name) {
      return NextResponse.json(
        { error: 'กรุณากรอกชื่อพนักงาน' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าพนักงานมีอยู่จริง
    const existingDriver = await prisma.driver.findUnique({
      where: { id },
    });

    if (!existingDriver) {
      return NextResponse.json(
        { error: 'ไม่พบพนักงาน' },
        { status: 404 }
      );
    }

    // เตรียมข้อมูลที่จะอัปเดต
    const updateData: any = {
      name,
      isActive: isActive !== undefined ? isActive : existingDriver.isActive,
    };

    // ถ้ามีการเปลี่ยนรหัสผ่าน
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    // อัปเดตพนักงาน
    const driver = await prisma.driver.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'แก้ไขพนักงานสำเร็จ',
      driver: {
        id: driver.id,
        code: driver.code,
        name: driver.name,
        isActive: driver.isActive,
      },
    });
  } catch (error) {
    console.error('Update driver error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - ลบพนักงาน
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const { id } = await context.params;

    // ตรวจสอบว่าพนักงานมีอยู่จริง
    const existingDriver = await prisma.driver.findUnique({
      where: { id },
      include: {
        _count: {
          select: { pickups: true },
        },
      },
    });

    if (!existingDriver) {
      return NextResponse.json(
        { error: 'ไม่พบพนักงาน' },
        { status: 404 }
      );
    }

    // ตรวจสอบว่ามีการเก็บขยะอยู่หรือไม่
    if (existingDriver._count.pickups > 0) {
      return NextResponse.json(
        { 
          error: `ไม่สามารถลบพนักงานได้ เนื่องจากมีประวัติการเก็บขยะ ${existingDriver._count.pickups} รายการ\nกรุณาใช้ฟังก์ชัน "ระงับ" แทน` 
        },
        { status: 400 }
      );
    }

    // ลบพนักงาน
    await prisma.driver.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'ลบพนักงานสำเร็จ',
    });
  } catch (error) {
    console.error('Delete driver error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
