import { NextRequest, NextResponse } from 'next/server';
import { authenticateRouteHandler } from '@/lib/rbac';
import { reviewDisbursementRequest } from '@/lib/ledger';
import { z } from 'zod';

const ReviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reviewNotes: z.string().max(500).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Strictly enforce admin role
  const auth = await authenticateRouteHandler(request, ['admin']);
  if ('response' in auth) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const parsed = ReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { status, reviewNotes } = parsed.data;

    const reviewed = await reviewDisbursementRequest({
      requestId: params.id,
      status,
      reviewedBy: auth.user.userId,
      reviewNotes,
    });

    return NextResponse.json({
      success: true,
      message: `Disbursement request has been ${status}.`,
      request: reviewed,
    });
  } catch (error: any) {
    console.error('[REVIEW DISBURSEMENT ERROR]', error);

    // Check Postgres check constraint violation (code 23514) on campaigns.current_funding >= 0
    if (error?.code === '23514') {
      return NextResponse.json(
        {
          error: 'Transaction aborted by database: Campaign has insufficient funds to cover this debit.',
          code: 'INSUFFICIENT_FUNDS_CONSTRAINT',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to review disbursement request' },
      { status: 400 }
    );
  }
}
