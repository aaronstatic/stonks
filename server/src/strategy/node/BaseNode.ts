export type Inputs = {
    [key: string]: any
}

export type Outputs = {
    [key: string]: any
}

export type Params = {
    [key: string]: any
}

export default class BaseNode {
    process(params: Params, data: Inputs, context: Inputs): Outputs {
        return data;
    }
}