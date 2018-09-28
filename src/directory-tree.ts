import * as FS from 'fs'
import * as PATH from 'path'

const constants = {
  DIRECTORY: 'directory',
  FILE: 'file',
}

function readDir (path: string) {
  return new Promise<string[]>((resolve) => {
    FS.readdir(path, (err, files) => {
      if (err) {
        if (err) throw err
        resolve(files)
      }
    })
  })
}

function stat (path: string) {
  return new Promise<FS.Stats>((resolve) => {
    FS.stat(path, (err, stats) => {
      if (err) throw err
      resolve(stats)
    })
  })
}

/**
 * Normalizes windows style paths by replacing double backslahes with single forward slahes (unix style).
 */
function normalizePath (path: string) {
  return path.replace(/\\/g, '/')
}

/**
 * Tests if the supplied parameter is of type RegExp
 */
function isRegExp (regExp: any) {
  return typeof regExp === 'object' && regExp.constructor === RegExp
}

interface Tree {
  path: string,
  name: string,
  size: number,
  type: string,
  extension?: string,
  children: (Tree | null)[],
}

export async function createTree (
  path: string,
  options?: {
    normalizePath?: boolean,
    exclude?: RegExp | RegExp[],
    extensions?: RegExp,
  },
  onEachFile?: (item: Tree, path: string) => void,
): Promise<Tree | null> {
  let tree: Tree
  const name = PATH.basename(path)
  path = options && options.normalizePath ? normalizePath(path) : path
  const stats = await stat(path)

	// Skip if it matches the exclude regex
  if (options && options.exclude) {
    const excludes = isRegExp(options.exclude) ? [options.exclude] as RegExp[] : options.exclude as RegExp[]
    if (excludes.some((exclusion) => exclusion.test(path))) {
      return null
    }
  }

  if (stats.isFile()) {
    const ext = PATH.extname(path).toLowerCase()

		// Skip if it does not match the extension regex
    if (options && options.extensions && !options.extensions.test(ext)) {
      return null
    }

    tree = {
      children: [],
      extension: ext,
      name: name,
      path: path,
      size: stats.size,
      type: constants.FILE,
    }

    if (onEachFile) {
      onEachFile(tree, path)
    }
  } else if (stats.isDirectory()) {
    let dirData = await readDir(path)
    if (dirData === null) return null

    const children = await Promise.all(dirData
			.map(child => createTree(PATH.join(path, child), options, onEachFile))
      .filter(e => !!e))

    tree = {
      children: children,
      name: name,
      path: path,
      size: children.reduce((prev, cur) => prev + (cur ? cur.size : 0), 0),
      type: constants.DIRECTORY,
    }

    return tree
  } else {
    return null // Or set item.size = 0 for devices, FIFO and sockets ?
  }

  return tree
}
