enum schemaType {
    object = 'object',
    int = 'int',
    int32 = 'int32',
    int64 = 'int64',
    float32 = 'float32',
    float64 = 'float64',
    string = 'string',
    file = 'file',
    bool = 'bool',
    array = 'array'
}

enum from { url = 'url', body = 'body', header = 'header' }

export class parameter {
    in: from;
    schema: schema;
    constructor(p: parameter) {
        this.in = p.in
        this.schema = new schema(p.schema)
    }
}

export class response {
    code: string;
    description: string;
    header: Record<string, string[]>;
    body: schema

    constructor(r: response) {
        this.code = r.code
        this.description = r.description
        this.header = r.header
        if (r.body) {
            this.body = new schema(r.body)
        }
    }
}

export class schema {
    type: schemaType
    required: boolean
    properties: Record<string, schema>
    items: schema

    jsType: string
    state: string
    constructor(s: schema) {
        this.type = s.type
        this.required = s.required
        if (s.properties) {
            let properties: Record<string, schema> = {}
            Object.keys(s.properties).forEach(property => {
                properties[property] = new schema(s.properties[property])
            })
            this.properties = properties
        }
        if (s.items) {
            this.items = new schema(s.items)
        }
        this.jsType = this.getJsType()
        this.state = this.getState()
    }

    getJsType(): string {
        switch (this.type) {
            case schemaType.object:
                return 'Object';
            case schemaType.int:
            case schemaType.int32:
            case schemaType.int64:
            case schemaType.float32:
            case schemaType.float64:
                return 'Number';
            case schemaType.string:
                return 'String';
            case schemaType.file:
                return 'File';
            case schemaType.bool:
                return 'Boolean';
            case schemaType.array:
                return this.items.getJsType() + '[]'
        }
    }

    getState(): string {
        let str: string = ''
        switch (this.type) {
            case schemaType.object:
                if (this.properties) {
                    let isFirst: boolean = true
                    Object.keys(this.properties).forEach(property => {
                        let sub: schema = this.properties[property]
                        if (!isFirst) {
                            str += ', '
                        } else {
                            isFirst = false
                        }
                        str += `${property}: ${sub.getState()}`
                    })
                }
                return `{ ${str} }`
            case schemaType.int:
            case schemaType.int32:
            case schemaType.int64:
            case schemaType.float32:
            case schemaType.float64:
                return 'Number';
            case schemaType.string:
                return 'String';
            case schemaType.file:
                return 'File';
            case schemaType.bool:
                return 'Boolean';
            case schemaType.array:
                return 'Array'
        }
    }
}

export class doc {
    name: string
    summary: string
    description: string
    parameters: parameter[]
    responses: response[]
    body_encode_type: string
    getFuncName: string
    setFuncName: string
    stateName: string
    inputParams: string
    constructor(d: doc) {
        this.name = d.name
        this.summary = d.summary
        this.description = d.description
        if (d.parameters) {
            let parameters: parameter[] = []
            for (let p of d.parameters) {
                parameters.push(new parameter(p))
            }
            this.parameters = parameters
        }
        if (d.responses) {
            let responses: response[] = []
            for (let res of d.responses) {
                responses.push(new response(res))
            }
            this.responses = responses
        }
        this.body_encode_type = d.body_encode_type
        this.getFuncName = camelize('get_' + this.name)
        this.setFuncName = camelize('set_' + this.name)
        this.stateName = camelize(this.name);
        this.inputParams = this.getInputParams()
    }
    containsParams(): boolean {
        return this.parameters && this.parameters.length > 0
    }
    parametersContainsFrom(f: from): boolean {
        if (this.parameters) {
            for (let p of this.parameters) {
                if (p.in === f) {
                    return true
                }
            }
        }
        return false
    }
    getInputParams(): string {
        let params: string = '';
        let init = (ok: boolean, part: string) => {
            if (ok) {
                if (params.length > 0) params += ', ';
                params += part
            }
        };
        init(this.parametersContainsFrom(from.url), 'url');
        init(this.parametersContainsFrom(from.header), 'header');
        init(this.parametersContainsFrom(from.body), 'body');
        return `{ ${params} }`
    }
}

export class path {
    method: string
    path: string
    body_encode_type: string
    components: number[]
    _components: doc[]
    doc: doc
    constructor(p: path, components: doc[]) {
        this.method = p.method
        this.path = p.path
        this.components = p.components
        if (p.components && p.components.length) {
            let cs: doc[] = []
            for (let cIdx of p.components) {
                let c: doc = components[cIdx];
                if (c.containsParams()) {
                    cs.push(c)
                }
            }
            this._components = cs
        }
        this.body_encode_type = p.body_encode_type?p.body_encode_type:''
        this.doc = new doc(p.doc)
    }

    containsParams(): boolean {
        return this.doc.containsParams()
    }

    componentContainsParams(): boolean {
        if (this._components && this._components.length) {
            for (let cIdx of this.components) {
                if (this._components[cIdx].containsParams()) {
                    return true
                }
            }
        }
        return false
    }

    getComponentsInstance(): doc[] {
        return this._components
    }
}

export class group {
    name: string
    description: string
    paths: path[]
    index: string
    constructor(g: group, components: doc[]) {
        if (g.paths) {
            let paths: path[] = []
            for (let p of g.paths) {
                paths.push(new path(p, components))
            }
            this.paths = paths
        }
        this.name = g.name
        this.description = g.description
        this.index = camelize(g.name)
    }
}

export class morgine {
    components: doc[];
    groups: group[];

    constructor(dt: object) {
        if (dt['components']) {
            let components: doc[] = []
            for (let c of dt['components']) {
                components.push(new doc(c))
            }
            this.components = components
        }
        if (dt['groups']) {
            let groups: group[] = []
            for (let c of dt['groups']) {
                groups.push(new group(c, this.components))
            }
            this.groups = groups
        }
    }
}

function camelize(str) {
    str = str.replace(/[\-_\s]+(.)?/g, function (match, chr) {
        return chr ? chr.toUpperCase() : '';
    });
    // Ensure 1st char is always lowercase
    return str.substr(0, 1).toLowerCase() + str.substr(1);
}
