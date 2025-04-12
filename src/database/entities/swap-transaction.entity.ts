import { BaseExcludeDeletedAtEntity } from "@database/common/base.entity";
import { Column, Entity } from "typeorm";

export enum SwapAction {
    BUY = 'buy',
    SELL = 'sell'
}

@Entity('swap_transactions')
export class SwapTransactionEntity extends BaseExcludeDeletedAtEntity {
    @Column({ type: 'enum', enum: SwapAction })
    action: SwapAction

    @Column({ type: 'int', name: 'user_id' })
    userId: number

    @Column({ type: 'varchar', name: 'exchange' })
    exchange: string

    @Column({ type: 'varchar', name: 'hash' })
    hash: string

    @Column({ type: 'varchar', name: 'lp_token_unit' })
    lpTokenUnit: string

    @Column({ type: 'decimal', precision: 36, scale: 18 })
    price: number

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    timestamp: number

    @Column({ type: 'varchar', name: 'token_a', nullable: true })
    tokenA: string

    @Column({ type: 'decimal', name: 'token_a_amount', precision: 36, scale: 18 })
    tokenAAmount: number

    @Column({ type: 'varchar', name: 'token_a_name' })
    tokenAName: string

    @Column({ type: 'varchar', name: 'token_b', nullable: true })
    tokenB: string

    @Column({ type: 'decimal', name: 'token_b_amount', precision: 36, scale: 18 })
    tokenBAmount: number

    @Column({ type: 'varchar', name: 'token_b_name' })
    tokenBName: string
}