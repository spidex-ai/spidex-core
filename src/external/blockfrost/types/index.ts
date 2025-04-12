export interface BlockfrostAddressDetail {
    address: string
    amount: BlockfrostAmount[]
    stake_address: string
    type: string
    script: boolean
}

export interface BlockfrostAmount {
    unit: string
    quantity: string
}


export interface BlockfrostTransaction {
    tx_hash: string
    tx_index: number
    block_height: number
    block_time: number
}
