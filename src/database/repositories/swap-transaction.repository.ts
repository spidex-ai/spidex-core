import { BaseRepository } from '@database/common/base.repository';
import { SwapTransactionEntity } from '@database/entities/swap-transaction.entity';
import { EntityRepository } from 'nestjs-typeorm-custom-repository';

@EntityRepository(SwapTransactionEntity)
export class SwapTransactionRepository extends BaseRepository<SwapTransactionEntity> {

} 