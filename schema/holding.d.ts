import type Entity from './entity.d.ts';

export default interface Holding extends Entity {
    ticker: string;
    type: string;
    risk: number;
    contract: string;
    currency: string;
}