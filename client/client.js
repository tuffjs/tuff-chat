var debug = require('./debug.js');
window.lastNavigationTimestamp = new Date().valueOf();
var create = require('tuff/lib/create');
require('es6-symbol/implement');
require('string.prototype.startswith');
require('array.prototype.fill');
require('es6-object-assign').polyfill();

var Component = require('tuff/lib/component');



var C2 = create(Component, {
  init: function () {
    return this;
  },

  setRect: function (rect) {
    this.rect = rect;
    this.invalidate();
    this.render();
  },

  view:
    function (h) {
      var self = this;
              return h('div',
                { style:
                  { // height: '100%',
                    // position: 'fixed',
                    // bottom: '0px',
                    // top: '0px',
                    //top:
                    //  self.rect ?
                    //    self.rect.height - 20 + 'px' :
                    //    20 + 'px',
                    backgroundColor: 'red',
                    // verticalAlign: 'bottom'
                  }
                },
                'Here we are'
              );
    }
});

var Child = create(Component, {
  init: function () {
    return this;
  },

  onFocus: function (evt) {
    console.log('Focus',
      window.innerHeight,
      evt);
  },

  view: function (h) {
    var self = this;
    return h('div',
      { style:
        { // float: 'left',
          //width: this.width,
          top: '200px',
          position: 'relative',
          backgroundColor: 'blue'
        },
        on:
        { click:
          function (e) {
            console.log('CLICKED');
          }
        }
      },
      [ 'CHILD',
        h('input',
          { props:
            { type: 'text' },
            
            on:
            { focus:
                self.onFocus,
              blur:
                function (e) {
                  console.log('Blur',
                    top.innerHeight);
                },
              touchstart:
                function (e) {
                  console.log('Touchstart');//, flatten(e));
                  e.stopPropagation();
                }
            }
          }
        )
      ]
              
    );
  }
});

var Cont = create(Component, {
  init: function () {
    var self = this;
    this.child1 = create(Child, {
      onFocus: function () {
        setTimeout( function () {
          var rect = self.trackedFrame.getBoundingClientRect();
          console.log('Tracked frame',
            rect, window.innerHeight);
        }, 1000);
        return Child.onFocus.apply(self.child1, arguments);
      }
    }).init();
    this.child2 = create(Child).init();
    this.c2 = create(C2).init();
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // TODO: solve bug with invalid offset after
    // rotation on iPhone.

    function foo () {
    (function() {
      var throttle = function(type, name, obj) {
        obj = obj || window;
        var running = false;
        var func = function() {
            if (running) { return; }
            running = true;
            requestAnimationFrame(function() {
                obj.dispatchEvent(new CustomEvent(name));
                running = false;
            });
        };
        obj.addEventListener(type, func);
      };

      // init - you can init any event
      throttle("resize", "optimizedResize");
    })();
    }

    var self = this;

    // handle event
    window.addEventListener("resize", function() {
      // self.setWidth(window.width);
      self.width = window.innerWidth;
      self.height = window.innerHeight;
      console.log('RESIZE:',
	window.pageXOffset,
        window.pageYOffset,
        window.innerWidth,
        window.innerHeight);
      self.invalidate();
      self.render();
      if (window.pageYOffset > 0) {
        window.scrollTo(0, 0);
      }
    });

    window.addEventListener('orientationchange', function() {
      // window.scrollTo(0, 0);
      console.log('ORIENTATION');
    });

    return this;
  },
  setWidth(width) {
    this.width = width;
    this.invalidate();
    this.render();
  },
  view: function (h) {
    // console.log(window);
    var self = this;
    return h('body',
      { style:
        { backgroundColor: 'yellow',
          // width: '100vw', // this.width + 'px',
          // height: '130vh', //this.height + 'px',
          position: 'relative',
          // overflowY: 'scroll',
          // height: '50%'
          // marginTop: this.touched ? '0px' : '20px'
          // height: '100%',
          
          //bottom: '0px',
          //position: 'fixed',
          //left: '0px',
          //top: '0px',
          //right: '0px'
        },
        on:
        { //click:
          //  function (e) {
          //    console.log('Clicked', self.width, self.height);
          //  },
          touchstart:
            function (e) {
              self.touched = true;
              console.log('Touchstart');//, flatten(e));
              e.stopPropagation();
              e.preventDefault();
            }
        }
      },
      h('div',
        { style:
          { backgroundColor: 'red',
            overflow: 'hidden',
            // fontSize: '0'
          }
        },
        h('div',
          { style:
            { backgroundColor: 'green',
              position: 'relative',
              left: '0px',
              transition: 'left 250ms right 250ms',
              fontSize: '14px'
            }
          },
          h('div',
            { style:
              { backgroundColor: 'white',
                position: 'relative',
                

                //position: 'fixed',
                //bottom: '0px',
                //top: '0px'


                minHeight: '460px'//self.height - 1 + 'px' //'460px',
                // height: self.height + 'px'
              },

              hook:
              { insert:
                  function (vnode) {
                    var rect = vnode.elm.getBoundingClientRect();
                    console.log('Internal thing inserted',
                      vnode.elm.getBoundingClientRect()
                    );
                    self.rect = rect;
                    self.trackedFrame = vnode.elm;
                  },
                postpatch:
                  function (old, vnode) {
                    var rect = vnode.elm.getBoundingClientRect();
                    console.log('Internal thing updated',
                      rect
                    );
                    self.rect = rect;
                    self.c2.setRect(rect);
                  }
              }
            },
            [ this.child1.comp(),
              this.c2.comp()
            ]
          )
        )
      )
    );
  }
});

document.addEventListener('DOMContentLoaded', function () {

  // window.scrollTo(0, 0);

  var root = document.getElementsByTagName('body')[0];
  root.innerHTML = '';

  var cont = create(Cont).init();

  cont.mount(root);
  cont.render();

  // window.scrollTo(0, 0);//44);
});
/*
var cha = {
  a: 1,
  b: 5
};

var chb = create(cha, { c: 6 });

var a = {
  a: 1,
  b: 5,
  chb: chb
};

var b = create(a, { c: 6 });

function flatten (obj) {
  var result = Object.create(obj);
  for (var key in result) {
    result[key] = result[key];
  }

  return result;
}

console.log(JSON.stringify(flatten(b)));
*/

