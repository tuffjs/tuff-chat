const path = require('path');
const workingDir = process.cwd();

let cssFilename = '/public/index.css';
let cssJsFilename = '/client/reset-css.js';
cssFilename = path.join(workingDir, cssFilename);
cssJsFilename = path.join(workingDir, cssJsFilename);

const fs = require('fs');
const postcss = require('postcss');

//const precss = require('precss');
//const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');

fs.readFile(cssFilename, (err, css) => {
  postcss([cssnano])
    .process(css, { from: cssFilename, to: cssJsFilename })
    .then(result => {

      const jsCssString =
       `var cssSheet = document.createElement('style');
        cssSheet.innerHTML = '${ result.css }';
        document.head.appendChild(cssSheet);`;

      fs.writeFile(cssJsFilename, jsCssString, () => {
        //if ( result.map ) {
        //  fs.writeFile('dest/app.css.map', result.map);
        //}
      });
    });
});

module.exports = {
};
