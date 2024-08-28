export type Inputs = {
    [key: string]: any
}

export type Outputs = {
    [key: string]: any
}

export type Params = {
    [key: string]: any
}

type InputOutput = {
    name: string
    type: string
}

export default class BaseNode {
    inputs: InputOutput[] = []
    outputs: InputOutput[] = []

    process(params: Params, data: Inputs, context: Inputs): Outputs {
        return data;
    }
}