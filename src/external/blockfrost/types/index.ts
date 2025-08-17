export class BlockfrostAddressDetail {
  address: string;
  amount: BlockfrostAmount[];
  stake_address: string;
  type: string;
  script: boolean;

  static empty(address) {
    return {
      address,
      amount: [],
      stake_address: '',
      type: '',
      script: false,
    };
  }
}

export interface BlockfrostAmount {
  unit: string;
  quantity: string;
}

export interface BlockfrostTransaction {
  tx_hash: string;
  tx_index: number;
  block_height: number;
  block_time: number;
}

export interface BlockfrostTokenDetail {
  asset: string;
  policy_id: string;
  asset_name: string;
  fingerprint: string;
  quantity: string;
  initial_mint_tx_hash: string;
  mint_or_burn_count: number;
  onchain_metadata: OnchainMetadata;
  onchain_metadata_standard: string;
  onchain_metadata_extra: string;
  metadata: Metadata;
}

export interface OnchainMetadata {
  name: string;
  image: string;
  ticker: string;
  poolAuthor: string;
  description: string;
  decimals: number;
}

export interface Metadata {
  name: string;
  description: string;
  ticker: string;
  url: string;
  logo: string;
  decimals: number;
}

export interface BlockfrostTransactionDetail {
  hash: string;
  block: string;
  block_height: number;
  block_time: number;
  slot: number;
  index: number;
  output_amount: OutputAmount[];
  fees: string;
  deposit: string;
  size: number;
  invalid_before: any;
  invalid_hereafter: string;
  utxo_count: number;
  withdrawal_count: number;
  mir_cert_count: number;
  delegation_count: number;
  stake_cert_count: number;
  pool_update_count: number;
  pool_retire_count: number;
  asset_mint_or_burn_count: number;
  redeemer_count: number;
  valid_contract: boolean;
}

export interface OutputAmount {
  unit: string;
  quantity: string;
}

export interface BlockfrostTransactionCbor {
  cbor: string;
}
