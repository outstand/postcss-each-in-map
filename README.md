# postcss-each-in-map

[PostCSS] plugin to iterate through maps.

[PostCSS]: https://github.com/postcss/postcss

Iterate through a map:
```css
.u-display {
  @each-in-map $display-name, $display-type in display_types {
    &$(display-name) {
      display: $display-type;
    }
  }
}
```

```css
.u-display {
  @each $display-name, $display-type in (None, InlineBlock, InlineFlex, Block, Flex, Grid), (none, inline-block, inline-flex, block, flex, grid) {
    &$(display-name) {
      display: $display-type;
    }
  }
}
```

Iterate through a map with multiple (and missing) values:
```css
@each $space, $space-index in 0, 5px, 10px, 15px, 30px, 45px, 60px {
  @each-in-map $direction, $direction-attributes in direction_map {
    $(direction)$(space-index) {
      @each $direction-attribute in $direction-attributes {
        $(direction-attribute): $space !important;
      }
    }
  }
}
```

```css
@each $space, $space-index in 0, 5px, 10px, 15px, 30px, 45px, 60px {
  @each $direction, $direction-attributes in (X, X, Y, Y, A, T, B, L, R), (-left, -right, -top, -bottom, , -top, -bottom, -left, -right) {
    $(direction)$(space-index) {
      @each $direction-attribute in $direction-attributes {
        $(direction-attribute): $space !important;
      }
    }
  }
}
```

Iterate through a map while destructuring array values:
```css
@each-in-map $class, $background, $label_width in graph_parts {
  $(class) {
    .metrics-graph-part-number:before {
      background: $background;
    }

    .metrics-graph-part-number,
    .metrics-graph-part-label {
      width: $label_width;
    }
  }
}
```

```css
@each $class, $background, $label_width in (opt-outs, clicks, opens, bounces, unactioned), ($mango_tango, var(--color-a11y-blue), $funk, $agrellan_badland, $hint_of_mauve_pansy), (52px, 36px, 35px, 49px, auto) {
  $(class) {
    .metrics-graph-part-number:before {
      background: $background;
    }

    .metrics-graph-part-number,
    .metrics-graph-part-label {
      width: $label_width;
    }
  }
}
```

Example json:
```json
{
  "display_types": {
    "None": "none",
    "InlineBlock": "inline-block",
    "InlineFlex": "inline-flex",
    "Block": "block",
    "Flex": "flex",
    "Grid": "grid"
  },
  "direction_map": {
    "X": [
      "-left",
      "-right"
    ],
    "Y": [
      "-top",
      "-bottom"
    ],
    "A": "",
    "T": "-top",
    "B": "-bottom",
    "L": "-left",
    "R": "-right"
  },
  "graph_parts": {
    "opt-outs": [
      "$mango_tango",
      "52px",
      "top"
    ],
    "clicks": [
      "var(--color-a11y-blue)",
      "36px",
      "bottom"
    ],
    "opens": [
      "$funk",
      "35px",
      "top"
    ],
    "bounces": [
      "$agrellan_badland",
      "49px",
      "bottom"
    ],
    "unactioned": [
      "$hint_of_mauve_pansy",
      "auto",
      "bottom"
    ]
  }
}
```

## Usage

**Step 1:** Install plugin:

```sh
npm install --save-dev postcss postcss-each-in-map
```

**Step 2:** Check you project for existed PostCSS config: `postcss.config.js`
in the project root, `"postcss"` section in `package.json`
or `postcss` in bundle config.

If you do not use PostCSS, add it according to [official docs]
and set this plugin in settings.

**Step 3:** Add the plugin to plugins list:

```diff
module.exports = {
  plugins: [
+   require('postcss-each-in-map'),
+   require('postcss-each'),
    require('autoprefixer')
  ]
}
```

[official docs]: https://github.com/postcss/postcss#usage
