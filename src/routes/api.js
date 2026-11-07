const express = require('express');
const multer = require('multer');
const QRCode = require('qrcode');

const { extractActivityData } = require('../agents/documentAgent');
const { calculateFootprint } = require('../agents/carbonEngine');
const { anchorRecord, verifyRecord } = require('../agents/trustAgent');
const { listRecords, updateRecordField } = require('../services/dbService');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/records — upload documents, run the full pipeline, anchor on Hedera
router.post('/records', upload.array('documents'), async (req, res) => {
  try {
    const { companyId = 'Tunisian SME_x', period = new Date().toISOString().slice(0, 7) } = req.body;

    const documents = (req.files || []).map((f) => ({
      filename: f.originalname,
      text: f.buffer.toString('utf8'),
    }));

    if (documents.length === 0) {
      return res.status(400).json({ error: 'Upload at least one document' });
    }

    const { documents: extracted, totals } = await extractActivityData(documents);
    const footprint = calculateFootprint(totals);

    const record = await anchorRecord({
      companyId,
      period,
      totals,
      footprint,
      evidenceCount: extracted.length,
    });

    const verifyUrl = `${req.protocol}://${req.get('host')}/verify/${record.recordId}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl);

    res.status(201).json({ record, verifyUrl, qrDataUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/records — list anchored records, newest first (dashboard feed)
router.get('/records', async (_req, res) => {
  try {
    const records = await listRecords();
    res.json(records.slice().reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/records/:id/verify — recompute the hash and compare vs the Hedera-anchored one
router.get('/records/:id/verify', async (req, res) => {
  try {
    const result = await verifyRecord(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// POST /api/records/:id/tamper — DEMO ONLY. Edits a stored value the way an
// attacker editing the database would, without touching the stored hash, so
// the next /verify call has a genuine mismatch to catch. Remove this route
// (or gate it behind an admin flag) before any real deployment.
router.post('/records/:id/tamper', async (req, res) => {
  try {
    const record = await updateRecordField(req.params.id, 'electricityKwh', 2850);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json({ tampered: true, record });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
