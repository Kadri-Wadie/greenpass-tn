require('dotenv').config();
const { getClient } = require('./src/config/client');
const { getAccountBalance } = require('./src/services/mirrorService');

(async () => {
  try {
    const client = getClient();
    const accountId = process.env.HEDERA_ACCOUNT_ID;

    console.log(`Connected to Hedera ${process.env.HEDERA_NETWORK || 'testnet'} as ${client.operatorAccountId}`);

    const balance = await getAccountBalance(accountId);
    const hbar = Number(balance.balance.balance) / 1e8;
    console.log(`Mirror Node balance: ${hbar} HBAR`);
  } catch (err) {
    console.error('Connection test failed:', err.message);
    process.exit(1);
  }
})();
