// /app/api/driver/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { writeFile, mkdir, access, unlink } from 'fs/promises';
import { join } from 'path';
import { constants } from 'fs';

const prisma = new PrismaClient();

export async function PUT(
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

    // ตรวจสอบว่า pickup นี้เป็นของ driver คนนี้หรือไม่
    const existingPickup = await prisma.pickup.findUnique({
      where: { id: params.id }
    });

    if (!existingPickup) {
      return NextResponse.json(
        { error: 'ไม่พบรายการเก็บขยะ' },
        { status: 404 }
      );
    }

    if (existingPickup.driverId !== driver.id) {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์แก้ไขรายการนี้' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const hospital_code = formData.get('hospital_id') as string;
    const weight = formData.get('weight') as string;
    const collected_at = formData.get('collected_at') as string;
    const status = formData.get('status') as string;
    const note = formData.get('note') as string;
    const photos = formData.getAll('photos') as File[];

    if (!hospital_code || !weight || !collected_at || !status) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // ค้นหาโรงพยาบาลจาก code
    const hospital = await prisma.hospital.findUnique({
      where: { code: hospital_code }
    });

    if (!hospital) {
      return NextResponse.json(
        { error: 'ไม่พบโรงพยาบาล' },
        { status: 404 }
      );
    }

    // อัพเดทรายการเก็บขยะ
    const updatedPickup = await prisma.pickup.update({
      where: { id: params.id },
      data: {
        hospitalId: hospital.id,
        weightKg: parseFloat(weight),
        collectedAt: new Date(collected_at),
        status: status as any,
        note: note || null
      }
    });

    // อัพโหลดรูปภาพใหม่ (ถ้ามี)
    if (photos && photos.length > 0) {
      const uploadDir = join(process.cwd(), 'public', 'uploads');
      
      // สร้างโฟลเดอร์ครั้งเดียว
      try {
        await access(uploadDir, constants.W_OK);
        console.log('Upload directory exists and is writable');
      } catch {
        console.log('Creating upload directory...');
        await mkdir(uploadDir, { recursive: true });
        console.log('Upload directory created');
      }

      // Loop upload แต่ละรูป
      for (const photo of photos) {
        if (photo && photo.size > 0) {
          try {
            const bytes = await photo.arrayBuffer();
            const buffer = Buffer.from(bytes);
            
            const timestamp = Date.now();
            const cleanFileName = photo.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const fileName = `${timestamp}-${cleanFileName}`;
            const filePath = join(uploadDir, fileName);
            
            console.log('Writing file to:', filePath);
            await writeFile(filePath, buffer);
            console.log('File written successfully');

            // บันทึกข้อมูลรูปภาพลงฐานข้อมูล
            await prisma.pickupPhoto.create({
              data: {
                pickupId: updatedPickup.id,
                fileName: fileName,
                mimeType: photo.type,
                fileSize: photo.size
              }
            });

            console.log('Photo record saved to database');
            
            // หน่วงเวลาเล็กน้อยเพื่อให้ timestamp ไม่ซ้ำ
            await new Promise(resolve => setTimeout(resolve, 10));
          } catch (uploadError) {
            console.error('Photo upload error:', uploadError);
            // ไม่ throw error - ให้บันทึกรูปอื่นต่อไป
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      pickup: updatedPickup
    });
  } catch (error) {
    console.error('Update pickup error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการแก้ไข: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

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

    // ตรวจสอบว่า pickup นี้เป็นของ driver คนนี้หรือไม่
    const existingPickup = await prisma.pickup.findUnique({
      where: { id: params.id },
      include: { photos: true }
    });

    if (!existingPickup) {
      return NextResponse.json(
        { error: 'ไม่พบรายการเก็บขยะ' },
        { status: 404 }
      );
    }

    if (existingPickup.driverId !== driver.id) {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์ลบรายการนี้' },
        { status: 403 }
      );
    }

    // ลบไฟล์รูปภาพจาก disk
    for (const photo of existingPickup.photos) {
      try {
        const filePath = join(process.cwd(), 'public', 'uploads', photo.fileName);
        await unlink(filePath);
        console.log('File deleted:', filePath);
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }

    // ลบรายการ (cascade delete ใน schema จะลบ photos ใน database)
    await prisma.pickup.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'ลบรายการสำเร็จ'
    });
  } catch (error) {
    console.error('Delete pickup error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบ: ' + (error as Error).message },
      { status: 500 }
    );
  }
}