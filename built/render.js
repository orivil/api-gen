"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.render = void 0;
var filepath = require('path');
var Handlebars = require("handlebars");
var fs = require("fs");
function readTemplate(name) {
    return fs.readFileSync(filepath.join('./templates', name + '.hbs'), 'utf8');
}
var types_1 = require("./types");
var cptGetters = Handlebars.compile(readTemplate('components/getters'));
var cptIndex = Handlebars.compile(readTemplate('components/index'));
var cptMutations = Handlebars.compile(readTemplate('components/mutations'));
var cptState = Handlebars.compile(readTemplate('components/state'));
var gpIndex = Handlebars.compile(readTemplate('groups/index'));
var index = Handlebars.compile(readTemplate('index'));
var getters = Handlebars.compile(readTemplate('getters'));
function render(dir, data) {
    var mg = new types_1.morgine(data);
    dir = filepath.join(dir, 'store');
    var groupsDir = filepath.join(dir, 'groups');
    renderComponents(filepath.join(dir, 'components'), mg.components);
    for (var _i = 0, _a = mg.groups; _i < _a.length; _i++) {
        var gp = _a[_i];
        var components = [];
        for (var _b = 0, _c = gp.paths; _b < _c.length; _b++) {
            var path = _c[_b];
            components.push(path.doc);
        }
        renderComponents(filepath.join(groupsDir, gp.index), components);
    }
    renderGroupsIndex(groupsDir, mg.groups);
    renderIndex(dir);
    renderGetters(dir, mg.groups);
}
exports.render = render;
function renderIndex(dir) {
    fs.mkdirSync(dir, { recursive: true });
    writeFile(filepath.join(dir, 'index.js'), index());
}
function renderGetters(dir, groups) {
    fs.mkdirSync(dir, { recursive: true });
    writeFile(filepath.join(dir, 'getters.js'), getters({ groups: groups }));
}
function renderGroupsIndex(dir, groups) {
    fs.mkdirSync(dir, { recursive: true });
    writeFile(filepath.join(dir, 'index.js'), gpIndex({ groups: groups }));
}
function renderComponents(dir, components) {
    fs.mkdirSync(dir, { recursive: true });
    writeFile(filepath.join(dir, 'getters.js'), cptGetters({ components: components }));
    writeFile(filepath.join(dir, 'mutations.js'), cptMutations({ components: components }));
    writeFile(filepath.join(dir, 'state.js'), cptState({ components: components }));
    writeFile(filepath.join(dir, 'index.js'), cptIndex());
}
function writeFile(filename, data) {
    fs.writeFileSync(filename, data);
}
