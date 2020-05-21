"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.render = void 0;
let filepath = require('path');
const Handlebars = require('handlebars');
let fs = require('fs');
function readTemplate(name) {
    return fs.readFileSync(filepath.join('./templates', name + '.hbs'), 'utf8');
}
const types_1 = require("./types");
let cptGetters = Handlebars.compile(readTemplate('components/getters'));
let cptIndex = Handlebars.compile(readTemplate('components/index'));
let cptMutations = Handlebars.compile(readTemplate('components/mutations'));
let cptState = Handlebars.compile(readTemplate('components/state'));
let gpIndex = Handlebars.compile(readTemplate('groups/index'));
let index = Handlebars.compile(readTemplate('index'));
let getters = Handlebars.compile(readTemplate('getters'));
function render(dir, data) {
    let mg = new types_1.morgine(data);
    dir = filepath.join(dir, 'store');
    let groupsDir = filepath.join(dir, 'groups');
    renderComponents(filepath.join(dir, 'components'), mg.components);
    for (let gp of mg.groups) {
        let components = [];
        for (let path of gp.paths) {
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
    writeFile(filepath.join(dir, 'getters.js'), getters({ groups }));
}
function renderGroupsIndex(dir, groups) {
    fs.mkdirSync(dir, { recursive: true });
    writeFile(filepath.join(dir, 'index.js'), gpIndex({ groups }));
}
function renderComponents(dir, components) {
    fs.mkdirSync(dir, { recursive: true });
    writeFile(filepath.join(dir, 'getters.js'), cptGetters({ components }));
    writeFile(filepath.join(dir, 'mutations.js'), cptMutations({ components }));
    writeFile(filepath.join(dir, 'state.js'), cptState({ components }));
    writeFile(filepath.join(dir, 'index.js'), cptIndex());
}
function writeFile(filename, data) {
    fs.writeFileSync(filename, data);
}
