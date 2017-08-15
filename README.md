# tuff-chat
A Comprehensive Example of How To Use TuffJS in Production

## Demo
Open https://tuff-chat.herokuapp.com/ in your browser.

## Passwords Security
See https://crackstation.net/hashing-security.htm on best practices of how to "store" passwords in secure way.

## Mobile window bugs and limitations

There's no guarantee on precise scrolling detection. Browsers always
round down real sizes.

```
  var scale = 1 / window.devicePixelRatio;

  // Real pixels doesn't work good in Web. Forget it.
  // Use scale to load images with high DPI and to construct
  // precise pixel width of lines and/ other elements.
  //
  // Meta viewport has bugs if set not to 1 and device-width.
  // After page reload it can suddenly change current window size.
  // Also it sets incorrect size if smaller size was rounded.
  // And it's absolutely impossible to determine physical screen size.
  // If using full-page scaling, iOS Safari and old Android browser
  // downscale background and cut edges. Also old Android browser
  // scrolls controls independendtly from CSS background when focusing.

  //var scaleExpr = 'scale(' + scale + ', ' + scale + ')';
  //document.documentElement.style['-ms-transform'] = scaleExpr;
  //document.documentElement.style['-webkit-transform'] = scaleExpr;
  //document.documentElement.style['transform'] = scaleExpr;

/*
  // TODO: find a way to reliably detect real window width.
  var realWidth = document.documentElement.getBoundingClientRect().right
    * window.devicePixelRatio;

  realWidth = Math.ceil(realWidth, 1);

  var realWidthRound = realWidth % 2;
  var difference = 1;
  if (realWidthRound) {
    // realWidth -= realWidthRound;
    var physWidth = realWidth - realWidthRound;
    difference = realWidth / physWidth;
    //scale *= difference;
  }


  // Android Chrome 4.2.2 scales incorrectly when downscaled
  // width was rounded (when device's scale doesn't provide
  // rounding-free sizes). Chrome just will multiply that value
  // instead of using some "internal" correct size.
  // Chrome stores size as integer.
  // Android 4.2.2 native browser scales things absolutely
  // incorrectly.
  metaViewport.setAttribute('content', 'width=device-width, ' + // 'width=' + realWidth +
    'initial-scale=' + scale +
    ', minimum-scale=' + scale + ', maximum-scale=' + scale);

  if (document.documentElement.clientWidth !== realWidth) {
    // Several cases are possible:
    // 1. Screen width can't be integer in downscale mode
    // 2. Meta tag doesn't work

    if (document.documentElement.clientWidth - realWidth > 1) {

      console.log('Meta doesn\'t work',
        document.documentElement.clientWidth, realWidth);
 
      // Meta doesn't work:
      metaViewport.setAttribute('content', 'width=' + realWidth +
        ', initial-scale=' + scale * difference +
        ', minimum-scale=' + scale * difference +
        ', maximum-scale=' + scale * difference);
    } else {
      console.log('Uneven DPI');
      metaViewport.setAttribute('content',
        'initial-scale=' + scale * difference +
        ', minimum-scale=' + scale * difference +
        ', maximum-scale=' + scale * difference);
    }
  }
*/

  // TODO: check that meta tag actually worked.
  // If it doesn't, just set width=device-width instead
  // and downscale to the low dpi for old Androids.

  console.log(scale, window.innerWidth, window.innerHeight);
```

