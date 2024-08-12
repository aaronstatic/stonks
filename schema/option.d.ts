import type Entity from './entity.d.ts';

export default interface Option extends Entity {
    holding: string
    strike: number
    expiry: string
    type: string
}