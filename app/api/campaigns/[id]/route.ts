import { NextRequest, NextResponse } from 'next/server';
import { getCampaignFinancialSummary } from '@/lib/ledger';
import { getCampaignAllocations } from '@/lib/inventory';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const summary = await getCampaignFinancialSummary(params.id);
    if (!summary) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const allocations = await getCampaignAllocations(params.id);

    return NextResponse.json({
      success: true,
      campaign: summary,
      allocations,
    });
  } catch (error) {
    console.error('[CAMPAIGN DETAIL ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch campaign details' }, { status: 500 });
  }
}
