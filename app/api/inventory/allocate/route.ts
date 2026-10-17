import { NextRequest, NextResponse } from 'next/server';
import { authenticateRouteHandler } from '@/lib/rbac';
import { AllocateStockSchema } from '@/lib/validators';
import { allocateStock, InsufficientStockError, StockNotFoundError } from '@/lib/inventory';

export async function POST(request: NextRequest) {
  // Defense in depth: Check volunteer or admin role
  const auth = await authenticateRouteHandler(request, ['volunteer', 'admin']);
  if ('response' in auth) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const parsed = AllocateStockSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { campaignId, itemId, warehouseId, quantity, notes } = parsed.data;

    const allocation = await allocateStock({
      campaignId,
      itemId,
      warehouseId,
      quantity,
      userId: auth.user.userId,
      notes,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully allocated ${quantity} units to campaign.`,
      allocation,
    });
  } catch (error: any) {
    if (error instanceof InsufficientStockError) {
      return NextResponse.json(
        {
          error: error.message,
          code: 'INSUFFICIENT_STOCK',
          available: error.available,
          requested: error.requested,
        },
        { status: 400 }
      );
    }

    if (error instanceof StockNotFoundError) {
      return NextResponse.json(
        { error: error.message, code: 'STOCK_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check Postgres check constraint violation (code 23514)
    if (error?.code === '23514') {
      return NextResponse.json(
        {
          error: 'Transaction aborted by database constraint: stock quantity cannot be negative.',
          code: 'CHECK_CONSTRAINT_VIOLATION',
        },
        { status: 400 }
      );
    }

    console.error('[ALLOCATION ERROR]', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during stock allocation.' },
      { status: 500 }
    );
  }
}
