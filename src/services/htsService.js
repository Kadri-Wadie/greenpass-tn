const {
  TokenCreateTransaction,
  TokenMintTransaction,
  TokenType,
  TokenSupplyType,
} = require('@hashgraph/sdk');
const { getClient } = require('../config/client');

/**
 * Roadmap V4 — "Hedera-native credentials / tokenized certificates".
 * Not wired into the MVP pipeline (records are anchored via HCS only), but
 * kept here so V4 doesn't start from zero: one NFT-style collection, one
 * mint per verified GreenPass.
 */

async function createCredentialToken({ name = 'GreenPass Credential', symbol = 'GPASS' } = {}) {
  const client = getClient();

  const tx = await new TokenCreateTransaction()
    .setTokenName(name)
    .setTokenSymbol(symbol)
    .setTokenType(TokenType.NonFungibleUnique)
    .setSupplyType(TokenSupplyType.Infinite)
    .setTreasuryAccountId(client.operatorAccountId)
    .setSupplyKey(client.operatorPublicKey)
    .execute(client);

  const receipt = await tx.getReceipt(client);
  return receipt.tokenId.toString();
}

async function mintCredential(tokenId, metadata) {
  const client = getClient();

  const tx = await new TokenMintTransaction()
    .setTokenId(tokenId)
    .setMetadata([Buffer.from(JSON.stringify(metadata))])
    .execute(client);

  const receipt = await tx.getReceipt(client);
  return receipt.serials[0].toString();
}

module.exports = { createCredentialToken, mintCredential };
