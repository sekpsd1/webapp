// /app/api/driver/photo/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { unlink } from 'fs/promises';
import { join } from 'path';

const prisma = new PrismaClient();

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const driver_code = request.cookies.get('driver_id')?.value;

    if (!driver_code) {
      return NextResponse.json(
        { error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    const driver = await prisma.driver.findUnique({
      where: { code: driver_code }
    });

    if (!driver) {
      return NextResponse.json(
        { error: 'ไม่พบพนักงาน' },
        { status: 404 }
      );
    }

    // ค้นหารูปภาพ
    const photo = await prisma.pickupPhoto.findUnique({
      where: { id: params.id },
      include: {
        pickup: true
      }
    });

    if (!photo) {
      return NextResponse.json(
        { error: 'ไม่พบรูปภาพ' },
        { status: 404 }
      );
    }

    // ตรวจสอบสิทธิ์
    if (photo.pickup.driverId !== driver.id) {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์ลบรูปภาพนี้' },
        { status: 403 }
      );
    }

    // ลบไฟล์จาก disk
    try {
      const filePath = join(process.cwd(), 'public', 'uploads', photo.fileName);
      await unlink(filePath);
      console.log('File deleted:', filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
      // ไม่ throw error - ให้ลบ record ใน database ต่อไป
    }

    // ลบ record จาก database
    await prisma.pickupPhoto.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'ลบรูปภาพสำเร็จ'
    });
  } catch (error) {
    console.error('Delete photo error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบรูปภาพ: ' + (error as Error).message },
      { status: 500 }
    );
  }
}