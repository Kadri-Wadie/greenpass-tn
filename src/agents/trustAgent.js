const { randomUUID } = require('crypto');
const { hashRecord, verifyRecordHash } = require('../services/hashService');
const { getTopicMessage } = require('../services/mirrorService');
const { saveRecord, getRecord } = require('../services/dbService');

/**
 * Trust Agent — the piece that makes a GreenPass auditable:
 * checks completeness → hashes → submits to Hedera → stores the reference.
 */
async function anchorRecord({ companyId, period, totals, footprint, evidenceCount }) {
  if (evidenceCount < 1) {
    throw new Error('At least one source document is required to anchor a record');
  }

  const recordId = randomUUID();

  const record = {
    recordId,
    companyId,
    period,
    electricityKwh: totals.electricityKwh,
    dieselLiters: totals.dieselLiters,
    footprint,
    evidenceCount,
  };

  const { hash } = hashRecord(record);

  // DEMO_MODE keeps the complete flow runnable without Hedera credentials.
  // It is explicitly a local simulation, not an on-chain transaction.
  const anchor = process.env.DEMO_MODE === 'true'
    ? { topicId: 'LOCAL-DEMO', sequenceNumber: String(Date.now()), transactionId: 'LOCAL-DEMO' }
    : await require('../services/hcsService').submitRecordHash({ recordId, hash, companyId, period });

  const fullRecord = {
    ...record,
    hash,
    anchor,
    anchoredAt: new Date().toISOString(),
  };

  await saveRecord(fullRecord);
  return fullRecord;
}

/**
 * Recomputes the hash from the stored fields AND independently re-fetches
 * the anchored hash from the Mirror Node — a tampered local copy of the
 * record can't pass just by tampering with its own stored hash field too.
 */
async function verifyRecord(recordId) {
  const record = await getRecord(recordId);
  if (!record) throw new Error(`No record found for ${recordId}`);

  const { recordId: id, companyId, period, electricityKwh, dieselLiters, footprint, evidenceCount, hash: storedHash } = record;

  const { matches: localMatches, recomputedHash } = verifyRecordHash(
    { recordId: id, companyId, period, electricityKwh, dieselLiters, footprint, evidenceCount },
    storedHash
  );

  let onChainHash;
  let onChainMatches;
  if (record.anchor.topicId === 'LOCAL-DEMO') {
    // Local demo mode uses the original stored fingerprint as a simulated anchor.
    onChainHash = storedHash;
    onChainMatches = onChainHash === recomputedHash;
  } else {
    const onChain = await getTopicMessage(record.anchor.topicId, record.anchor.sequenceNumber);
    onChainHash = onChain.decoded.hash;
    onChainMatches = onChainHash === recomputedHash;
  }

  return {
    matches: localMatches && onChainMatches,
    recomputedHash,
    onChainHash,
    record,
  };
}

module.exports = { anchorRecord, verifyRecord };
