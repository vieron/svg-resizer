#!/usr/bin/env node

require('shelljs/global');
var path = require('path');
var fs = require('fs-extra');
var _ = require('lodash');
var xml2js = require('xml2js');
var builder = new xml2js.Builder();
var parseString = xml2js.parseString;

var ptToPx = function(pt) {
    return pt * dpi * (1 / 72);
};
var pxToPt = function(px) {
    return px / (dpi * (1 / 72));
};


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

var dpi = 96;
var svgFiles = opts._;
var finalWidth = pxToPt(opts.width || opts.height);
var finalHeight = pxToPt(opts.height || opts.width);
var finalRatio = finalWidth / finalHeight;


svgFiles.forEach(function(svgPath) {

    if (opts.fit) {
        var origWidth, origHeight;
        var newWidth, newHeight;
        var fileContent = fs.readFileSync(svgPath, 'utf8');

        parseString(fileContent, function (err, parsedFileContent) {
            origWidth = pxToPt(parseInt(parsedFileContent.svg.$.width, 10));
            origHeight = pxToPt(parseInt(parsedFileContent.svg.$.height, 10));
        });

        var origRatio = origWidth / origHeight;

        if (origRatio < finalRatio) {
            newHeight = finalHeight;
            newWidth = origWidth / (origHeight / newHeight);
            newWidth = Math.floor(newWidth);
        } else {
            newWidth = finalWidth;
            newHeight = origHeight / (origWidth / newWidth);
            newHeight = Math.floor(newHeight);
        }

        opts.width = newWidth;
        opts.height = newHeight;
    }

    // build args
    var outputPath =  opts.output ? path.join(opts.output, path.basename(svgPath, '.svg') + '.' + opts.format) : '';

    var args = _.compact([
        opts.width ? '-w ' + opts.width : null,
        opts.height ? '-h ' + opts.height : null,
        '--keep-aspect-ratio',
        '--dpi-x 90', // work with pixels
        '--dpi-y 90', // work with pixels
        '-f ' + opts.format,
        svgPath,
        '-o ' + outputPath
    ]);

    // print rsvg command
    echo('rsvg-convert ' + args.join(' '));

    // resize file with librsvg
    var convert = exec('rsvg-convert ' + args.join(' '));

    if (convert.code !== 0) {
        echo('Error converting file: ' + svgPath);
    }

    // read resized file and change pt to px
    var resizedFileContent = fs.readFileSync(outputPath, 'utf8');

    parseString(resizedFileContent, function (err, parsedFileContent) {
        var w = parsedFileContent.svg.$.width;
        var h = parsedFileContent.svg.$.height;

        w = w.match(/pt$/) ? ptToPx(parseInt(w, 10)) + 'px' : w;
        h = h.match(/pt$/) ? ptToPx(parseInt(h, 10)) + 'px' : h;

        parsedFileContent.svg.$.width = w;
        parsedFileContent.svg.$.height = h;
        // parsedFileContent.svg.$.viewBox = [0, 0, parseInt(w, 10), parseInt(h, 10)].join(' ');

        var finalSVG = builder.buildObject(parsedFileContent);
        fs.outputFileSync(outputPath, finalSVG);
    });

});

exit(0);