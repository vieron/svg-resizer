#!/usr/bin/env node

require('shelljs/global');
var path = require('path');
var fs = require('fs-extra');
var _ = require('lodash');
var xml2js = require('xml2js');
var parseString = xml2js.parseString;


if (!which('rsvg-convert')) {
  echo('rsvg-convert bin from libsrvg is required');
  exit(1);
}


var opts = require("nomnom")
   .option('width', {
      abbr: 'x',
      help: 'Output svg width'
   })
   .option('height', {
      abbr: 'y',
      help: 'Output svg height'
   })
   .option('fit', {
      abbr: 'f',
      flag: true,
      help: 'Fit to specified dimensions preserving aspect ratio'
   })
   .option('output', {
      abbr: 'o',
      default: 'resized/',
      help: 'Output svg path'
   })
   .option('format', {
      abbr: 'e',
      default: 'svg',
      help: 'Output file format'
   })
   .parse();


// create output folder if dont exist
mkdir('-p', path.join(opts.output));

var svgFiles = opts._;
var finalWidth = opts.width || opts.height;
var finalHeight = opts.height || opts.width;
var finalRatio = finalWidth / finalHeight;

var pxToPt = function(px) {
    return px * 0.75;
};

svgFiles.forEach(function(svgPath) {

    if (opts.fit) {
        var origWidth, origHeight;
        var newWidth, newHeight;
        var fileContent = fs.readFileSync(svgPath, 'utf8');

        parseString(fileContent, function (err, parsedFileContent) {
            origWidth = parseInt(parsedFileContent.svg.$.width, 10);
            origHeight = parseInt(parsedFileContent.svg.$.height, 10);
        });

        var origRatio = origWidth / origHeight;

        if (origRatio < finalRatio) {
            newHeight = finalHeight;
            newWidth = origWidth / (origHeight / newHeight);
        } else {
            newWidth = finalWidth;
            newHeight = origHeight / (origWidth / newWidth);
        }

        opts.width = newWidth;
        opts.height = newHeight;
    }

    // build args
    var outputPath =  opts.output ? path.join(opts.output, path.basename(svgPath, '.svg') + '.' + opts.format) : '';

    var args = _.compact([
        opts.width ? '-w ' + pxToPt(opts.width) : null,
        opts.height ? '-h ' + pxToPt(opts.height) : null,
        '--keep-aspect-ratio',
        '-f ' + opts.format,
        svgPath,
        opts.output ? '-o ' + outputPath : null
    ]);

    echo('rsvg-convert ' + args.join(' '));

    var convert = exec('rsvg-convert ' + args.join(' '));
    if (convert.code !== 0) {
        echo('Error converting file: svgPath');
    }
});

exit(0);