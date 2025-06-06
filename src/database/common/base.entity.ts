import { CreateDateColumn, DeleteDateColumn, Generated, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export class BaseIdEntity {
  @Generated()
  @PrimaryColumn()
  id: number;
}

export class BaseEntity extends BaseIdEntity {
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}

export class BaseExcludeDeletedAtEntity extends BaseIdEntity {
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
