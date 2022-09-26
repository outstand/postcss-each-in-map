const path = require('path');
const { readFileSync } = require('fs')

const SEPARATOR = /\s+in\s+/;

function checkParams(params) {
  if (!SEPARATOR.test(params)) return 'Missed "in" keyword in @each-in-map';

  const [names, map] = params.split(SEPARATOR).map(str => str.trim());

  if (!names.match(/\$[_a-zA-Z]?\w+/)) return 'Missed variable names in @each-in-map';
  if (!map.match(/(\w+\s?)+/)) return 'Missed map in @each-in-map';

  return null;
}

function tokenize(str, helpers) {
  return helpers.postcss.list.comma(str).map(str => str.replace(/^\$/, ''));
}

function paramsList(params, helpers) {
  let [names, map] = params.split(SEPARATOR).map(param => tokenize(param, helpers));

  return {
    names: names,
    keyName: names[0],
    valNames: names.slice(1),
    map: map
  };
}

function processRules(rule, params, helpers, maps) {
  var map = maps[params.map[0]]

  var numVals = params.valNames.length

  var keys =
    Object.keys(map).flatMap(key => {
      var length = 1
      if (typeof(map[key]) === "object" && Array.isArray(map[key])) {
        length = map[key].length - (numVals - 1)
      }
      return Array(length).fill(key)
    })

  // [[1, 2, 3], [4, 5, 6], 7] -> [[1, 4, 7], [2, 5], [3, 6]]

  var vals = Array.from(Array(numVals), () => new Array())
  Object.values(map).forEach(value => {
    if (typeof(value) === "object" && Array.isArray(value)) {
      value.forEach((v, i) => {
        if (i < numVals) {
          vals[i].push(v)
        }
      })
    } else {
      vals[0].push(value)
    }
  })

  var valsString = vals.map(v => `(${v})`).join(', ')
  var at_rule = helpers.postcss.atRule({
    name: "each",
    params: `${params.names.map(param => `$${param}`).join(', ')} in (${keys}), ${valsString}`,
    source: rule.source
  })

  at_rule.append(rule.nodes)
  rule.replaceWith(at_rule)
}

function each_in_map(rule, helpers, maps) {
  const params  = ` ${rule.params} `;
  const error   = checkParams(params);
  if (error) throw rule.error(error);

  const parsedParams = paramsList(params, helpers);
  processRules(rule, parsedParams, helpers, maps);
  rule.remove()
}

/**
 * @type {import('postcss').PluginCreator}
 */
module.exports = (opts = {}) => {
  opts = {
    basePath: process.cwd(),
    jsonPath: "maps.json",
    ...opts,
  }

  if (!path.isAbsolute(opts.basePath)) {
    opts.basePath = path.join(process.cwd(), opts.basePath)
  }

  opts.jsonPath = path.resolve(opts.basePath, opts.jsonPath)

  return {
    postcssPlugin: 'postcss-each-in-map',
    prepare() {
      let maps = {}

      return {
        Once(root) {
          let content = readFileSync(opts.jsonPath)
          maps = JSON.parse(content)
        },
        AtRule: {
          'each-in-map': (node, helpers) => {
            each_in_map(node, helpers, maps)
          }
        }
      }
    }
  }
}

module.exports.postcss = true
