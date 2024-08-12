import Event from './event';

export default interface Trade extends Event {
    type: string;
    holding: string;
    account: string;
    transaction: string;
    quantity: number;
    price: number;
    fees: number;
    qtyFees: number;
    balance: number;
}