const postcss = require('postcss')
const dedent = require('dedent')

const plugin = require('../')

async function run (input, output, opts = { }) {
  const result = await postcss([plugin(opts)]).process(input, { from: undefined })
  expect(result.css).toEqual(output)
  expect(result.warnings()).toHaveLength(0)
}

it('iterates through a basic map', async () => {
  await run(
    `
    .u-display {
      @each-in-map $display-name, $display-type in display_types {
        &$(display-name) {
          display: $display-type;
        }
      }
    }
    `,
    `
    .u-display {
      @each $display-name, $display-type in (None, InlineBlock, InlineFlex, Block, Flex, Grid), (none, inline-block, inline-flex, block, flex, grid) {
        &$(display-name) {
          display: $display-type;
        }
      }
    }
    `,
    {
      basePath: 'test/fixtures'
    }
  )
})

it('iterates through a map with multiple values per key', async () => {
  await run(
    dedent`
    @each $space, $space-index in 0, 5px, 10px, 15px, 30px, 45px, 60px {
      @each-in-map $direction, $direction-attribute in direction_map {
        $(direction)$(space-index) {
          $(direction-attribute): $space !important;
        }
      }
    }
    `,
    dedent`
    @each $space, $space-index in 0, 5px, 10px, 15px, 30px, 45px, 60px {
      @each $direction, $direction-attribute in (X, X, Y, Y, A, T, B, L, R), (-left, -right, -top, -bottom, , -top, -bottom, -left, -right) {
        $(direction)$(space-index) {
          $(direction-attribute): $space !important;
        }
      }
    }
    `,
    {
      basePath: 'test/fixtures'
    }
  )
})

it('iterates through a map while destructuring values from an array', async () => {
  await run(
    dedent`
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
    `,
    dedent`
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
    `,
    {
      basePath: 'test/fixtures'
    }
  )
})
