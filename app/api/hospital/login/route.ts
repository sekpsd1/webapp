// /app/api/hospital/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { hospital_code, password } = await request.json();

    if (!hospital_code || !password) {
      return NextResponse.json(
        { error: 'กรุณากรอกรหัสโรงพยาบาลและรหัสผ่าน' },
        { status: 400 }
      );
    }

    const hospital = await prisma.hospital.findUnique({
      where: { code: hospital_code }
    });

    if (!hospital) {
      return NextResponse.json(
        { error: 'ไม่พบรหัสโรงพยาบาลนี้' },
        { status: 401 }
      );
    }

    // ตรวจสอบว่า hospital.id มีค่าหรือไม่
    console.log('Hospital ID:', hospital.id, 'Type:', typeof hospital.id);

    const response = NextResponse.json({
      success: true,
      hospital: {
        id: hospital.id,
        code: hospital.code,
        name: hospital.name
      }
    });

    // ใช้ hospital.code แทน hospital.id ชั่วคราว
    response.cookies.set('hospital_id', hospital.code, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ: ' + (error as Error).message },
      { status: 500 }
    );
  }
}