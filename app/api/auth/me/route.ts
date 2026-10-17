import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  // Refresh user data from DB
  const userResult = await query(
    'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
    [payload.userId]
  );

  if (userResult.rowCount === 0) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: userResult.rows[0],
  });
}
