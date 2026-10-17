import { NextRequest, NextResponse } from 'next/server';
import { getCampaignLedgerWithRunningBalance } from '@/lib/ledger';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ledger = await getCampaignLedgerWithRunningBalance(params.id);
    return NextResponse.json({ success: true, ledger });
  } catch (error) {
    console.error('[CAMPAIGN LEDGER ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch campaign ledger' }, { status: 500 });
  }
}
