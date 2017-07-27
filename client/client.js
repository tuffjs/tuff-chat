var create = require('tuff/lib/create');
var Component = require('tuff/lib/component');

var Child = create(Component, {
  init: function () {
    return this;
  },
  view: function (h) {
    return h('div', {style: { float: 'left', width: this.width }}, 'CHILD');
  },
});

var Cont = create(Component, {
  init: function () {
    this.child1 = create(Child).init();
    this.child2 = create(Child).init();
    this.width = window.innerWidth;
    this.height = window.innerHeight;

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

      /* init - you can init any event */
      throttle("resize", "optimizedResize");
    })();

    var self = this;

    // handle event
    window.addEventListener("optimizedResize", function() {
      // self.setWidth(window.width);
      self.width = window.innerWidth;
      self.height = window.innerHeight;
      self.invalidate();
      self.render();
      // console.log("Resource conscious resize callback!");
    });
    return this;
  },
  setWidth(width) {
    this.width = width;
    this.invalidate();
    this.render();
  },
  view: function (h) {
    console.log(window);
    return h('body', { style: { backgroundColor: 'yellow',
      width: this.width + 'px', height: this.height + 'px' } }, this.child1.comp());
  },
});

document.addEventListener('DOMContentLoaded', function () {

  var root = document.getElementsByTagName('body')[0];
  root.innerHTML = '';

  var cont = create(Cont).init();

  cont.mount(root);
});
