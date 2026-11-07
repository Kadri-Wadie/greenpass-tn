const BASE_URL = process.env.MIRROR_NODE_URL || 'https://testnet.mirrornode.hedera.com';

/**
 * Reads go through the public Mirror Node REST API rather than the SDK's
 * gRPC queries — it needs no operator key, and it works on networks that
 * block gRPC ports (a real issue on some campus/conference wifi).
 */
async function getTopicMessage(topicId, sequenceNumber) {
  const url = `${BASE_URL}/api/v1/topics/${topicId}/messages/${sequenceNumber}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Mirror Node returned ${res.status} for ${url}`);

  const data = await res.json();
  const decoded = Buffer.from(data.message, 'base64').toString('utf8');
  return { raw: data, decoded: JSON.parse(decoded) };
}

async function getAccountBalance(accountId) {
  const url = `${BASE_URL}/api/v1/accounts/${accountId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Mirror Node returned ${res.status} for ${url}`);
  return res.json();
}

module.exports = { getTopicMessage, getAccountBalance };
