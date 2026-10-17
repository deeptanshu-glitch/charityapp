import { query, withTransaction } from './db';

export interface CampaignLedgerRow {
  id: string;
  campaign_id: string;
  donor_id: string | null;
  donor_name: string | null;
  amount: string; // Postgres numeric returns as string to avoid precision loss
  type: 'credit' | 'debit';
  description: string;
  created_at: string;
  running_balance: string; // Calculated natively in SQL via window function
}

export interface CampaignSummary {
  id: string;
  title: string;
  description: string;
  target_amount: string;
  current_funding: string;
  category: string;
  image_url: string | null;
  created_at: string;
  total_in: string;
  total_out: string;
  net_balance: string;
  donor_count: number;
}

/**
 * FEATURE 2: Transparent Donation Ledger with SQL Window Function
 * Calculates running balance in raw SQL using SUM(...) OVER (PARTITION BY ... ORDER BY ...)
 * Indexes on (campaign_id, created_at, id) guarantee optimal execution without JavaScript in-memory loops.
 */
export async function getCampaignLedgerWithRunningBalance(
  campaignId: string
): Promise<CampaignLedgerRow[]> {
  const result = await query<CampaignLedgerRow>(
    `
    SELECT 
      dl.id,
      dl.campaign_id,
      dl.donor_id,
      COALESCE(u.name, 'Anonymous Donor') AS donor_name,
      dl.amount::text,
      dl.type,
      dl.description,
      dl.created_at::text,
      SUM(CASE WHEN dl.type = 'credit' THEN dl.amount ELSE -dl.amount END) 
        OVER (
          PARTITION BY dl.campaign_id 
          ORDER BY dl.created_at ASC, dl.id ASC
        )::text AS running_balance
    FROM donation_ledger dl
    LEFT JOIN users u ON dl.donor_id = u.id
    WHERE dl.campaign_id = $1
    ORDER BY dl.created_at DESC, dl.id DESC
  `,
    [campaignId]
  );

  return result.rows;
}

/**
 * Fetch campaign details and financial aggregates.
 */
export async function getCampaignFinancialSummary(campaignId: string): Promise<CampaignSummary | null> {
  const result = await query(
    `
    SELECT 
      c.id,
      c.title,
      c.description,
      c.target_amount::text,
      c.current_funding::text,
      c.category,
      c.image_url,
      c.created_at::text,
      COALESCE(SUM(CASE WHEN dl.type = 'credit' THEN dl.amount ELSE 0 END), 0)::text AS total_in,
      COALESCE(SUM(CASE WHEN dl.type = 'debit' THEN dl.amount ELSE 0 END), 0)::text AS total_out,
      c.current_funding::text AS net_balance,
      COUNT(DISTINCT dl.donor_id) AS donor_count
    FROM campaigns c
    LEFT JOIN donation_ledger dl ON c.id = dl.campaign_id
    WHERE c.id = $1
    GROUP BY c.id
  `,
    [campaignId]
  );

  if (result.rowCount === 0) return null;
  return result.rows[0];
}

/**
 * Fetch all campaigns with high-level funding progress.
 */
export async function getAllCampaigns() {
  const result = await query(`
    SELECT 
      c.id,
      c.title,
      c.description,
      c.target_amount::text,
      c.current_funding::text,
      c.category,
      c.image_url,
      c.created_at::text,
      ROUND((c.current_funding / NULLIF(c.target_amount, 0)) * 100, 1) AS percent_funded,
      COUNT(DISTINCT a.id) AS allocation_count
    FROM campaigns c
    LEFT JOIN allocations a ON c.id = a.campaign_id
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `);
  return result.rows;
}

/**
 * Record a new incoming donation (credit) into the immutable ledger.
 * The DB trigger automatically updates campaigns.current_funding.
 */
export async function recordDonation(params: {
  campaignId: string;
  donorId?: string | null;
  amount: number;
  description: string;
}) {
  const { campaignId, donorId, amount, description } = params;

  if (amount <= 0) {
    throw new Error('Donation amount must be greater than zero.');
  }

  const result = await query(
    `
    INSERT INTO donation_ledger (campaign_id, donor_id, amount, type, description)
    VALUES ($1, $2, $3, 'credit', $4)
    RETURNING id, campaign_id, donor_id, amount::text, type, description, created_at::text
  `,
    [campaignId, donorId || null, amount, description]
  );

  return result.rows[0];
}

/**
 * Fetch all donations by a specific donor (for receipts & donor dashboard).
 */
export async function getDonorContributions(donorId: string) {
  const result = await query(
    `
    SELECT 
      dl.id,
      dl.campaign_id,
      c.title AS campaign_title,
      c.category AS campaign_category,
      dl.amount::text,
      dl.description,
      dl.created_at::text,
      SUM(dl.amount) OVER (ORDER BY dl.created_at ASC, dl.id ASC)::text AS cumulative_given
    FROM donation_ledger dl
    JOIN campaigns c ON dl.campaign_id = c.id
    WHERE dl.donor_id = $1 AND dl.type = 'credit'
    ORDER BY dl.created_at DESC
  `,
    [donorId]
  );

  return result.rows;
}

/**
 * Submit a financial debit disbursement request (volunteer or admin).
 */
export async function createDisbursementRequest(params: {
  campaignId: string;
  amount: number;
  description: string;
  requestedBy: string;
}) {
  const { campaignId, amount, description, requestedBy } = params;

  const result = await query(
    `
    INSERT INTO disbursement_requests (campaign_id, amount, description, status, requested_by)
    VALUES ($1, $2, $3, 'pending', $4)
    RETURNING id, campaign_id, amount::text, description, status, requested_by, created_at::text
  `,
    [campaignId, amount, description, requestedBy]
  );

  return result.rows[0];
}

/**
 * Fetch disbursement requests with campaign and reviewer details.
 */
export async function getDisbursementRequests(statusFilter?: string) {
  let sql = `
    SELECT 
      dr.id,
      dr.campaign_id,
      c.title AS campaign_title,
      c.current_funding::text AS campaign_current_funding,
      dr.amount::text,
      dr.description,
      dr.status,
      dr.requested_by,
      u1.name AS requested_by_name,
      dr.reviewed_by,
      u2.name AS reviewed_by_name,
      dr.review_notes,
      dr.created_at::text,
      dr.updated_at::text
    FROM disbursement_requests dr
    JOIN campaigns c ON dr.campaign_id = c.id
    JOIN users u1 ON dr.requested_by = u1.id
    LEFT JOIN users u2 ON dr.reviewed_by = u2.id
  `;

  const params: any[] = [];
  if (statusFilter && statusFilter !== 'all') {
    sql += ' WHERE dr.status = $1';
    params.push(statusFilter);
  }

  sql += ' ORDER BY dr.created_at DESC';

  const result = await query(sql, params);
  return result.rows;
}

/**
 * FEATURE 3 Admin Approval Flow:
 * Approves or rejects a disbursement request inside an atomic database transaction.
 * When approved, appends a 'debit' entry to donation_ledger, which fires the balance-sync trigger.
 * If funding is insufficient, Postgres CHECK constraint (current_funding >= 0) rolls back everything.
 */
export async function reviewDisbursementRequest(params: {
  requestId: string;
  status: 'approved' | 'rejected';
  reviewedBy: string;
  reviewNotes?: string;
}) {
  const { requestId, status, reviewedBy, reviewNotes } = params;

  return withTransaction(async (client) => {
    // 1. Lock the disbursement request row
    const reqResult = await client.query(
      `SELECT id, campaign_id, amount, description, status
       FROM disbursement_requests
       WHERE id = $1
       FOR UPDATE`,
      [requestId]
    );

    if (reqResult.rowCount === 0) {
      throw new Error('Disbursement request not found.');
    }

    const disbursement = reqResult.rows[0];

    if (disbursement.status !== 'pending') {
      throw new Error(`Request has already been evaluated as '${disbursement.status}'.`);
    }

    // 2. If approving, check current funding balance
    if (status === 'approved') {
      const campResult = await client.query(
        `SELECT current_funding FROM campaigns WHERE id = $1 FOR UPDATE`,
        [disbursement.campaign_id]
      );

      if (campResult.rowCount === 0) {
        throw new Error('Campaign not found.');
      }

      const availableFunding = parseFloat(campResult.rows[0].current_funding);
      const debitAmount = parseFloat(disbursement.amount);

      if (availableFunding < debitAmount) {
        throw new Error(
          `Cannot approve disbursement: Requested amount ($${debitAmount.toFixed(2)}) exceeds available campaign funding ($${availableFunding.toFixed(2)}).`
        );
      }

      // 3. Insert 'debit' entry into immutable donation ledger
      // Note: Trigger trg_sync_campaign_funding will automatically decrement campaigns.current_funding
      await client.query(
        `INSERT INTO donation_ledger (campaign_id, amount, type, description)
         VALUES ($1, $2, 'debit', $3)`,
        [
          disbursement.campaign_id,
          disbursement.amount,
          `Approved Disbursement #${disbursement.id.slice(0, 8)}: ${disbursement.description}`,
        ]
      );
    }

    // 4. Update disbursement request status
    const updateResult = await client.query(
      `UPDATE disbursement_requests
       SET status = $1, reviewed_by = $2, review_notes = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING id, campaign_id, amount::text, description, status, reviewed_by, review_notes, updated_at::text`,
      [status, reviewedBy, reviewNotes || null, requestId]
    );

    return updateResult.rows[0];
  });
}
