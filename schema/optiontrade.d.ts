import type Entity from './entity.d.ts';

export default interface OptionTrade extends Entity {
    option: string;
    account: string;
    price: number;
    quantity: number;
    timestamp: string;
    type: string;
    transaction: string;
    fees: number;
    balance: number;
}