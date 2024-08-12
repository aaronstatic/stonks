import type Entity from './entity.d.ts';

export default interface Account extends Entity {
    platform: string;
    currency: string;
    balance: number;
}