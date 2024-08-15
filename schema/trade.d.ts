import Event from './event';
import Holding from './holding';

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
    holdingData?: Holding;
    total?: number;
    holdingType: string;
}