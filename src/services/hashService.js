const crypto = require('crypto');

/**
 * Recursively sorts object keys so the same data always serializes to the
 * same string, regardless of the order fields were added in. Without this,
 * two logically identical records could hash differently.
 */
function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortKeys(value[key]);
        return acc;
      }, {});
  }
  return value;
}

function canonicalize(record) {
  return JSON.stringify(sortKeys(record));
}

function hashRecord(record) {
  const canonical = canonicalize(record);
  const hash = crypto.createHash('sha256').update(canonical).digest('hex');
  return { canonical, hash };
}

function verifyRecordHash(record, expectedHash) {
  const { hash } = hashRecord(record);
  return { matches: hash === expectedHash, recomputedHash: hash };
}

module.exports = { canonicalize, hashRecord, verifyRecordHash };
