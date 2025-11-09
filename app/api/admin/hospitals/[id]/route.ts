// /app/api/admin/hospitals/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// PUT - แก้ไขโรงพยาบาล
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

    // ตรวจสอบว่าโรงพยาบาลมีอยู่จริง
    const existingHospital = await prisma.hospital.findUnique({
      where: { id },
    });

    if (!existingHospital) {
      return NextResponse.json(
        { error: 'ไม่พบโรงพยาบาล' },
        { status: 404 }
      );
    }

    // เตรียมข้อมูลที่จะอัปเดต
    const updateData: any = {};

    // ถ้ามี name ให้อัปเดต
    if (name) {
      updateData.name = name;
    }

    // ถ้ามี isActive ให้อัปเดต
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    // ถ้ามีการเปลี่ยนรหัสผ่าน
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    // ตรวจสอบว่ามีอะไรจะอัปเดตไหม
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'ไม่มีข้อมูลที่จะอัปเดต' },
        { status: 400 }
      );
    }

    // อัปเดตโรงพยาบาล
    const hospital = await prisma.hospital.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'แก้ไขโรงพยาบาลสำเร็จ',
      hospital: {
        id: hospital.id,
        code: hospital.code,
        name: hospital.name,
        isActive: hospital.isActive,
      },
    });
  } catch (error) {
    console.error('Update hospital error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - ลบโรงพยาบาล
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

    // ตรวจสอบว่าโรงพยาบาลมีอยู่จริง
    const existingHospital = await prisma.hospital.findUnique({
      where: { id },
      include: {
        _count: {
          select: { pickups: true },
        },
      },
    });

    if (!existingHospital) {
      return NextResponse.json(
        { error: 'ไม่พบโรงพยาบาล' },
        { status: 404 }
      );
    }

    // ตรวจสอบว่ามีการเก็บขยะอยู่หรือไม่
    if (existingHospital._count.pickups > 0) {
      return NextResponse.json(
        { 
          error: `ไม่สามารถลบโรงพยาบาลได้ เนื่องจากมีประวัติการเก็บขยะ ${existingHospital._count.pickups} รายการ\nกรุณาใช้ฟังก์ชัน "ระงับ" แทน` 
        },
        { status: 400 }
      );
    }

    // ลบโรงพยาบาล
    await prisma.hospital.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'ลบโรงพยาบาลสำเร็จ',
    });
  } catch (error) {
    console.error('Delete hospital error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
