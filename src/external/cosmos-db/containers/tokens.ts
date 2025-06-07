import { Container } from '@azure/cosmos';

import { Token } from '../types';
import { getContainer } from './utils';

export const TOKENS_CONTAINER_ID = 'tokens';

let tokensContainer: Container;

export const getTokensContainer = async () => {
  if (!tokensContainer) tokensContainer = await getContainer<Token>(TOKENS_CONTAINER_ID, 'id');
  return tokensContainer;
};
