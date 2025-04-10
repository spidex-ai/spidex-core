import { BaseEntity } from '@database/common/base.entity';
import { UserEntity } from '@database/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';


@Entity('user_points')
@Unique(['userId'])
export class UserPointEntity extends BaseEntity {

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({ type: 'decimal', precision: 36, scale: 8, default: '0' })
  amount: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: UserEntity;
}
