import { NextRequest, NextResponse } from 'next/server';
import { authenticateRouteHandler } from '@/lib/rbac';
import { getDonorContributions } from '@/lib/ledger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Allow any authenticated user to view their own contributions
  const auth = await authenticateRouteHandler(request, ['donor', 'volunteer', 'admin']);
  if ('response' in auth) {
    return auth.response;
  }

  try {
    const receipts = await getDonorContributions(auth.user.userId);
    return NextResponse.json({ success: true, receipts });
  } catch (error) {
    console.error('[DONOR RECEIPTS ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch donor contribution history' },
      { status: 500 }
    );
  }
}
