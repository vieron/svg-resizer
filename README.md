# svg-resizer

Basic cli utility to batch resize svg files

# Requirements

Svg-resizer requires `libsrvg2` to resize SVG files.

Install it with `sudo apt-get install librsvg2-bin` on Linux or with `brew install librsvg` on OSX.

# Usage

    $ ./svg-resizer.js -f -x 20 -y 20 -o example/resized/ example/*.svg

# Options

- **width** `-x` `--width`

  Output SVG width.

- **height** `-y` `--height`

  Output SVG height.

- **fit** `-f` `--fit`

  Fit to specified dimensions preserving aspect ratio.

- **format** `-e` `--format`

  Output format, but default is `svg` but can be `png`, `pdf`, `ps`, `svg` or `xml`.

- **output** `-o` `--output`

  Destination folder.
