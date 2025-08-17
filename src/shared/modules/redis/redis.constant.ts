import { EUserPointType } from '@modules/user-point/user-point.constant';

export const LOCK_KEY_USER_BALANCE = (userId: number): string => `lock:user_balance:${userId}`;

export const LOCK_KEY_USER_POINT = (userId: number, type: EUserPointType): string =>
  `lock:user_point:${userId}:${type}`;

export const LOCK_KEY_COIN_GECKO_PRICE = (coinGeckoId: string): string => `lock:coin_gecko_price:${coinGeckoId}`;

export const LOCK_KEY_RACING_BALL_TRIGGER_END_ROUND = 'lock:racing_ball:trigger-end-round';
export const LOCK_KEY_RACING_BALL_TRIGGER_START_ROUND = 'lock:racing_ball:trigger-start-round';
