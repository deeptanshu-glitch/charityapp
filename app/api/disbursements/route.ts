import { NextRequest, NextResponse } from 'next/server';
import { authenticateRouteHandler } from '@/lib/rbac';
import { CreateDisbursementSchema } from '@/lib/validators';
import { createDisbursementRequest, getDisbursementRequests } from '@/lib/ledger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Only volunteer and admin can list disbursement requests
  const auth = await authenticateRouteHandler(request, ['volunteer', 'admin']);
  if ('response' in auth) {
    return auth.response;
  }

  const status = request.nextUrl.searchParams.get('status') || undefined;

  try {
    const requests = await getDisbursementRequests(status);
    return NextResponse.json({ success: true, requests });
  } catch (error) {
    console.error('[DISBURSEMENTS GET ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch disbursement requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Volunteers or Admins can submit disbursement requests
  const auth = await authenticateRouteHandler(request, ['volunteer', 'admin']);
  if ('response' in auth) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const parsed = CreateDisbursementSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { campaignId, amount, description } = parsed.data;

    const newRequest = await createDisbursementRequest({
      campaignId,
      amount,
      description,
      requestedBy: auth.user.userId,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Disbursement request submitted for administrative approval.',
        request: newRequest,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[CREATE DISBURSEMENT ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit disbursement request' },
      { status: 500 }
    );
  }
}
