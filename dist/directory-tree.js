"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const FS = require("fs");
const PATH = require("path");
const constants = {
    DIRECTORY: 'directory',
    FILE: 'file',
};
function readDir(path) {
    return new Promise((resolve) => {
        FS.readdir(path, (err, files) => {
            if (err) {
                if (err)
                    throw err;
                resolve(files);
            }
        });
    });
}
function stat(path) {
    return new Promise((resolve) => {
        FS.stat(path, (err, stats) => {
            if (err)
                throw err;
            resolve(stats);
        });
    });
}
/**
 * Normalizes windows style paths by replacing double backslahes with single forward slahes (unix style).
 */
function normalizePath(path) {
    return path.replace(/\\/g, '/');
}
/**
 * Tests if the supplied parameter is of type RegExp
 */
function isRegExp(regExp) {
    return typeof regExp === 'object' && regExp.constructor === RegExp;
}
function createTree(path, options, onEachFile) {
    return __awaiter(this, void 0, void 0, function* () {
        let tree;
        const name = PATH.basename(path);
        path = options && options.normalizePath ? normalizePath(path) : path;
        const stats = yield stat(path);
        // Skip if it matches the exclude regex
        if (options && options.exclude) {
            const excludes = isRegExp(options.exclude) ? [options.exclude] : options.exclude;
            if (excludes.some((exclusion) => exclusion.test(path))) {
                return null;
            }
        }
        if (stats.isFile()) {
            const ext = PATH.extname(path).toLowerCase();
            // Skip if it does not match the extension regex
            if (options && options.extensions && !options.extensions.test(ext)) {
                return null;
            }
            tree = {
                children: [],
                extension: ext,
                name: name,
                path: path,
                size: stats.size,
                type: constants.FILE,
            };
            if (onEachFile) {
                onEachFile(tree, path);
            }
        }
        else if (stats.isDirectory()) {
            let dirData = yield readDir(path);
            if (dirData === null)
                return null;
            const children = yield Promise.all(dirData
                .map(child => createTree(PATH.join(path, child), options, onEachFile))
                .filter(e => !!e));
            tree = {
                children: children,
                name: name,
                path: path,
                size: children.reduce((prev, cur) => prev + (cur ? cur.size : 0), 0),
                type: constants.DIRECTORY,
            };
            return tree;
        }
        else {
            return null; // Or set item.size = 0 for devices, FIFO and sockets ?
        }
        return tree;
    });
}
exports.createTree = createTree;
