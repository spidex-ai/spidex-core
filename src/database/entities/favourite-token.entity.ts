import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseExcludeDeletedAtEntity } from '../common/base.entity';
import { UserEntity } from './user.entity';

@Entity('favourite_tokens')
@Index(['userId', 'tokenId'], { unique: true })
export class FavouriteTokenEntity extends BaseExcludeDeletedAtEntity {
  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'token_id' })
  tokenId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
