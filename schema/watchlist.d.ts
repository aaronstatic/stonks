import type Entity from './entity.d.ts';

export default interface WatchlistItem extends Entity {
    ticker: string;
    type: string;
}