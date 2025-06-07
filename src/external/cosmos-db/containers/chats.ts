import { Container } from '@azure/cosmos';

import { Chat } from '../types';
import { getContainer } from './utils';

export const CHATS_CONTAINER_ID = 'chats';

let chatsContainer: Container;

export const getChatsContainer = async () => {
  if (!chatsContainer) chatsContainer = await getContainer<Chat>(CHATS_CONTAINER_ID, 'userId');
  return chatsContainer;
};
