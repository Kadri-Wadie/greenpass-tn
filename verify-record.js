require('dotenv').config();
const { verifyRecord } = require('./src/agents/trustAgent');

const recordId = process.argv[2];

if (!recordId) {
  console.error('Usage: node verify-record.js <recordId>');
  console.error('(recordId is printed at the end of `node submit-record.js`)');
  process.exit(1);
}

(async () => {
  try {
    const result = await verifyRecord(recordId);

    console.log(`Recomputed hash:  ${result.recomputedHash}`);
    console.log(`On-chain hash:    ${result.onChainHash}`);
    console.log(result.matches ? '✓ Integrity matches' : '❌ Hash mismatch — record does not match the Hedera-anchored copy');
  } catch (err) {
    console.error('Verification failed:', err.message);
    process.exit(1);
  }
})();
