import Event from './event';

export default interface Transaction extends Event {
    description: string;
    trade: string | null;
    account: string;
    amount: number;
    balance: number;
    option: string | null;
}