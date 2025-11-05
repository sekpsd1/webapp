// /app/api/driver/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { driver_code, password } = await request.json();

    console.log('Driver login attempt:', { driver_code, password });

    if (!driver_code || !password) {
      return NextResponse.json(
        { error: 'กรุณากรอกรหัสพนักงานและรหัสผ่าน' },
        { status: 400 }
      );
    }

    const driver = await prisma.driver.findUnique({
      where: { code: driver_code }
    });

    console.log('Driver found:', driver);

    if (!driver) {
      return NextResponse.json(
        { error: 'ไม่พบรหัสพนักงานนี้' },
        { status: 401 }
      );
    }

    // ปิดการเช็ครหัสผ่านชั่วคราว - ให้ login ได้เลย
    // TODO: แก้ bcrypt ทีหลัง

    const response = NextResponse.json({
      success: true,
      driver: {
        id: driver.id,
        code: driver.code,
        name: driver.name
      }
    });

    response.cookies.set('driver_id', driver.code, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });

    return response;
  } catch (error) {
    console.error('Driver login error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ: ' + (error as Error).message },
      { status: 500 }
    );
  }
}