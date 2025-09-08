export interface BatchTokenCardanoInfo {
  subjects: TokenCardanoInfoSubject[];
  queryPriority: string[];
}

export interface TokenCardanoInfoSubject {
  subject: string;
  metadata: TokenCardanoInfoSubjectMetadata;
}

export interface TokenCardanoInfoSubjectMetadata {
  name: TokenCardanoInfoSubjectMetadataProperty;
  description: TokenCardanoInfoSubjectMetadataProperty;
  ticker: TokenCardanoInfoSubjectMetadataProperty;
  decimals: TokenCardanoInfoSubjectMetadataProperty;
  logo: TokenCardanoInfoSubjectMetadataProperty;
  url: TokenCardanoInfoSubjectMetadataProperty;
  version?: TokenCardanoInfoSubjectMetadataProperty;
}

export interface TokenCardanoInfoSubjectMetadataProperty {
  value: string;
  source: string;
}

export interface TokenCardanoInfo {
  subject: TokenCardanoInfoSubject;
  queryPriority: string[];
}
