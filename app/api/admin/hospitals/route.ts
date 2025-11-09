// /app/api/admin/hospitals/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// GET - ดึงรายการโรงพยาบาลทั้งหมด
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

    // ดึงข้อมูลโรงพยาบาลทั้งหมด พร้อมนับจำนวนการเก็บขยะ
    const hospitals = await prisma.hospital.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { pickups: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      hospitals,
    });
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

// POST - เพิ่มโรงพยาบาลใหม่
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
    const existingHospital = await prisma.hospital.findUnique({
      where: { code },
    });

    if (existingHospital) {
      return NextResponse.json(
        { error: 'รหัสโรงพยาบาลนี้มีอยู่แล้ว' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // สร้างโรงพยาบาลใหม่
    const hospital = await prisma.hospital.create({
      data: {
        code,
        name,
        passwordHash,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'เพิ่มโรงพยาบาลสำเร็จ',
      hospital: {
        id: hospital.id,
        code: hospital.code,
        name: hospital.name,
        isActive: hospital.isActive,
      },
    });
  } catch (error) {
    console.error('Create hospital error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
