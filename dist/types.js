"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.morgine = exports.group = exports.path = exports.doc = exports.schema = exports.response = exports.parameter = void 0;
var schemaType;
(function (schemaType) {
    schemaType["object"] = "object";
    schemaType["int"] = "int";
    schemaType["int32"] = "int32";
    schemaType["int64"] = "int64";
    schemaType["float32"] = "float32";
    schemaType["float64"] = "float64";
    schemaType["string"] = "string";
    schemaType["file"] = "file";
    schemaType["bool"] = "bool";
    schemaType["array"] = "array";
})(schemaType || (schemaType = {}));
var from;
(function (from) {
    from["url"] = "url";
    from["body"] = "body";
    from["header"] = "header";
})(from || (from = {}));
class parameter {
    constructor(p) {
        this.in = p.in;
        this.schema = new schema(p.schema);
    }
}
exports.parameter = parameter;
class response {
    constructor(r) {
        this.code = r.code;
        this.description = r.description;
        this.header = r.header;
        if (r.body) {
            this.body = new schema(r.body);
        }
    }
}
exports.response = response;
class schema {
    constructor(s) {
        this.type = s.type;
        this.required = s.required;
        if (s.properties) {
            let properties = {};
            Object.keys(s.properties).forEach(property => {
                properties[property] = new schema(s.properties[property]);
            });
            this.properties = properties;
        }
        if (s.items) {
            this.items = new schema(s.items);
        }
        this.jsType = this.getJsType();
        this.state = this.getState();
    }
    getJsType() {
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
                return this.items.getJsType() + '[]';
        }
    }
    getState() {
        let str = '';
        switch (this.type) {
            case schemaType.object:
                if (this.properties) {
                    let isFirst = true;
                    Object.keys(this.properties).forEach(property => {
                        let sub = this.properties[property];
                        if (!isFirst) {
                            str += ', ';
                        }
                        else {
                            isFirst = false;
                        }
                        str += `${property}: ${sub.getState()}`;
                    });
                }
                return `{ ${str} }`;
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
                return 'Array';
        }
    }
}
exports.schema = schema;
class doc {
    constructor(d) {
        this.name = d.name;
        this.summary = d.summary;
        this.description = d.description;
        if (d.parameters) {
            let parameters = [];
            for (let p of d.parameters) {
                parameters.push(new parameter(p));
            }
            this.parameters = parameters;
        }
        if (d.responses) {
            let responses = [];
            for (let res of d.responses) {
                responses.push(new response(res));
            }
            this.responses = responses;
        }
        this.body_encode_type = d.body_encode_type;
        this.getFuncName = camelize('get_' + this.name);
        this.setFuncName = camelize('set_' + this.name);
        this.stateName = camelize(this.name);
        this.inputParams = this.getInputParams();
    }
    containsParams() {
        return this.parameters && this.parameters.length > 0;
    }
    parametersContainsFrom(f) {
        if (this.parameters) {
            for (let p of this.parameters) {
                if (p.in === f) {
                    return true;
                }
            }
        }
        return false;
    }
    getInputParams() {
        let params = '';
        let init = (ok, part) => {
            if (ok) {
                if (params.length > 0)
                    params += ', ';
                params += part;
            }
        };
        init(this.parametersContainsFrom(from.url), 'url');
        init(this.parametersContainsFrom(from.header), 'header');
        init(this.parametersContainsFrom(from.body), 'body');
        return `{ ${params} }`;
    }
}
exports.doc = doc;
class path {
    constructor(p, components) {
        this.method = p.method;
        this.path = p.path;
        this.components = p.components;
        if (p.components && p.components.length) {
            let cs = [];
            for (let cIdx of p.components) {
                let c = components[cIdx];
                if (c.containsParams()) {
                    cs.push(c);
                }
            }
            this._components = cs;
        }
        this.body_encode_type = p.body_encode_type ? p.body_encode_type : '';
        this.doc = new doc(p.doc);
    }
    containsParams() {
        return this.doc.containsParams();
    }
    componentContainsParams() {
        if (this._components && this._components.length) {
            for (let cIdx of this.components) {
                if (this._components[cIdx].containsParams()) {
                    return true;
                }
            }
        }
        return false;
    }
    getComponentsInstance() {
        return this._components;
    }
}
exports.path = path;
class group {
    constructor(g, components) {
        if (g.paths) {
            let paths = [];
            for (let p of g.paths) {
                paths.push(new path(p, components));
            }
            this.paths = paths;
        }
        this.name = g.name;
        this.description = g.description;
        this.index = camelize(g.name);
    }
}
exports.group = group;
class morgine {
    constructor(dt) {
        if (dt['components']) {
            let components = [];
            for (let c of dt['components']) {
                components.push(new doc(c));
            }
            this.components = components;
        }
        if (dt['groups']) {
            let groups = [];
            for (let c of dt['groups']) {
                groups.push(new group(c, this.components));
            }
            this.groups = groups;
        }
    }
}
exports.morgine = morgine;
function camelize(str) {
    str = str.replace(/[\-_\s]+(.)?/g, function (match, chr) {
        return chr ? chr.toUpperCase() : '';
    });
    // Ensure 1st char is always lowercase
    return str.substr(0, 1).toLowerCase() + str.substr(1);
}
