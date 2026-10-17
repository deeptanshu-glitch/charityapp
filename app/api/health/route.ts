import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const start = Date.now();
    const result = await query('SELECT 1 as alive');
    const latencyMs = Date.now() - start;

    if (result.rows[0]?.alive === 1) {
      return NextResponse.json({
        status: 'healthy',
        database: 'connected',
        latencyMs,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { status: 'unhealthy', database: 'unexpected_response' },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('[HEALTHCHECK FAILURE]', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message || 'Database connection error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
