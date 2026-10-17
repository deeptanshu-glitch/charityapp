import { NextRequest, NextResponse } from 'next/server';
import { CreateDonationSchema } from '@/lib/validators';
import { recordDonation } from '@/lib/ledger';
import { AUTH_COOKIE_NAME, verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateDonationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { campaignId, amount, description } = parsed.data;

    // Check optional authenticated donor session
    let donorId: string | null = null;
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        donorId = payload.userId;
      }
    }

    const entry = await recordDonation({
      campaignId,
      donorId,
      amount,
      description,
    });

    return NextResponse.json({
      success: true,
      message: 'Donation credited successfully into immutable ledger.',
      ledgerEntry: entry,
    });
  } catch (error: any) {
    console.error('[DONATION ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process donation' },
      { status: 500 }
    );
  }
}
