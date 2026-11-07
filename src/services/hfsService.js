const { FileCreateTransaction, FileAppendTransaction, FileContentsQuery } = require('@hashgraph/sdk');
const { getClient } = require('../config/client');

/**
 * Not called anywhere in the MVP pipeline yet. Kept here so the "storing
 * inspection report documents" roadmap item has a working base to build on.
 *
 * IMPORTANT: files on HFS are publicly readable by anyone who has the file
 * ID. Never store raw invoices or personal data here — only redacted or
 * already-public content (e.g. a signed summary, not the source PDF).
 */

const CHUNK_SIZE = 4096; // HFS caps how much a single transaction can carry

async function storeFile(contentBuffer) {
  const client = getClient();

  const tx = await new FileCreateTransaction()
    .setKeys([client.operatorPublicKey])
    .setContents(contentBuffer.subarray(0, CHUNK_SIZE))
    .execute(client);

  const receipt = await tx.getReceipt(client);
  const fileId = receipt.fileId.toString();

  if (contentBuffer.length > CHUNK_SIZE) {
    await new FileAppendTransaction()
      .setFileId(fileId)
      .setContents(contentBuffer.subarray(CHUNK_SIZE))
      .execute(client);
  }

  return fileId;
}

async function readFile(fileId) {
  const client = getClient();
  const contents = await new FileContentsQuery().setFileId(fileId).execute(client);
  return Buffer.from(contents).toString('utf8');
}

module.exports = { storeFile, readFile };
