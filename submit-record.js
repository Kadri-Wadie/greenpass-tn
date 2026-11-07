require('dotenv').config();
const { extractActivityData } = require('./src/agents/documentAgent');
const { calculateFootprint } = require('./src/agents/carbonEngine');
const { anchorRecord } = require('./src/agents/trustAgent');

// Stand-in for a real upload — matches the example record in the pitch deck.
const sampleDocuments = [
  {
    filename: 'steg-electricity-bill-sept2026.txt',
    text: 'STEG invoice. Supplier: STEG. Date: 2026-09-30. Consumption: 1850 kWh.',
  },
  {
    filename: 'diesel-invoice-sept2026.txt',
    text: 'Fuel invoice. Supplier: Agil Tunisie. Date: 2026-09-28. Quantity: 420 L diesel.',
  },
];

(async () => {
  try {
    const { documents, totals } = await extractActivityData(sampleDocuments);
    console.log('Extracted activity data:', documents);

    const footprint = calculateFootprint(totals);
    console.log('Calculated footprint:', footprint);

    const record = await anchorRecord({
      companyId: 'Tunisian SME_x',
      period: '2026-09',
      totals,
      footprint,
      evidenceCount: documents.length,
    });

    console.log('\nAnchored record:');
    console.log(JSON.stringify(record, null, 2));
    console.log(`\nSave this recordId to test verify-record.js: ${record.recordId}`);
  } catch (err) {
    console.error('Failed to submit record:', err.message);
    process.exit(1);
  }
})();
