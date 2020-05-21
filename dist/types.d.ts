declare enum schemaType {
    object = "object",
    int = "int",
    int32 = "int32",
    int64 = "int64",
    float32 = "float32",
    float64 = "float64",
    string = "string",
    file = "file",
    bool = "bool",
    array = "array"
}
declare enum from {
    url = "url",
    body = "body",
    header = "header"
}
export declare class parameter {
    in: from;
    schema: schema;
    constructor(p: parameter);
}
export declare class response {
    code: string;
    description: string;
    header: Record<string, string[]>;
    body: schema;
    constructor(r: response);
}
export declare class schema {
    type: schemaType;
    required: boolean;
    properties: Record<string, schema>;
    items: schema;
    jsType: string;
    state: string;
    constructor(s: schema);
    getJsType(): string;
    getState(): string;
}
export declare class doc {
    name: string;
    summary: string;
    description: string;
    parameters: parameter[];
    responses: response[];
    body_encode_type: string;
    getFuncName: string;
    setFuncName: string;
    stateName: string;
    inputParams: string;
    constructor(d: doc);
    containsParams(): boolean;
    parametersContainsFrom(f: from): boolean;
    getInputParams(): string;
}
export declare class path {
    method: string;
    path: string;
    body_encode_type: string;
    components: number[];
    _components: doc[];
    doc: doc;
    constructor(p: path, components: doc[]);
    containsParams(): boolean;
    componentContainsParams(): boolean;
    getComponentsInstance(): doc[];
}
export declare class group {
    name: string;
    description: string;
    paths: path[];
    index: string;
    constructor(g: group, components: doc[]);
}
export declare class morgine {
    components: doc[];
    groups: group[];
    constructor(dt: object);
}
export {};
