// /app/api/hospital/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { code, password } = await request.json();

    console.log('Hospital login attempt:', { code });

    // Validate input
    if (!code || !password) {
      return NextResponse.json(
        { error: 'กรุณากรอกรหัสและรหัสผ่าน' },
        { status: 400 }
      );
    }

    // ค้นหา hospital
    const hospital = await prisma.hospital.findUnique({
      where: { code },
      select: {
        id: true,
        code: true,
        name: true,
        passwordHash: true,
        isActive: true,
      },
    });

    console.log('Hospital found:', hospital ? 'Yes' : 'No');

    if (!hospital) {
      return NextResponse.json(
        { error: 'รหัสหรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    // ตรวจสอบว่า hospital เปิดใช้งานหรือไม่
    if (!hospital.isActive) {
      return NextResponse.json(
        { error: 'บัญชีนี้ถูกระงับการใช้งาน' },
        { status: 403 }
      );
    }

    // ตรวจสอบรหัสผ่าน
    const isPasswordValid = await bcrypt.compare(password, hospital.passwordHash);

    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'รหัสหรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    // สร้าง response พร้อม cookie
    const response = NextResponse.json({
      success: true,
      hospital: {
        id: hospital.id,
        code: hospital.code,
        name: hospital.name,
      },
    });

    // ตั้ง cookie
    response.cookies.set('hospital_id', hospital.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 วัน
      path: '/',
    });

    console.log('Login successful for:', hospital.code);

    return response;
  } catch (error) {
    console.error('Hospital login error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
