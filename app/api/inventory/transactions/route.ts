import { NextRequest, NextResponse } from 'next/server';
import { authenticateRouteHandler } from '@/lib/rbac';
import { getInventoryTransactions } from '@/lib/inventory';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await authenticateRouteHandler(request, ['volunteer', 'admin']);
  if ('response' in auth) {
    return auth.response;
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);

  try {
    const transactions = await getInventoryTransactions(limit);
    return NextResponse.json({ success: true, transactions });
  } catch (error) {
    console.error('[INVENTORY TRANSACTIONS FETCH ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory audit transactions' },
      { status: 500 }
    );
  }
}
