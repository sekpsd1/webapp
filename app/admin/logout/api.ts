// /app/admin/logout/api.ts

import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'ออกจากระบบสำเร็จ',
  });

  // ลบ cookie
  response.cookies.delete('admin_id');

  return response;
}
