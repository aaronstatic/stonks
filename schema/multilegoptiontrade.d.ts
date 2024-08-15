import type Entity from './entity.d.ts';

export default interface MultiLegOptionTrade extends Entity {
    optiontrades: string[];
    account: string;
    quantity: number;
    timestamp: string;
    type: string;
    multi: string;
}