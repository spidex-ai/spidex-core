import { Container } from '@azure/cosmos';

import { SavedToken } from '../types';
import { getContainer } from './utils';

export const SAVED_TOKENS_CONTAINER_ID = 'saved-tokens';

let savedTokensContainer: Container;

export const getSavedTokensContainer = async () => {
  if (!savedTokensContainer) savedTokensContainer = await getContainer<SavedToken>(SAVED_TOKENS_CONTAINER_ID, 'userId');
  return savedTokensContainer;
};
