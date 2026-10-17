import { NextRequest, NextResponse } from 'next/server';
import { authenticateRouteHandler } from '@/lib/rbac';
import { getInventoryOverview } from '@/lib/inventory';

export async function GET(request: NextRequest) {
  const auth = await authenticateRouteHandler(request, ['volunteer', 'admin', 'donor']);
  if ('response' in auth) {
    return auth.response;
  }

  try {
    const stock = await getInventoryOverview();
    return NextResponse.json({ success: true, stock });
  } catch (error) {
    console.error('[STOCK FETCH ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory stock levels' },
      { status: 500 }
    );
  }
}
