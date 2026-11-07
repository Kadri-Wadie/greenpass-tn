require('dotenv').config();
const { createTopic } = require('./src/services/hcsService');

(async () => {
  try {
    const topicId = await createTopic();
    console.log(`Created HCS topic: ${topicId}`);
    console.log('Add this to your .env as HEDERA_TOPIC_ID before running the pipeline.');
  } catch (err) {
    console.error('Failed to create topic:', err.message);
    process.exit(1);
  }
})();
