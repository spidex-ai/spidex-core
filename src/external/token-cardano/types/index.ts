export interface BatchTokenCardanoInfo {
  subjects: BatchTokenCardanoSubject[];
}

export interface BatchTokenCardanoSubject {
  subject: string;
  policy: string;
  logo?: BatchTokenCardanoLogo;
  name?: BatchTokenCardanoName;
  ticker?: BatchTokenCardanoTicker;
  description?: BatchTokenCardanoDescription;
  url?: BatchTokenCardanoUrl;
  decimals?: BatchTokenCardanoDecimals;
}

export interface BatchTokenCardanoLogo {
  signatures: BatchTokenCardanoSignature[];
  sequenceNumber: number;
  value: string;
}

export interface BatchTokenCardanoName {
  signatures: BatchTokenCardanoSignature[];
  sequenceNumber: number;
  value: string;
}

export interface BatchTokenCardanoTicker {
  signatures: BatchTokenCardanoSignature[];
  sequenceNumber: number;
  value: string;
}

export interface BatchTokenCardanoDescription {
  signatures: BatchTokenCardanoSignature[];
  sequenceNumber: number;
  value: string;
}

export interface BatchTokenCardanoUrl {
  signatures: BatchTokenCardanoSignature[];
  sequenceNumber: number;
  value: string;
}

export interface BatchTokenCardanoDecimals {
  signatures: BatchTokenCardanoSignature[];
  sequenceNumber: number;
  value: number;
}
export interface BatchTokenCardanoSignature {
  signature: string;
  publicKey: string;
}

export interface TokenCardanoInfo {
  subject: string;
  policy: string;
  name: TokenCardanoName;
  description: TokenCardanoDescription;
  url: TokenCardanoUrl;
  ticker: TokenCardanoTicker;
  decimals: TokenCardanoDecimals;
  logo: TokenCardanoLogo;
}
export interface TokenCardanoName {
  signatures: TokenCardanoSignature[];
  sequenceNumber: number;
  value: string;
}

export interface TokenCardanoSignature {
  signature: string;
  publicKey: string;
}

export interface TokenCardanoDescription {
  signatures: TokenCardanoSignature[];
  sequenceNumber: number;
  value: string;
}

export interface TokenCardanoUrl {
  signatures: TokenCardanoSignature[];
  sequenceNumber: number;
  value: string;
}

export interface TokenCardanoTicker {
  signatures: TokenCardanoSignature[];
  sequenceNumber: number;
  value: string;
}

export interface TokenCardanoDecimals {
  signatures: TokenCardanoSignature[];
  sequenceNumber: number;
  value: number;
}

export interface TokenCardanoLogo {
  signatures: TokenCardanoSignature[];
  sequenceNumber: number;
  value: string;
}
