import { NextRequest, NextResponse } from 'next/server';
import { authenticateRouteHandler } from '@/lib/rbac';
import { TransferStockSchema } from '@/lib/validators';
import { transferStock, InsufficientStockError, StockNotFoundError } from '@/lib/inventory';

export async function POST(request: NextRequest) {
  // Defense in depth: Check volunteer or admin role
  const auth = await authenticateRouteHandler(request, ['volunteer', 'admin']);
  if ('response' in auth) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const parsed = TransferStockSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { itemId, fromWarehouseId, toWarehouseId, quantity, reason } = parsed.data;

    const transferResult = await transferStock({
      itemId,
      fromWarehouseId,
      toWarehouseId,
      quantity,
      userId: auth.user.userId,
      reason,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully transferred ${quantity} units.`,
      result: transferResult,
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

    if (error?.code === '23514') {
      return NextResponse.json(
        {
          error: 'Transaction aborted by database constraint: stock quantity cannot be negative.',
          code: 'CHECK_CONSTRAINT_VIOLATION',
        },
        { status: 400 }
      );
    }

    console.error('[TRANSFER ERROR]', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during inventory transfer.' },
      { status: 500 }
    );
  }
}
