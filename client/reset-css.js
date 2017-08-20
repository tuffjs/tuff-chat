var localCss = '\
  #here:after {\
    position: absolute; top: 20px; color: red;\
    content: \'Hi \" there \"\';\
  }\
  html {\
    font-family: sans-serif-light, -apple-system, "Segoe UI", "Liberation Sans";\
    font-style: normal;\
    font-size: 14px;\
    line-height: 20px;\
    /* color: #777; */\
    font-weight: 300;\
    /* background-color: #30004F; */\
\
    /* background-image: url("http://georgebenainous.com/web/code/layout_grid.gif");*/\
    background-image: url("layout_grid.gif");\
    background-repeat: repeat;\
  }\
';

var cssString = require('./reset-css-min');

var cssSheet = document.createElement('style');
cssSheet.innerHTML = cssString + localCss;
document.head.appendChild(cssSheet);

/*
var sheet = window.document.styleSheets[0];
sheet.insertRule(localCss,
  sheet.cssRules.length);
*/

module.exports = {
};

