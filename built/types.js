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
var parameter = /** @class */ (function () {
    function parameter(p) {
        this.in = p.in;
        this.schema = new schema(p.schema);
    }
    return parameter;
}());
exports.parameter = parameter;
var response = /** @class */ (function () {
    function response(r) {
        this.code = r.code;
        this.description = r.description;
        this.header = r.header;
        if (r.body) {
            this.body = new schema(r.body);
        }
    }
    return response;
}());
exports.response = response;
var schema = /** @class */ (function () {
    function schema(s) {
        this.type = s.type;
        this.required = s.required;
        if (s.properties) {
            var properties_1 = {};
            Object.keys(s.properties).forEach(function (property) {
                properties_1[property] = new schema(s.properties[property]);
            });
            this.properties = properties_1;
        }
        if (s.items) {
            this.items = new schema(s.items);
        }
        this.jsType = this.getJsType();
        this.state = this.getState();
    }
    schema.prototype.getJsType = function () {
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
    };
    schema.prototype.getState = function () {
        var _this = this;
        var str = '';
        switch (this.type) {
            case schemaType.object:
                if (this.properties) {
                    var isFirst_1 = true;
                    Object.keys(this.properties).forEach(function (property) {
                        var sub = _this.properties[property];
                        if (!isFirst_1) {
                            str += ', ';
                        }
                        else {
                            isFirst_1 = false;
                        }
                        str += property + ": " + sub.getState();
                    });
                }
                return "{ " + str + " }";
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
    };
    return schema;
}());
exports.schema = schema;
var doc = /** @class */ (function () {
    function doc(d) {
        this.name = d.name;
        this.summary = d.summary;
        this.description = d.description;
        if (d.parameters) {
            var parameters = [];
            for (var _i = 0, _a = d.parameters; _i < _a.length; _i++) {
                var p = _a[_i];
                parameters.push(new parameter(p));
            }
            this.parameters = parameters;
        }
        if (d.responses) {
            var responses = [];
            for (var _b = 0, _c = d.responses; _b < _c.length; _b++) {
                var res = _c[_b];
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
    doc.prototype.containsParams = function () {
        return this.parameters && this.parameters.length > 0;
    };
    doc.prototype.parametersContainsFrom = function (f) {
        if (this.parameters) {
            for (var _i = 0, _a = this.parameters; _i < _a.length; _i++) {
                var p = _a[_i];
                if (p.in === f) {
                    return true;
                }
            }
        }
        return false;
    };
    doc.prototype.getInputParams = function () {
        var params = '';
        var init = function (ok, part) {
            if (ok) {
                if (params.length > 0)
                    params += ', ';
                params += part;
            }
        };
        init(this.parametersContainsFrom(from.url), 'url');
        init(this.parametersContainsFrom(from.header), 'header');
        init(this.parametersContainsFrom(from.body), 'body');
        return "{ " + params + " }";
    };
    return doc;
}());
exports.doc = doc;
var path = /** @class */ (function () {
    function path(p, components) {
        this.method = p.method;
        this.path = p.path;
        this.components = p.components;
        if (p.components && p.components.length) {
            var cs = [];
            for (var _i = 0, _a = p.components; _i < _a.length; _i++) {
                var cIdx = _a[_i];
                var c = components[cIdx];
                if (c.containsParams()) {
                    cs.push(c);
                }
            }
            this._components = cs;
        }
        this.body_encode_type = p.body_encode_type ? p.body_encode_type : '';
        this.doc = new doc(p.doc);
    }
    path.prototype.containsParams = function () {
        return this.doc.containsParams();
    };
    path.prototype.componentContainsParams = function () {
        if (this._components && this._components.length) {
            for (var _i = 0, _a = this.components; _i < _a.length; _i++) {
                var cIdx = _a[_i];
                if (this._components[cIdx].containsParams()) {
                    return true;
                }
            }
        }
        return false;
    };
    path.prototype.getComponentsInstance = function () {
        return this._components;
    };
    return path;
}());
exports.path = path;
var group = /** @class */ (function () {
    function group(g, components) {
        if (g.paths) {
            var paths = [];
            for (var _i = 0, _a = g.paths; _i < _a.length; _i++) {
                var p = _a[_i];
                paths.push(new path(p, components));
            }
            this.paths = paths;
        }
        this.name = g.name;
        this.description = g.description;
        this.index = camelize(g.name);
    }
    return group;
}());
exports.group = group;
var morgine = /** @class */ (function () {
    function morgine(dt) {
        if (dt['components']) {
            var components = [];
            for (var _i = 0, _a = dt['components']; _i < _a.length; _i++) {
                var c = _a[_i];
                components.push(new doc(c));
            }
            this.components = components;
        }
        if (dt['groups']) {
            var groups = [];
            for (var _b = 0, _c = dt['groups']; _b < _c.length; _b++) {
                var c = _c[_b];
                groups.push(new group(c, this.components));
            }
            this.groups = groups;
        }
    }
    return morgine;
}());
exports.morgine = morgine;
function camelize(str) {
    str = str.replace(/[\-_\s]+(.)?/g, function (match, chr) {
        return chr ? chr.toUpperCase() : '';
    });
    // Ensure 1st char is always lowercase
    return str.substr(0, 1).toLowerCase() + str.substr(1);
}
