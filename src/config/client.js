const { Client, PrivateKey } = require('@hashgraph/sdk');

/**
 * portal.hedera.com can hand you a DER-encoded key or a raw ECDSA/ED25519
 * hex string depending on the account type you created. Try each parser in
 * turn so the rest of the app never has to care which one you were given.
 */
function loadOperatorKey(rawKey) {
  try {
    return PrivateKey.fromStringDer(rawKey);
  } catch (_derError) {
    try {
      return PrivateKey.fromStringECDSA(rawKey);
    } catch (_ecdsaError) {
      return PrivateKey.fromStringED25519(rawKey);
    }
  }
}

let client = null;

function getClient() {
  if (client) return client;

  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const rawKey = process.env.HEDERA_PRIVATE_KEY;
  const network = (process.env.HEDERA_NETWORK || 'testnet').toLowerCase();

  if (!accountId || !rawKey) {
    throw new Error(
      'Missing HEDERA_ACCOUNT_ID or HEDERA_PRIVATE_KEY — copy .env.example to .env and fill in your portal.hedera.com credentials.'
    );
  }

  const operatorKey = loadOperatorKey(rawKey);

  client = network === 'mainnet' ? Client.forMainnet() : Client.forTestnet();
  client.setOperator(accountId, operatorKey);

  return client;
}

/** Mainly for tests / graceful shutdown — resets the cached client. */
function resetClient() {
  if (client) client.close();
  client = null;
}

module.exports = { getClient, resetClient };
