const path = require('path')
const { readFileSync } = require('fs')

const SEPARATOR = /\s+in\s+/

function checkParams (params) {
  if (!SEPARATOR.test(params)) return 'Missed "in" keyword in @each-in-map'

  const [names, map] = params.split(SEPARATOR).map(str => str.trim())

  if (!names.match(/\$[_a-zA-Z]?\w+/)) return 'Missed variable names in @each-in-map'
  if (!map.match(/(\w+\s?)+/)) return 'Missed map in @each-in-map'

  return null
}

function tokenize (str, helpers) {
  return helpers.postcss.list.comma(str).map(str => str.replace(/^\$/, ''))
}

function paramsList (params, helpers) {
  const [names, map] = params.split(SEPARATOR).map(param => tokenize(param, helpers))

  return {
    names,
    keyName: names[0],
    valNames: names.slice(1),
    map
  }
}

function keysVals (map, numVals) {
  const keys =
    Object.keys(map).flatMap(key => {
      let length = 1
      if (typeof (map[key]) === 'object' && Array.isArray(map[key])) {
        length = map[key].length - (numVals - 1)
      }
      return Array(length).fill(key)
    })

  const vals = [Object.values(map)]

  return {
    keys,
    vals
  }
}

// [[1, 2, 3], [4, 5, 6], 7] -> [[1, 4, 7], [2, 5], [3, 6]]
function keysValsForDestructuring (map, numVals) {
  const keys = Object.keys(map)

  const vals = Array.from(Array(numVals), () => new Array())
  Object.values(map).forEach(value => {
    if (typeof (value) === 'object' && Array.isArray(value)) {
      value.forEach((v, i) => {
        if (i < numVals) {
          vals[i].push(v)
        }
      })
    } else {
      vals[0].push(value)
    }
  })

  return {
    keys,
    vals
  }
}

function valsAsString (vals) {
  return vals.map(v => {
    if (typeof v === 'object' && Array.isArray(v)) {
      return `(${v.flat().join(', ')})`
    }

    return `(${v})`
  }).join(', ')
}

function processRules (rule, params, helpers, maps) {
  const map = maps[params.map[0]]
  const numVals = params.valNames.length

  if (numVals > 1) {
    var { keys, vals } = keysValsForDestructuring(map, numVals)
  } else {
    var { keys, vals } = keysVals(map, numVals)
  }

  const atRule = helpers.postcss.atRule({
    name: 'each',
    params: `${params.names.map(param => `$${param}`).join(', ')} in (${keys.join(', ')}), ${valsAsString(vals)}`,
    source: rule.source
  })

  atRule.append(rule.nodes)
  rule.replaceWith(atRule)
}

function eachInMap (rule, helpers, maps) {
  const params = ` ${rule.params} `
  const error = checkParams(params)
  if (error) throw rule.error(error)

  const parsedParams = paramsList(params, helpers)
  processRules(rule, parsedParams, helpers, maps)
  rule.remove()
}

/**
 * @type {import('postcss').PluginCreator}
 */
module.exports = (opts = {}) => {
  opts = {
    basePath: process.cwd(),
    jsonPath: 'maps.json',
    ...opts
  }

  if (!path.isAbsolute(opts.basePath)) {
    opts.basePath = path.join(process.cwd(), opts.basePath)
  }

  opts.jsonPath = path.resolve(opts.basePath, opts.jsonPath)

  let maps = {}

  return {
    postcssPlugin: 'postcss-each-in-map',
    Once (root) {
      const content = readFileSync(opts.jsonPath)
      maps = JSON.parse(content)
    },
    AtRule: {
      'each-in-map': (node, helpers) => {
        eachInMap(node, helpers, maps)
      }
    }
  }
}

module.exports.postcss = true
