const { TopicCreateTransaction, TopicMessageSubmitTransaction } = require('@hashgraph/sdk');
const { getClient } = require('../config/client');

/** One-time: creates the topic that every GreenPass record gets anchored to. */
async function createTopic(memo = 'GreenPass TN - evidence anchor') {
  const client = getClient();
  const tx = await new TopicCreateTransaction().setTopicMemo(memo).execute(client);
  const receipt = await tx.getReceipt(client);
  return receipt.topicId.toString();
}

/**
 * Anchors a record's fingerprint to HCS. Only the hash + light metadata go
 * on-chain — the invoices and raw numbers stay in dbService, off-chain.
 */
async function submitRecordHash({ recordId, hash, companyId, period }) {
  const client = getClient();
  const topicId = process.env.HEDERA_TOPIC_ID;

  if (!topicId) {
    throw new Error('HEDERA_TOPIC_ID is not set — run `npm run create-topic` first and add it to .env');
  }

  const message = JSON.stringify({
    type: 'GREENPASS_RECORD',
    recordId,
    companyId,
    period,
    hash,
    anchoredAt: new Date().toISOString(),
  });

  const tx = await new TopicMessageSubmitTransaction({ topicId, message }).execute(client);
  const receipt = await tx.getReceipt(client);

  return {
    topicId,
    sequenceNumber: receipt.topicSequenceNumber.toString(),
    transactionId: tx.transactionId.toString(),
  };
}

module.exports = { createTopic, submitRecordHash };
