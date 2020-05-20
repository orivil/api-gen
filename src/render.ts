let filepath = require('path')
const Handlebars = require("handlebars");
let fs = require("fs")

function readTemplate(name: string): string {
    return fs.readFileSync(filepath.join('./templates', name + '.hbs'), 'utf8')
}

import {morgine, group, doc} from './types'

let cptGetters = Handlebars.compile(readTemplate('components/getters'))
let cptIndex = Handlebars.compile(readTemplate('components/index'))
let cptMutations = Handlebars.compile(readTemplate('components/mutations'))
let cptState = Handlebars.compile(readTemplate('components/state'))
let gpIndex = Handlebars.compile(readTemplate('groups/index'))
let index = Handlebars.compile(readTemplate('index'))
let getters = Handlebars.compile(readTemplate('getters'))

export function render(dir: string, data: object) {
    let mg = new morgine(data)
    dir = filepath.join(dir, 'store')
    let groupsDir = filepath.join(dir, 'groups')
    renderComponents(filepath.join(dir, 'components'), mg.components)
    for (let gp of mg.groups) {
        let components: doc[] = []
        for (let path of gp.paths) {
            components.push(path.doc)
        }
        renderComponents(filepath.join(groupsDir, gp.index), components)
    }
    renderGroupsIndex(groupsDir, mg.groups)
    renderIndex(dir)
    renderGetters(dir, mg.groups)
}

function renderIndex(dir: string) {
    fs.mkdirSync(dir, {recursive: true})
    writeFile(filepath.join(dir, 'index.js'), index())
}

function renderGetters(dir: string, groups: group[]) {
    fs.mkdirSync(dir, {recursive: true})
    writeFile(filepath.join(dir, 'getters.js'), getters({groups}))
}

function renderGroupsIndex(dir: string, groups: group[]) {
    fs.mkdirSync(dir, {recursive: true})
    writeFile(filepath.join(dir, 'index.js'), gpIndex({groups}))
}

function renderComponents(dir: string, components: doc[]) {
    fs.mkdirSync(dir, {recursive: true})
    writeFile(filepath.join(dir, 'getters.js'), cptGetters({components}))
    writeFile(filepath.join(dir, 'mutations.js'), cptMutations({components}))
    writeFile(filepath.join(dir, 'state.js'), cptState({components}))
    writeFile(filepath.join(dir, 'index.js'), cptIndex())
}

function writeFile(filename: string, data: string) {
    fs.writeFileSync(filename, data)
}
