/**
 * Document Agent — turns raw bill/invoice/CSV text into structured activity
 * data: { electricityKwh, dieselLiters, date, supplier }.
 *
 * For the hackathon POC this runs a simple rule-based parser against
 * already-decoded text. To handle scanned PDFs for real, swap the body of
 * parseWithRules() for a call to an LLM/OCR API — carbonEngine.js and
 * trustAgent.js only depend on the output shape below, not on how it was
 * produced.
 */

function parseWithRules(rawText) {
  const kwhMatch = rawText.match(/([\d.,]+)\s*kWh/i);
  const dieselMatch = rawText.match(/([\d.,]+)\s*L(?:itres)?\s*diesel/i);
  const dateMatch = rawText.match(/(\d{4}-\d{2}-\d{2})/);
  const supplierMatch = rawText.match(/supplier:\s*([^.\n]+)/i);

  return {
    electricityKwh: kwhMatch ? parseFloat(kwhMatch[1].replace(',', '')) : 0,
    dieselLiters: dieselMatch ? parseFloat(dieselMatch[1].replace(',', '')) : 0,
    date: dateMatch ? dateMatch[1] : null,
    supplier: supplierMatch ? supplierMatch[1].trim() : 'Unknown',
  };
}

/**
 * @param {Array<{filename: string, text: string}>} documents
 * @returns {{ documents: object[], totals: { electricityKwh: number, dieselLiters: number } }}
 */
async function extractActivityData(documents) {
  const extracted = documents.map((doc) => ({
    filename: doc.filename,
    ...parseWithRules(doc.text),
  }));

  const totals = extracted.reduce(
    (acc, d) => ({
      electricityKwh: acc.electricityKwh + d.electricityKwh,
      dieselLiters: acc.dieselLiters + d.dieselLiters,
    }),
    { electricityKwh: 0, dieselLiters: 0 }
  );

  return { documents: extracted, totals };
}

module.exports = { extractActivityData, parseWithRules };
