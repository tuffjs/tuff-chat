var hotUpdate = false;

if (window.bundleLoadedTimestamp) {
  hotUpdate = true;
  console.log('MIGRATING GLOBAL ASSETS...');
}


// First line executed ever
window.lastNavigationTimestamp = new Date().valueOf();

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
console.log(a);
console.log(b);



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

console.log('ON START:', viewState());

function onDomContentLoaded () {
  self.domContentLoadedAt = new Date().valueOf();

  var root = document.getElementsByTagName('body')[0];
  root.innerHTML = '<input style="position: absolute; top: 200px;" type="text" value="TEXT">';

  console.log('DOM CONTENT LOADED:', viewState());
  
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


var self = {};

window.onload = function (event) {

  self.loadHappenAt = new Date().valueOf();

  console.log('LOAD');
};


window.addEventListener('resize', function (event) {

  self.lastResizeHappenAt = new Date().valueOf();

  var resizeAtLoad = self.lastResizeHappenAt - self.domContentLoadedAt;

  if (resizeAtLoad > 500) {

    console.log('RESIZE REQUESTED', viewState());

  } else {
    // In iOS embedded WebView, height comes as full screen,
    // but after load requested resize.
    console.log('RESIZE AT LOAD REQUESTED', viewState(),
      self.lastResizeHappenAt - self.loadHappenAt,
      self.lastResizeHappenAt - self.domContentLoadedAt);
  }
});


window.addEventListener('scroll', function (event) {

  self.lastScrollHappenAt = new Date().valueOf();


  console.log('SCROLL', viewState());

});


window.addEventListener('orientationchange', function (event) {

  self.lastOrientationChangeHappenAt = new Date().valueOf();

  console.log('ORIENTATION', viewState());

});

window.bundleLoadedTimestamp = new Date().valueOf();

