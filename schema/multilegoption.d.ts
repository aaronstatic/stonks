import type Entity from './entity.d.ts';

export default interface MultiLegOption extends Entity {
    holding: string;
    type: string;
    name: string;
}