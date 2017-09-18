// First line executed ever
window.lastNavigationTimestamp = new Date().valueOf();

window.JAVASCRIPT_BUNDLE_HASH = 'REPLACE_WEBPACK_HASH'; // Will be replaced by compiler after bundling
console.log('Bundle version', window.JAVASCRIPT_BUNDLE_HASH);

var hotUpdate = false;

if (window.bundleLoadedTimestamp) {
  hotUpdate = true;
  console.log('MIGRATING GLOBAL ASSETS...');
}


// Debugging support
if (!hotUpdate) {

  var ws = require('./websocket');

  var DEBUG = true;

  var debug = DEBUG ? require('./debug')(ws.send) : null;

  var hotUpdate = require('./hot-update');

  // ws.send
  ws.recv(function onMessage (message) {


    if (DEBUG && debug.receive(message)) {
      return;
    }

    if (hotUpdate.receive(message)) {
      return;
    }

    console.log(message);
  });
}

require('./reset-css');


// Project common css

var localCss = '\
html {\
  font-family: sans-serif-light, -apple-system, "Segoe UI", "Liberation Sans";\
  font-style: normal;\
  font-size: 14px;\
  line-height: 20px;\
  /* color: #777; */\
  font-weight: 300;\
  /* background-color: #30004F; */\
\
  background-image: url("layout_grid.gif");\
  /*background-color: transparent;*/\
  background-repeat: repeat;\
}\
body {\
  /*background-color: #30004F;*/\
}\
';

var cssSheet = document.createElement('style');
cssSheet.innerHTML = localCss;
document.head.appendChild(cssSheet);


console.log(navigator.appVersion);

//
// tuff/lib/create
//
// Prototype inheritance helper.
// Instead of writing
//
//   var Child = Object.create(Parent, {
//     childMethod: {
//       configurable: true, enumerable: true, writable: true, value:
//       function () { ... }
//     }
//   });
//
// provides shortcut:
//
//   var Child = create(Parent, {
//     childMethod: function () { ... }
//   });
//
// types of members, lets to initialize child object with
// 
var create = require('tuff/lib/create');

function supportNew (objectClass) {

  if (objectClass.init) {
    objectClass.init.prototype = objectClass;
    return objectClass.init;
  } else {
    var constructorFunction = function () {
      return this;
    };

    constructorFunction.prototype = objectClass;
    return constructorFunction;
  }
}

var Base = {
  foo: 1,

  init: function () {
    this.babar = this.foo + this.bar;
    return this;
  }
};

var Base = supportNew(Base);

var Inherited = supportNew(create(Base, {
  bar: 2,
  init: function Inherited (self, parent, foo, bar) {
    parent.call(self);
    self.bar = bar;
    self.foo = foo;
  }
}));



var a = new Inherited(3, 4);
var b = create(Inherited).init(3, 4);
//console.log(a);
//console.log(b);



// require('es6-symbol/implement');
// require('string.prototype.startswith');
// require('array.prototype.fill');

// Android 4.2.2 support
// es6-object-assign on unsupported systems
//
//   var b = Object.assign({}, a, { c: 1 })
//
// instead of 
//
//   var b = { ...a, c: 1 };
//
// require('es6-object-assign').polyfill();

// Tuff Component class.
// Main lifecycle management base class for all visible components.
var Component = require('tuff/lib/component');

function orientation () {

  if (window.screen.orientation) {

    return window.screen.orientation.type;

  } else {

    switch (window.orientation) {
      case 0:
        return 'portrait-primary';
      case 90:
        return 'landscape-primary';
      case -90:
        return 'landscape-secondary';
      case 180:
        return 'portrait-secondary';
    }

    return 'landscape-primary';
  }
}

function viewState () {
  return orientation() +
    ' Scale: ' + window.devicePixelRatio + 'x' +
    ' Win: ' +
    window.innerWidth + 'x' + window.innerHeight +
    ' Pos: ' +
    window.pageYOffset +
    ' html.clientSize: ' +
    document.documentElement.clientWidth + 'x' +
    document.documentElement.clientHeight +

    (document.body ?
      ', BODY: scrollSize ' +
      document.body.scrollWidth + 'x' +
      document.body.scrollHeight +
      ', scrollTop ' +
      document.body.scrollTop
      :
      '');
}

// TODO: It's necessary to track focus state
// when resize happens. When keyboard appears,
// but focus not on controls, resize shouldn't
// actually happen. It's a special case when user taps
// on address bar and keyboard pops up.

console.log('ON START:', viewState());

var self = {};

// For iOS Safari landscape height fix
self.heightWas = window.innerHeight;

function getAllProperties( obj ) {
  var originalObj = obj;
  var props = [];

  do {
      props= props.concat(Object.getOwnPropertyNames( obj ));
  } while ( obj = Object.getPrototypeOf( obj ) );

  var result = {};

  for (var idx in props) {
    var name = props[idx];
    result[name] = originalObj[name];
  }

  return result;
}

var inputState = {};

window.addEventListener('touchstart', function (event) {
  console.log('Touchstart');
});

function sizeChanged () {
  var container = document.getElementById('window');
  console.log(' ---- SIZE CHANGED ---- ', container.getBoundingClientRect().height);
}


    // Move input box to the bottom of page to force Safari
    // scroll window to obtain exact height of the visible area
    function onInputClick (event) {
      if (document.activeElement === event.target) {
        return;
      }

      self.lastTapOnKbControlHappenAt = new Date().valueOf();

      self.heightWas = window.innerHeight;
      event.preventDefault();
      event.stopPropagation();
      var input = event.target;
      inputState.height = input.style.height;
      inputState.bottom = input.style.bottom;
      inputState.position = input.style.position;
      input.style.height = '1px';
      input.style.bottom = '0px';
      input.style.position = 'fixed';
      input.focus();
    }
    
    // Restore input box position and height after focus (and scroll on iOS!) happens
    //function onInputFocus (event) {
    //  self.focus = true;
    //  var input = event.target;
    //  input.style.height = '20px';
    //  input.style.position = null;
    //  input.style.bottom = null;
    // }


function onDomContentLoaded () {
  self.domContentLoadedAt = new Date().valueOf();
  var virtualPixelWidth = document.documentElement.getBoundingClientRect().width;
  
  if (navigator.userAgent.match('Android') && navigator.userAgent.match('Browser/AppleWebKit')) {
    // Add padding at the bottom to prevent covering bottom buttons by stupid navigation bar
    document.body.style['padding-bottom'] = '40px';
  }


  var inputs = document.getElementsByTagName('input');
  for (var idx = 0; idx < inputs.length; ++idx) {
    var input = inputs[idx];
    input.addEventListener('touchend', onInputClick);
    input.addEventListener('mousedown', onInputClick);
    // input.addEventListener('focus', onInputFocus, true);
  }

  /*
  TODO: return and refactor
  var input = document.getElementById('input');
  function onInputClick (event) {
    console.log('INPUT CLICK', viewState());
    event.preventDefault();
    var input = event.target;
    inputState.height = input.style.height;
    inputState.bottom = input.style.bottom;
    inputState.top = input.style.top;
    input.style.height = '1px';
    input.style.bottom = '0px';

    input.focus();
  }
  function onInputFocus (event) {
    var input = event.target;
    input.style.height = '20px';
  }
  input.addEventListener('touchend', onInputClick);
  input.addEventListener('click', onInputClick);
  input.addEventListener('focus', onInputFocus);
  */

  var scroller = document.getElementById('scroller');
  scroller.addEventListener('scroll', function (event) {
    var now = new Date().valueOf();
    

    if (scroller.scrollTop === 0) {
      // element is at the top of its scroll position, so scroll 1 pixel down
      scroller.scrollTop = 1;
    }

    if (scroller.scrollHeight - scroller.scrollTop === scroller.clientHeight) {
      // element is at the bottom of its scroll position, so scroll 1 pixel up
      scroller.scrollTop -= 1;
    }

    if (!self.puttingScrollerBack) {

      if (self.lastAutoscrollHappenedAt && ((now - self.lastAutoscrollHappenedAt) < 100)) {
        // Put scroller back to original position
        self.puttingScrollerBack = true;
        console.log('TO', self.lastScrollerTop);
        scroller.scrollTop = self.lastScrollerTop;
        return;
      }
    } else {
      if (self.lastAutoscrollHappenedAt && ((now - self.lastAutoscrollHappenedAt) < 100)) {
        return;
      }
      self.puttingScrollerBack = false;
    }

    console.log(scroller.scrollTop, now - self.lastAutoscrollHappenedAt);
    self.lastScrollerTop = scroller.scrollTop;

  }, true);


  /*
  var scroller = document.getElementById('scroller');
  scroller.addEventListener('touchstart', function (event) {
    if (event.target === scroller) {
      console.log('Scroller', getAllProperties(event.target.id));
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }, true);
  */

  //document.body.style.width = '0px';
  //document.body.style.height = '0px';
  //document.body.style.overflow = 'hidden';

  var scale = 1 / window.devicePixelRatio;

  var physicalPixelWidth = virtualPixelWidth * window.devicePixelRatio;

  console.log('Device width is', physicalPixelWidth, virtualPixelWidth, window.devicePixelRatio,
    window.getComputedStyle(document.documentElement).width, document.documentElement.clientWidth, document.documentElement.scrollWidth);

  var bgWidth = scale * 1200;
  var bgHeight = scale * 800;

  //document.documentElement.style.width = '0px';
  //document.documentElement.style.height = '0px';
  //document.documentElement.style.overflow = 'hidden';

  //document.documentElement.style['background-size'] = 
  //  bgWidth + 'px ' + bgHeight + 'px';
  document.title = 'Tuff Chat Demo';

  var metaViewport = document.querySelector('meta[name=viewport]');
  if (!metaViewport) {
    metaViewport = document.createElement('meta');
    metaViewport.id = 'viewport';
    metaViewport.name = 'viewport';
    document.getElementsByTagName('head')[0].appendChild(metaViewport);
  }

  // Force predictable viewport
  metaViewport.setAttribute('content',
    'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1');

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

  var root = document.getElementsByTagName('body')[0];
  //root.innerHTML = '<div style = "width: 1px; -webkit-transform: scale(' + scale + ', 1); height: 100px; position: absolute; top: 0px; left: ' +
  //  (virtualPixelWidth - 1) + //scale) +
  //  'px; background-color: blue;"></div>';
  //root.innerHTML = '<input style="position: absolute; top: 3px;" type="text" value="A LOT OF TEXT">'; // <div id="here"></div>;

  //root.innerHTML = '<div id="window" style="-webkit-overflow-scrolling: auto!important; overflow: hidden; position: fixed; top: 0px; bottom: 0px; left: 0px; right: 0px;"><input style="position: absolute; bottom: 0px;" type="text" value="A LOT OF TEXT"></div>';

  updateContainer();

  console.log('DOM CONTENT LOADED:', viewState());

  if (navigator.userAgent.match('iPhone')) {
    console.log('--- iOS!');
    setTimeout(function () {

      // In iOS embedded WebView, height comes as full screen,
      // but after load requested resize.

      // Only for iOS, in landscape mode, height 100% doesn't work, we have to take it from window height
      // Safari and Messenger for iOS Only!!!
      if (!navigator.userAgent.match('CriOS') || navigator.userAgent.match('MessengerForiOS')) {
        var orientationWas = orientation();
        if (orientationWas == 'landscape-primary' || orientationWas == 'landscape-secondary') {
          var newHeight = window.innerHeight;
          var delta = self.heightWas - newHeight;
          if (delta) {
            window.scrollTo(0, delta);
            var style = document.getElementById('window').style;
            style.height = 'calc(100% - ' + delta + 'px)';
            style.top = delta + 'px';
            sizeChanged();

            console.log('FIX iOS Safari / Messenger landscape on LOAD', delta, newHeight);
          }

          return;
        }
      }

      // Messenger iOS portrait fix
      if (navigator.userAgent.match('MessengerForiOS')) {
        var newHeight = window.innerHeight;
        var delta = self.heightWas - newHeight;
        if (delta) {
          var style = document.getElementById('window').style;

          style.height = 'calc(100% - ' + delta + 'px)';
          sizeChanged();
          window.scrollTo(0, 0);

          console.log('FIX iOS Messenger on DOM CONTENT LOADED + 700ms', delta, newHeight);
        }
      }
    }, 700);
  }
  
  setTimeout(function () {
    console.log('2 SEC AFTER DOM CONTENT LOADED:', viewState());
  }, 2000);

};

if (!hotUpdate) {
  // TODO: this should be called from main view frame
  document.addEventListener('DOMContentLoaded', onDomContentLoaded);
} else {
  setTimeout(onDomContentLoaded, 0);
}


window.onload = function (event) {

  self.loadHappenAt = new Date().valueOf();

  console.log('LOAD', viewState());
};

function focusTextbox (elt) {
  var strLength = elt.value.length * 2;
  
  elt.focus();
  elt.setSelectionRange(strLength, strLength);
}

function onWindowClick (event) {

  return;


  var textbox = document.getElementsByTagName('input')[0];
  if (textbox) {
    focusTextbox(textbox);
  } else {
    //var root = document.getElementsByTagName('body')[0];
    //root.innerHTML = '<div id="window"><input style="position: absolute; top: 3px;" type="text" value="A LOT OF TEXT"></div>';

    focusTextbox(document.getElementsByTagName('input')[0]);
  }
};

window.addEventListener('touchend', onWindowClick);
window.addEventListener('click', onWindowClick);

window.addEventListener('resize', function (event) {

  self.lastResizeHappenAt = new Date().valueOf();

  var resizeAtLoad = self.lastResizeHappenAt - self.domContentLoadedAt;

  if (resizeAtLoad > 700) {

    // Android 4.2.2 browser automatically hides address bar and navigation bottom bar
    // when keyboard is active, so we remove the padding
    
    if (navigator.userAgent.match('Android') && navigator.userAgent.match('Browser/AppleWebKit')) {
      var style = document.getElementById('window').style;
      if (self.focus) {
        style.height = window.innerHeight + 'px';
        document.body.style.paddingBottom = '0px';
        sizeChanged();
      } else {
        style.height = '100%';
        document.body.style.paddingBottom = '40px';
        sizeChanged();
      }
    }

    console.log('RESIZE REQUESTED', viewState());

    if (navigator.userAgent.match('iPhone')) {

      var orientationWas = orientation();
      if (navigator.userAgent.match('MessengerForiOS')) {
        if (orientationWas == 'landscape-primary' ||
            orientationWas == 'landscape-secondary') {
          var style = document.getElementById('window').style;
          style.height = window.innerHeight + 'px';
          style.top = document.body.scrollTop + 'px';
          sizeChanged();
          console.log('FIX iOS Messenger landscape after rotation portrait -> landscape');
          setTimeout(function () {
            console.log(viewState());
          }, 200);
        } else {

          // If no scroll but resize happens after orientation change:
          var wasScroll = (self.lastResizeHappenAt - self.lastScrollHappenAt) < 350;
          var wasOrientation = (self.lastResizeHappenAt - self.lastOrientationChangeHappenAt) < 350;
          if (wasScroll && wasOrientation) {
            setTimeout(function () {
              var style = document.getElementById('window').style;
              style.height = window.innerHeight + 'px';//'calc(100% - ' + 88 + 'px)';
              style.top = '0px';
              sizeChanged();
              console.log('FIX iOS Messenger portrait after rotation landscape -> portrait', viewState());
            }, 200);
          }
        }
      }

      // Only for iOS, in landscape mode, height 100% doesn't work, we have to take it from window height
      // Safari and Messenger for iOS Only!!!
      if (!navigator.userAgent.match('CriOS')
          && !navigator.userAgent.match('MessengerForiOS')) {
        var orientationWas = orientation();
        if (orientationWas == 'landscape-primary' || orientationWas == 'landscape-secondary') {
          if (!self.focus) {
            var newHeight = window.innerHeight;
            var delta = self.heightWas - newHeight;
            console.log(newHeight, delta);
            if (delta > 0) {
              window.scrollTo(0, delta);
              var style = document.getElementById('window').style;
              style.height = 'calc(100% - ' + delta + 'px)';
              style.top = delta + 'px';
              sizeChanged();

              console.log('FIX iOS Safari / Messenger landscape after rotation portrait -> landscape', delta, newHeight);
            } else {
              var style = document.getElementById('window').style;
              //style.height = newHeight + 'px'; //'calc(100% - ' + delta + 'px)';
              style.height = 'calc(100% - ' + document.body.offsetTop + 'px)';
              style.top = document.body.offsetTop + 'px';
              // window.scrollTo(0, 0);
              sizeChanged();

              console.log('FIX iOS Safari / Messenger landscape after rotation portrait -> landscape', delta, newHeight);
            }
          }
        } else {
          // At rotating from portrait to landscape on iOS Safari,
          // it emits a resize event with portrait orientation
          // but new fullscreen size. We should save that height
          // to subtract the difference otherwise it's impossible
          // to determine the visible area.
          self.heightWas = window.innerHeight;
        }
      }

/*
      var orientationWas = orientation();
      var resizeAfterScroll = self.lastResizeHappenAt - self.lastScrollHappenAt;
      console.log(resizeAfterScroll, orientationWas);
      if (//resizeAfterScroll < 350 &&
         (orientationWas == 'landscape-primary'
          || orientationWas == 'landscape-secondary')) {
        console.log('iOS WebKit rotated from portrait to landscape');
        var style = document.getElementById('window').style;
        style.height = window.innerHeight + 'px';//'calc(100% - ' + delta + 'px)';
        style.top = document.body.scrollTop + 'px';
        sizeChanged();
        /*
        var newHeight = window.innerHeight;
        var delta = self.heightWas - newHeight;
        if (delta) {
          window.scrollTo(0, delta);
          var style = document.getElementById('window').style;
          // style.borderBottom = delta + 'px solid red';
          //style.height = newHeight + 'px';
          style.height = 'calc(100% - ' + delta + 'px)';
          style.top = delta + 'px';
          sizeChanged();

          console.log('FIX iOS Safari landscape on RESIZE ON LOAD', delta, newHeight);
        }*/
      //}
    }

    updateContainer();

  } else {
    // In iOS embedded WebView, height comes as full screen,
    // but after load requested resize.

    // Only for iOS Safari, in landscape mode, height 100% doesn't work, we have to take it from window height
    // Safari Only!!!
    if (!navigator.userAgent.match('iPhone')) {
      console.log('--- NOT iOS!');
      return;
    }
    if (!navigator.userAgent.match('CriOS')) {
      var orientationWas = orientation();
      if (orientationWas == 'landscape-primary' || orientationWas == 'landscape-secondary') {
        var newHeight = window.innerHeight;
        var delta = self.heightWas - newHeight;
        if (delta) {
          window.scrollTo(0, delta);
          var style = document.getElementById('window').style;
          // style.borderBottom = delta + 'px solid red';
          //style.height = newHeight + 'px';
          style.height = 'calc(100% - ' + delta + 'px)';
          style.top = delta + 'px';
          sizeChanged();

          console.log('FIX iOS Safari landscape on RESIZE ON LOAD', delta, newHeight);
          //style.height = window.innerHeight + 'px';
        }
      }
    }
    
    console.log('RESIZE AT LOAD REQUESTED', viewState(),
      self.lastResizeHappenAt - self.loadHappenAt,
      self.lastResizeHappenAt - self.domContentLoadedAt);

    updateContainer();
  }
}, true);

function updateContainer () {
  return;

  self.width = window.innerWidth;
  self.height = window.innerHeight;// - 88;
  self.minimumWidth = self.width < self.height ?
    self.width : self.height;

  var style = document.getElementById('window').style;

  style.position = 'absolute';
  
  style.top = document.body.scrollTop + 'px';
  style.width = window.innerWidth + 'px';
  if (self.focus && document.body.scrollTop !== self.scrollTopWas) { // Scrolling when keyboard is visible
    // style.height = self.innerHeightWas + document.body.scrollTop + 'px';
    style.height = self.innerHeightWas - self.scrollTopWas + 10 + 'px'; // 10 is half of the input height
    console.log('----', document.body.scrollTop, self.scrollTopWas, style.height);
  } else {
    style.height = self.focus ? window.innerHeight - self.scrollTopWas + 'px' : window.innerHeight - document.body.scrollTop + 'px';
  }

  style.border = '1px solid blue';
  style['background-color'] = 'yellow';
}



window.addEventListener('scroll', function (event) {

  if (event.target !== document) {
    // console.log(event);
    // Ignore bubbled events from any internal scrollers
    return;
  }

  self.lastScrollHappenAt = new Date().valueOf();

  var scrollAtLoad = self.lastScrollHappenAt - self.domContentLoadedAt;
  /*
  if (scrollAtLoad < 500) {
    // On iOS Safari, it scrolls screen in landscape mode
    var orientationWas = orientation();
    if (orientationWas == 'landscape-primary' || orientationWas == 'landscape-secondary') {
      var newHeight = window.innerHeight;
      var delta = self.heightWas - newHeight;

      var style = document.getElementById('window').style;
      style.borderBottom = delta + 'px solid red';
      window.scrollTo(0, 0);
      console.log('FIX iOS Safari landscape', delta);
    }
  }*/

  if (!window.scrollCount) {
    window.scrollCount = 1;
  }

  console.log('SCROLL', viewState(), window.scrollCount);
/*
  window.scrollCount += 1;
  if (window.scrollCount >= 5) {
    return;
  }
*/
  // if (document.body.scrollTop === 0) {
  //   return;
  // }

  var shouldReturn = false;

  if (self.scrollLock) {
    self.scrollLock = false;
    console.log('UNLOCK SCROLL LOCK');
    shouldReturn = true;
  }

  if (!scrollAtLoad && navigator.userAgent.match('iPhone')) {

    // Safari and Messenger for iOS Only!!!
    // If scroll happens after orientation change and it's portrait mode now,
    // and if scroll top is 0, remove top offset in that portrait mode:
    if (!navigator.userAgent.match('CriOS')
        || navigator.userAgent.match('MessengerForiOS')) {
      var orientationWas = orientation();
      if (document.body.scrollTop == 0 &&
         (orientationWas == 'portrait-primary'
         || orientationWas == 'portrait-secondary')) {
        if (!self.focus) {
          // var newHeight = window.innerHeight;
          var style = document.getElementById('window').style;
          style.height = '100%';//window.innerHeight + 'px';//calc(100% - ' + delta + 'px)';
          style.top = '0px';
          sizeChanged();

          console.log('FIX iOS Safari / Messenger portrait after rotation landscape -> portrait');
        } else {
          // It's impossible to precisely determine virtual keyboard height
          // after rotation on iOS, so we just blur it out:
          document.activeElement.blur();
          /*
          var style = document.getElementById('window').style;
          style.height = '56px';//window.innerHeight + 'px';//calc(100% - ' + delta + 'px)';
          style.top = '0px';
          sizeChanged();
          */
          console.log('FIX iOS Safari / Messenger portrait after rotation landscape -> portrait in focus');
          /*setTimeout(function () {
            console.log(viewState());
          }, 2000);*/
        }
      } else if (self.focus && document.body.scrollTop > 0 &&
        (orientationWas == 'landscape-primary'
        || orientationWas == 'landscape-secondary')) {
        // It's impossible to precisely determine virtual keyboard height
        // after rotation on iOS, so we just blur it out:
        //document.activeElement.blur();
        //console.log('FIX iOS Safari / Messenger portrait after rotation portrait -> landscape in focus');
      }
    }
  }

  if (self.iOSMessengerShouldPatchOnScrollAfterBlur) {
    self.iOSMessengerShouldPatchOnScrollAfterBlur = false;
    var delta = document.documentElement.clientHeight - window.innerHeight;
    
    var style = document.getElementById('window').style;
    style.height = 'calc(100% - ' + delta + 'px)';

    var orientationWas = orientation();
    if (orientationWas == 'landscape-primary' || orientationWas == 'landscape-secondary') {
      //var newHeight = window.innerHeight;
      //var delta = self.heightWas - newHeight;
      if (delta) {
        console.log('iOS Messenger scrolling to 0,' + delta + '...', viewState());
        window.scrollTo(0, delta);
        style.top = delta + 'px';
      }
      sizeChanged();
    } else {
      style.top = '0px';
      sizeChanged();
      console.log('iOS Messenger scrolling to 0,0...', viewState(), delta);
      window.scrollTo(0, 0);
    }

    return;

  } else if (self.iOSSafariLandscapeShouldPatchOnScrollAfterBlur) {
    self.iOSSafariLandscapeShouldPatchOnScrollAfterBlur = false;
    var delta = document.documentElement.clientHeight - window.innerHeight;

    var newHeight = window.innerHeight;
    if (delta) {
      window.scrollTo(0, delta);

      var style = document.getElementById('window').style;
      style.height = 'calc(100% - ' + delta + 'px)';//newHeight + 'px';
      style.top = delta + 'px';
      sizeChanged();
      console.log('iOS Safari landscape returning back to fullscreen height', delta, newHeight);
    }
    return;
  }

  if (shouldReturn) {
    return;
  }

  // Only for iOS:
  // Mobile Safari & Google Chrome iOS fix full-screen container after focusing an element
  if (!navigator.userAgent.match('iPhone')) {
    console.log('--- NOT iOS!');
    return;
  }

  if (self.focus && document.body.scrollTop !== 0) {
    // For iOS Chrome this should not be set.
    // self.scrollLock = true;
  
    // Google Chrome iOS returns real viewport height here, but Safari only in portrait mode reports strange smaller size.
    var newWindowHeight = window.innerHeight;

    // If iOS in portrait mode, real height when focused is little bit bigger:
    var orientationWas = orientation();
    if (orientationWas == 'portrait-primary' || orientationWas == 'portrait-secondary') {
      // Safari Only!!!
      if (!navigator.userAgent.match('CriOS') && !navigator.userAgent.match('MessengerForiOS')) {
        newWindowHeight += 10.5;
      }
    }

    /*if (navigator.userAgent.match('MessengerForiOS') && (orientationWas == 'landscape-primary' || orientationWas == 'landscape-secondary')) {
      console.log('iOS Messenger focus autoscroll happened. Repositioning viewport...');
      var offsetTop = document.body.scrollTop; // or window.pageYOffset - I don't know which is better
      var style = document.getElementById('window').style;
      style.height = newWindowHeight + 'px';
      style.top = offsetTop + 'px';
      sizeChanged();
      self.focusPatchApplied = true;
    } else {*/
      self.lastAutoscrollHappenedAt = new Date().valueOf();

      if ((self.lastAutoscrollHappenedAt - self.lastFocusHappenedAt) < 700) {
        console.log('iOS WebKit focus autoscroll happened. Repositioning viewport...');
        var offsetTop = document.body.scrollTop; // or window.pageYOffset - I don't know which is better
        var style = document.getElementById('window').style;
        style.height = newWindowHeight + 'px';
        style.top = offsetTop + 'px';
        sizeChanged();
        self.focusPatchApplied = true;
      }

    //}
  }

  return;

  if (self.focus && document.body.scrollTop !== 0) {
    window.scrollTo(0, 0);
  } else {
    updateContainer();
  }
}, true);




var inputState = {};

document.addEventListener('blur', function (event) {
  console.log('BLUR', viewState(), event.relatedTarget);//, document.activeElement.id, event.target.id, event);

  self.lastBlurHappenAt = new Date().valueOf();

  var wasTapOnAnotherKbControl = (self.lastBlurHappenAt - self.lastTapOnKbControlHappenAt) < 100;
  console.log(wasTapOnAnotherKbControl);

  if (!wasTapOnAnotherKbControl) {
    var input = event.relatedTarget; // document.getElementById('input2');
    if (input) {
      inputState.height = input.style.height;
      inputState.bottom = input.style.bottom;
      inputState.top = input.style.top;
      inputState.position = input.style.position;
      input.style.height = '1px';
      input.style.bottom = '0px';

      return;
    }
  } else {
    return;
  }

  self.focus = false;
  if (self.focusPatchApplied) {
    self.focusPatchApplied = false;
    var style = document.getElementById('window').style;
    // For iOS Safari in landscape mode, height should be less than 100% and it should be scrolled to the most bottom to avoid bugs:
    // Safari Only!!!
    if (!navigator.userAgent.match('CriOS') && !navigator.userAgent.match('MessengerForiOS')) {
      var orientationWas = orientation();
      if (orientationWas == 'landscape-primary' || orientationWas == 'landscape-secondary') {
        // Handling it in scroll will be too late.
        // We have to use remembered value if rotation will not happen.
        // Only if user has rotated the screen, and we never were aware about that size,
        // we postpone it to onscroll.
        self.iOSSafariLandscapeShouldPatchOnScrollAfterBlur = true;
        console.log('iOS Safari landscape returning back to fullscreen height', viewState());

      } else { // ???????????
        console.log('iOS Safari portrait returning back to fullscreen height');
        style.height = '100%';
        style.top = '0px';
        sizeChanged();
        window.scrollTo(0, 0);
      }
    } else if (navigator.userAgent.match('MessengerForiOS')) {
      // Handling it in scroll will be too late.
      // We have to use remembered value if rotation will not happen.
      // Only if user has rotated the screen, and we never were aware about that size,
      // we postpone it to onscroll.
      self.iOSMessengerShouldPatchOnScrollAfterBlur = true;
      console.log('iOS Messenger returning back to fullscreen height', viewState());
      
    } else {
      console.log('iOS Chrome returning back to fullscreen height');
      style.height = '100%';
      style.top = '0px';
      sizeChanged();
      // window.scrollTo(0, 0);
    }
  }
  return;
  setTimeout( function () {
    console.log('BLUR', viewState());
    self.scrollTopWas = 0;
    self.focus = false;
    updateContainer();
  }, 200);
}, true);




document.addEventListener('focus', function (event) {

  var focusHappenedAt = new Date().valueOf();

  if (self.lastBlurHappenAt) {
    if ((focusHappenedAt - self.lastBlurHappenAt) > 350) {
      self.lastFocusHappenedAt = focusHappenedAt;
    }
  } else {
    self.lastFocusHappenedAt = focusHappenedAt;
  }

  // iOS WebKit: move text control back to its position
  // after correct calculation of new window height and scrolling offset
  var input = event.target;
  input.style.height = '20px';
  input.style.position = inputState.position || 'absolute';
  input.style.bottom = inputState.bottom || '0px';

  // Only for iOS Safari in portrait mode!!!
  // Fixing height to 100% to let Safari change height exactly.
  // Safari Only!!!
  /*
  if (!navigator.userAgent.match('CriOS')) {
    var orientationWas = orientation();
    if (orientationWas == 'landscape-primary' || orientationWas == 'landscape-secondary') {
      console.log('here');

      if (false && self.scrollTopWas !== document.body.scrollTop) {
        var style = document.getElementById('window').style;
        style.height = '100%';
        sizeChanged();
      }
    }
  }
  */

  self.focus = true;
  console.log('FOCUS', viewState());
  return;
  setTimeout( function () {
    console.log('FOCUS', viewState());
    self.scrollTopWas = document.body.scrollTop;
    self.innerHeightWas = window.innerHeight;
    self.focus = true;
    //var textbox = document.getElementsByTagName('input')[0];
    //textbox.style.top = '3px';
    updateContainer();
    window.scrollTo(0,0);
  }, 200);
}, true);


window.addEventListener('orientationchange', function (event) {

  console.log('ORIENTATION', viewState());

  self.lastOrientationChangeHappenAt = new Date().valueOf();

  // Google Chrome Mobile doesn't require document's width being less
  // than screen width, and it'll not resize viewport IF HEIGHT == 100%.

  // Google Chrome Mobile requires document's width being less
  // than screen width, otherwise it'll resize viewport:
  if (!self.lastResizeHappenAt ||
      (self.lastOrientationChangeHappenAt - self.lastResizeHappenAt)
      > 500) {
    if (self.width > self.height) {
      console.log('L->P Google Chrome Mobile');
      var style = document.getElementById('window').style;
      style.width = self.minimumWidth + 'px';
    }
  }

  if (navigator.userAgent.match('iPhone')) {
    
    // All WebKit iOS!
    // If scroll happens after orientation change and it's portrait mode now,
    // and if scroll top is 0, remove top offset in that portrait mode:
    //var orientationWas = orientation();
    if (self.focus /*&&
      document.body.scrollTop > 0 &&
      (orientationWas == 'landscape-primary'
    || orientationWas == 'landscape-secondary')*/) {
      console.log('FIX iOS Safari / Messenger portrait after rotation portrait -> landscape in focus');
      var style = document.getElementById('window').style;
      style.height = '100%';
      style.top = '0px';
      document.activeElement.blur();
    }
  }

}, true);

window.bundleLoadedTimestamp = new Date().valueOf();












// Android 4.2.2 Browser:
/* 1502769966371 '::ffff:192.168.0.91:34012' 'ORIENTATION' 'portrait-primary Win: 534x239 Pos: 0 html.clientSize: 534x239, BODY: scrollSize 534x239, scrollTop 0'
1502769966445 '::ffff:192.168.0.91:34018' 'ORIENTATION' 'portrait-primary Win: 533x243 Pos: 0 html.clientSize: 533x243, BODY: scrollSize 533x243, scrollTop 0'
1502769966602 '::ffff:192.168.0.91:34018' 'RESIZE REQUESTED' 'portrait-primary Win: 320x456 Pos: 0 html.clientSize: 320x456, BODY: scrollSize 320x456, scrollTop 0'



1502769985872 '::ffff:192.168.0.91:34012' 'ORIENTATION' 'portrait-primary Win: 534x239 Pos: 0 html.clientSize: 534x239, BODY: scrollSize 534x239, scrollTop 0'
1502769985936 '::ffff:192.168.0.91:34018' 'ORIENTATION' 'landscape-primary Win: 320x456 Pos: 0 html.clientSize: 320x456, BODY: scrollSize 320x456, scrollTop 0'
1502769986073 '::ffff:192.168.0.91:34018' 'RESIZE REQUESTED' 'landscape-primary Win: 533x243 Pos: 0 html.clientSize: 533x243, BODY: scrollSize 533x243, scrollTop 0'

*/

