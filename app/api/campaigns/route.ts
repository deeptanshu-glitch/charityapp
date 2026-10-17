import { NextRequest, NextResponse } from 'next/server';
import { getAllCampaigns } from '@/lib/ledger';
import { authenticateRouteHandler } from '@/lib/rbac';
import { query } from '@/lib/db';
import { z } from 'zod';

const CreateCampaignSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().min(10),
  targetAmount: z.number().positive(),
  category: z.string().min(2).max(100),
});

export async function GET() {
  try {
    const campaigns = await getAllCampaigns();
    return NextResponse.json({ success: true, campaigns });
  } catch (error) {
    console.error('[CAMPAIGNS GET ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRouteHandler(request, ['admin']);
  if ('response' in auth) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const parsed = CreateCampaignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, description, targetAmount, category } = parsed.data;

    const result = await query(
      `INSERT INTO campaigns (title, description, target_amount, category)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, description, target_amount::text, current_funding::text, category, created_at::text`,
      [title, description, targetAmount, category]
    );

    return NextResponse.json({ success: true, campaign: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('[CREATE CAMPAIGN ERROR]', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}
