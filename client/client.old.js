var debug = require('./debug.js');
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
  /*background-image: url("layout_grid.gif");*/\
  background-color: transparent;\
  background-repeat: repeat;\
}\
body {\
  background-color: #30004F;\
}\
';

var cssSheet = document.createElement('style');
cssSheet.innerHTML = localCss;
document.head.appendChild(cssSheet);

var create = require('tuff/lib/create');
require('es6-symbol/implement');
require('string.prototype.startswith');
require('array.prototype.fill');
require('es6-object-assign').polyfill();

var Component = require('tuff/lib/component');



var C2 = create(Component, {
  init: function (self, parent) {
    parent.call(self);
    // this.height = 40;
    return this;
  },

  setRect: function (self, rect) {
    this.rect = rect;
    this.invalidate();
    this.render();
  },

  setHeight: function (self, height) {
    this.height = height;
    this.invalidate();
    this.render();
  },

  view:
    function (self, h) {
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
                    position: 'absolute',
                    top: self.height - 20 + 'px'
                    // verticalAlign: 'bottom'
                  }
                },
                'Here we are'
              );
    }
});

var Child = create(Component, {
  init: function (self, parent) {
    parent.call(self);
    return this;
  },

  onFocus: function (self, evt) {
    console.log('Focus',
      window.innerHeight,
      evt);
  },

  view: function (self, h) {
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
                  window.scrollTo(0, 0);
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

var TuffObject = {
  parent: null,
  isWidget: false,
  children: [],

  init: function (self, parent) {

    if (parent) {
      this.setParent(parent);
    }
  },

  setParent: function (self, parent) {
    if (!this.isWidget) {
      throw "Only widget can have a parent";
    }
    this.parent = parent;
    this.parent.children.append(this); 
  }
};

var Rect = {
  left: 0,
  top: 0,
  width: 0,
  height: 0
};

var Tuff = {
  // Align Flags
  AlignLeft: 0x0001, // Aligns with the left edge.
  AlignRight: 0x0002, // Aligns with the right edge.
  AlignHCenter: 0x0004, // Centers horizontally in the available space.
  AlignJustify: 0x0008, // Justifies the text in the available space.
  // The vertical flags are:
  AlignTop: 0x0020, // Aligns with the top.
  AlignBottom: 0x0040, // Aligns with the bottom.
  AlignVCenter:	0x0080, // Centers vertically in the available space.
  // You can use only one of the horizontal flags at a time.

  // There is one two-dimensional flag:
  get AlignCenter () { return Tuff.AlignVCenter | Tuff.AlignHCenter },
    // Centers in both dimensions.
    // You can use at most one horizontal and one vertical flag at a time.
    // Tuff.AlignCenter counts as both horizontal and vertical.

  // Three enum values are useful in applications that can be run
  //  in right-to-left mode:
  AlignAbsolute: 0x0010, // If the widget's layout direction is
    // Tuff.RightToLeft (instead of Tuff.LeftToRight, the default),
    // Tuff.AlignLeft refers to the right edge and Tuff::AlignRight
    // to the left edge. This is normally the desired behavior.
    // If you want Tuff.AlignLeft to always mean "left" and
    // Tuff.AlignRight to always mean "right",
    // combine the flag with Tuff.AlignAbsolute.
  get AlignLeading () { return Tuff.AlignLeft },
  get AlignTrailing () { return Tuff.AlignRight },

  // Masks:
  get AlignHorizontal_Mask () { return Tuff.AlignLeft | Tuff.AlignRight |
    Tuff.AlignHCenter | Tuff.AlignJustify | Tuff.AlignAbsolute },

  get AlignVertical_Mask () { return Tuff.AlignTop | Tuff.AlignBottom |
    Tuff.AlignVCenter },

  Horizontal: 1,
  Vertical: 2,

};

var TUFFWIDGETSIZE_MAX = 16777215;
var TUFFLAYOUTSIZE_MAX = 524288;

var Widget = create(TuffObject, {
  init: function (self, parent) {
    TuffObject.init.call(this, parent);

    this.isWidget = true;
    this.layout = null;
    this.extra = null; // .explicitMinSize, .explicitMaxSize

    this.isWindow = false;
    this.isVisible = false;

    this.size_policy(Tuff.SizePolicy.Preferred,
      Tuff.SizePolicy.Preferred);
    this.retainSizeWhenHiddenChanged = 0;
    this.leftmargin = 0;
    this.rightmargin = 0;
    this.topmargin = 0;
    this.bottommargin = 0;
    
    this.size = TuffSize(0, 0);
  },

  layoutRequest: function (self) {
    // TODO: async setImmediate etc.
    // this.layoutChildren:
    // child.setGeometry(...)
    // viewport.setGeometry(
    //   QStyle::visualRect(opt.direction, opt.rect, viewportRect));
  },

  setConstraints_sys: function () {
    if (this.extra && this.windowParams) {
        var winp = this.windowParams;

        winp.minimumSize = QSize(extra.minw, extra.minh);
        winp.maximumSize = QSize(extra.maxw, extra.maxh);

        if (this.extra.topextra) {
          winp.baseSize = QSize(extra.topextra.basew, extra.topextra.baseh);
          winp.sizeIncrement = QSize(extra.topextra.incw, extra.topextra.inch);
        }

        if (winp.platformWindow) {
          this.fixPosIncludesFrame();
          winp.platformWindow.propagateSizeHints();
        }
    }
  },

  setGeometry: function (r) {
    this.setAttribute(Tuff.WA_Resized);
    this.setAttribute(Tuff.WA_Moved);
    if (this.isWindow)
        this.topData.posIncludesFrame = 0;
    if (this.testAttribute(Tuff.WA_WState_Created)) {
        // setGeometry_sys will execute this code:
        // if (isMove) {
        //    QMoveEvent e(q->pos(), oldPos);
        //    QApplication::sendEvent(q, &e);
        //}
        //if (isResize) {
        //    QResizeEvent e(r.size(), olds);
        //    QApplication::sendEvent(q, &e);
        //    // this event will call
        //    // layout->widgetEvent
        //    // which will call 
        //         if (d->activated) {
        //           QResizeEvent *r = (QResizeEvent *)e;
        //           d->doResize(r->size());
        //         } else {
        //           activate();
        //         }
        //    if (q->windowHandle())
        //        q->update(); // repaint
        //}
        this.setGeometry_sys(r.x(), r.y(),
          r.width(), r.height(), true);
        this.setDirtyOpaqueRegion();
    } else {
        this.data.crect.setTopLeft(r.topLeft());
        this.data.crect.setSize(r.size().boundedTo(this.maximumSize())
          .expandedTo(this.minimumSize()));
        this.setAttribute(Tuff.WA_PendingMoveEvent);
        this.setAttribute(Tuff.WA_PendingResizeEvent);
    }

    if (this.extra && this.extra.hasWindowContainer)
        TuffWindowContainer.parentWasMoved(this);
  },

  resize: function () {
    this.setAttribute(Tuff.WA_Resized);
    if (this.testAttribute(Tuff.WA_WState_Created)) {
        this.fixPosIncludesFrame();
        this.setGeometry_sys(geometry().x(), geometry().y(),
          s.width(), s.height(), false);
        this.setDirtyOpaqueRegion();
    } else {
        this.data.crect.setSize(s.boundedTo(this.maximumSize())
          .expandedTo(this.minimumSize()));
        this.setAttribute(Tuff.WA_PendingResizeEvent);
    }
  },


  updateGeometry: function () {
    this.updateGeometry_helper(false);
  },

  updateGeometry_helper: function (forceUpdate) {
    if (this.widgetItem) {
        this.widgetItem.invalidateSizeCache();
    }
    if (forceUpdate || !this.extra ||
      this.extra.minw !== this.extra.maxw ||
      this.extra.minh !== this.extra.maxh) {

      var isHidden = !this.isVisible &&
        !size_policy.retainSizeWhenHidden() &&
        !this.retainSizeWhenHiddenChanged;

      if (!this.isWindow && !isHidden && this.parent) {
        var parent = this.parent;
        if (parent.layout) {
          parent.layout.invalidate();
        } else if (parent.isVisible) {
          // TODO: async
          parent.layoutRequest();
        }
      }
    }
  },

  setFixedSize: function (w, h) {

    var minSizeSet = this.setMinimumSize_helper(w, h);
    var maxSizeSet = this.setMaximumSize_helper(w, h);
    if (!minSizeSet && !maxSizeSet) {
        return;
    }

    if (this.isWindow) {
      this.setConstraints_sys();
    } else {
      this.updateGeometry_helper(true);
    }

    if (w !== TUFFWIDGETSIZE_MAX ||
        h !== TUFFWIDGETSIZE_MAX) {
      this.resize(w, h);
    }
  },

  createExtra: function () {
    if (!this.extra) {
      var extra = this.extra = {};
      //extra.glContext = 0;
      //extra.topextra = 0;
      //extra.proxyWidget = 0;
      //extra.curs = 0;
      extra.minw = 0;
      extra.minh = 0;
      extra.maxw = TUFFWIDGETSIZE_MAX;
      extra.maxh = TUFFWIDGETSIZE_MAX;
      //extra.customDpiX = 0;
      //extra.customDpiY = 0;
      extra.explicitMinSize = 0;
      extra.explicitMaxSize = 0;
      //extra.autoFillBackground = 0;
      //extra.nativeChildrenForced = 0;
      //extra.inRenderWithPainter = 0;
      //extra.hasWindowContainer = false;
      //extra.hasMask = 0;
    }
  },

  setMinimumSize_helper: function (minw, minh) {
    var mw = minw, mh = minh;
    if (mw === TUFFWIDGETSIZE_MAX)
        mw = 0;
    if (mh === TUFFWIDGETSIZE_MAX)
        mh = 0;
    if (minw > TUFFWIDGETSIZE_MAX ||
        minh > TUFFWIDGETSIZE_MAX) {
      throw "Setting too big size";
    }
    if (minw < 0 || minh < 0) {
      throw "Setting negative size";
    }

    this.createExtra();

    if (this.extra.minw === mw && extra.minh === mh) {
        return false;
    }
    extra.minw = mw;
    extra.minh = mh;
    extra.explicitMinSize = (mw ? Tuff.Horizontal : 0) |
      (mh ? Tuff.Vertical : 0);

    return true;
  },

  setMaximumSize_helper: function (maxw, maxh) {
    if (maxw > TUFFWIDGETSIZE_MAX ||
        maxh > TUFFWIDGETSIZE_MAX) {
      throw "Setting too big size";
    }
    if (maxw < 0 || maxh < 0) {
      throw "Setting negative size";
    }

    this.createExtra();
    if (extra.maxw === maxw && extra.maxh === maxh)
        return false;
    extra.maxw = maxw;
    extra.maxh = maxh;
    extra.explicitMaxSize =
      (maxw !== TUFFWIDGETSIZE_MAX ? Tuff.Horizontal : 0) |
      (maxh !== TUFFWIDGETSIZE_MAX ? Tuff.Vertical : 0);
    return true;
  },

  setMinimumSize: function (minimumSize) {
    this.minimumSize = minimumSize;
  },

  setMaximumSize: function (maximumSize) {
    this.maximumSize = maximumSize;
  },

  setVisible: function (visible) {
    if (visible) {
      var needUpdateGeometry = !this.isWindow &&
        this.testAttribute(Tuff.WA_WState_Hidden);
      // we are no longer hidden
      this.setAttribute(Tuff.WA_WState_Hidden, false);

      if (needUpdateGeometry) {
        this.updateGeometry_helper(true);
      }

      if (this.layout) {
        this.layout.activate();
      }
    }
  }

});




var LayoutItem = {
  init: function (alignment) {
    this.align = alignment;
  },

  setAlignment: function (alignment) {
  },

  sizeHint: function () { throw "Missing necessary method override"; }
};






// Inherited from TuffObject, mixed in with LayoutItem

var Layout = create(TuffObject, Object.assign({}, LayoutItem, {
  SetDefaultConstraint: 0,
  SetNoConstraint: 1,
  SetMinimumSize: 2,
  SetFixedSize: 3,
  SetMaximumSize: 4,
  SetMinAndMaxSize: 5,

  itemAt: function (index) { throw "Missing necessary method override"; },

  init: function (widget) {

    // Initializing base constructor
    TuffObject.init.call(this, widget);

    // Initializing LayoutItem mixin
    LayoutItem.init.call(this);
    
    this.insideSpacing = -1;
    this.userLeftMargin = -1;
    this.userTopMargin = -1;
    this.userRightMargin = -1;
    this.userBottomMargin = -1;
    this.topLevel = false;
    this.enabled = true;
    this.activated = true;
    this.autoNewChild = false;
    this.constraint = Layout.SetDefaultConstraint;
    this.menubar = 0;
    this.rect = null;

    if (widget) {
      if (widget.layout) {
        throw "Attempting to add layout twice";
      }

      this.topLevel = true;
      widget.layout = this;
      try {
        this.invalidate();
      } catch (e) {
        widget.layout = null;
        throw e;
      }
    }
  },

  invalidate: function () {
    this.rect = create(Rect);
    this.update();
  },

  update: function () {
    var layout = this;
    while (layout && layout.activated) {
      layout.activated = false;
      if (layout.topLevel) {
        if (!layout.parent.isWidget) {
          throw "Layout parent should be widget";
        }

        // TODO: async!
        layout.parent.layoutRequest();
        break;
      }

      layout = layout.parent;
    }
  },


  addWidget: function (widget) {
  },

  activateRecursiveHelper: function (layoutItem) {
    layoutItem.invalidate();
    var layout = layoutItem.layout;
    if (layout) {
      var childLayoutItem;
      var i = 0;
      while ((childLayoutItem = layout.itemAt(i++))) {
        activateRecursiveHelper(childLayoutItem);
      }

      layout.activated = true;
    }
  },

  activate: function () {
    var parent = this.parent;

    if (!this.enabled || !parent)
        return false;

    if (!this.topLevel)
        return parent.activate();

    if (this.activated)
        return false;

    this.activateRecursiveHelper(this);

    var explMin = parent.extra ? parent.extra.explicitMinSize : 0;
    var explMax = parent.extra ? parent.extra.explicitMaxSize : 0;

    switch (this.constraint) {
    case Layout.SetFixedSize:
        // will trigger resize
        parent.setFixedSize(this.totalSizeHint());
        break;
    case Layout.SetMinimumSize:
        parent.setMinimumSize(this.totalMinimumSize());
        break;
    case Layout.SetMaximumSize:
        parent.setMaximumSize(this.totalMaximumSize());
        break;
    case Layout.SetMinAndMaxSize:
        parent.setMinimumSize(this.totalMinimumSize());
        parent.setMaximumSize(this.totalMaximumSize());
        break;
    case Layout.SetDefaultConstraint: {
        var widthSet = explMin & Tuff.Horizontal;
        var heightSet = explMin & Tuff.Vertical;
        if (parent.isWindow) {
            var ms = this.totalMinimumSize();
            if (widthSet)
                ms.setWidth(parent.minimumSize.width);
            if (heightSet)
                ms.setHeight(parent.minimumSize.height);

            parent.setMinimumSize(ms);

        } else if (!widthSet || !heightSet) {
            var ms = parent.minimumSize;
            if (!widthSet)
                ms.setWidth(0);
            if (!heightSet)
                ms.setHeight(0);

            parent.setMinimumSize(ms);
        }
        break;
    }
    case Layout.SetNoConstraint:
        break;
    }

    this.doResize(parent.size);

    if (parent.extra) {
        parent.extra.explicitMinSize = explMin;
        parent.extra.explicitMaxSize = explMax;
    }
    // ideally only if sizeHint() or sizePolicy() has changed
    parent.updateGeometry();
    return true;
  },

  doResize: function (size) {
    this.setGeometry(this.parent.rect);
  },

  setGeometry: function (rect) {
    this.rect = rect;
  },

  totalSizeHint: function () {
    var side = 0, top = 0;
    if (d.topLevel) {
        var pw = this.parent;
        side += pw.leftmargin + pw.rightmargin;
        top += pw.topmargin + pw.bottommargin;
    }

    var s = this.sizeHint();

    if (this.hasHeightForWidth()) {
      s.setHeight(this.heightForWidth(s.width() + side));
    }
    return s.add(TuffSize(side, top));
  },

  totalMaximumSize: function () {
    var side = 0, top = 0;
    if (this.topLevel) {
      var pw = this.parent;
      side += pw.leftmargin + pw.rightmargin;
      top += pw.topmargin + pw.bottommargin;
    }

    var s = this.maximumSize();

    if (d.topLevel) {
      s = TuffSize(tuffMin(s.width + side, TUFFLAYOUTSIZE_MAX),
                   tuffMin(s.height + top, TUFFLAYOUTSIZE_MAX));
    }
    return s;
  },

  // Override in child layout engine
  maximumSize: function () {
    return TuffSize(TUFFLAYOUTSIZE_MAX, TUFFLAYOUTSIZE_MAX);
  },

  // Override in child layout engine
  minimumSize: function () {
    return TuffSize(0, 0);
  },

  totalMinimumSize: function () {
    var side = 0, top = 0;
    if (this.topLevel) {
      var pw = this.parent;
      side += pw.leftmargin + pw.rightmargin;
      top += pw.topmargin + pw.bottommargin;
    }

    var s = this.minimumSize();
    return s.add(TuffSize(side, top));
  },
}));



var BoxLayout = create(Layout, {
  init: function (direction, widget) {

    this.hfwWidth = -1;
    this.dirty = true
    this.spacing = -1;

    Layout.init.call(this, widget);

    this.dir = direction;
  },

  addWidget: function (widget, stretch, alignment) {
  },

  itemAt: function (index) {
    return index >= 0 && index < this.list.count() ?
      this.list.at(index).item : 0;
  },

  invalidate: function () {
    this.setDirty();
    Layout.invalidate.call(this);
  },

  setDirty: function () {
    this.geomArray.clear();
    this.hfwWidth = -1;
    this.hfwHeight = -1;
    this.dirty = true;
  },

  setGeometry: function (r) {

    // Call setGeometry to children

    /*
    if (d->dirty || r != geometry()) {
        QRect oldRect = geometry();
        QLayout::setGeometry(r);
        if (d->dirty)
            d->setupGeom();
        QRect cr = alignment() ? alignmentRect(r) : r;

        int left, top, right, bottom;
        d->effectiveMargins(&left, &top, &right, &bottom);
        QRect s(cr.x() + left, cr.y() + top,
                cr.width() - (left + right),
                cr.height() - (top + bottom));

        QVector<QLayoutStruct> a = d->geomArray;
        int pos = horz(d->dir) ? s.x() : s.y();
        int space = horz(d->dir) ? s.width() : s.height();
        int n = a.count();
        if (d->hasHfw && !horz(d->dir)) {
            for (int i = 0; i < n; i++) {
                QBoxLayoutItem *box = d->list.at(i);
                if (box->item->hasHeightForWidth()) {
                    int width = qBound(box->item->minimumSize().width(), s.width(), box->item->maximumSize().width());
                    a[i].sizeHint = a[i].minimumSize =
                                    box->item->heightForWidth(width);
                }
            }
        }

        Direction visualDir = d->dir;
        QWidget *parent = parentWidget();
        if (parent && parent->isRightToLeft()) {
            if (d->dir == LeftToRight)
                visualDir = RightToLeft;
            else if (d->dir == RightToLeft)
                visualDir = LeftToRight;
        }

        qGeomCalc(a, 0, n, pos, space);

        bool reverse = (horz(visualDir)
                        ? ((r.right() > oldRect.right()) != (visualDir == RightToLeft))
                        : r.bottom() > oldRect.bottom());
        for (int j = 0; j < n; j++) {
            int i = reverse ? n-j-1 : j;
            QBoxLayoutItem *box = d->list.at(i);

            switch (visualDir) {
            case LeftToRight:
                box->item->setGeometry(QRect(a.at(i).pos, s.y(), a.at(i).size, s.height()));
                break;
            case RightToLeft:
                box->item->setGeometry(QRect(s.left() + s.right() - a.at(i).pos - a.at(i).size + 1,
                                             s.y(), a.at(i).size, s.height()));
                break;
            case TopToBottom:
                box->item->setGeometry(QRect(s.x(), a.at(i).pos, s.width(), a.at(i).size));
                break;
            case BottomToTop:
                box->item->setGeometry(QRect(s.x(),
                                             s.top() + s.bottom() - a.at(i).pos - a.at(i).size + 1,
                                             s.width(), a.at(i).size));
            }
        }
    }
    */
  },

  setSize: function (r, c) {
    if (this.rowData.size() < r) {
        var newR = tuffMax(r, this.rr * 2);
        this.rowData.resize(newR);
        this.rStretch.resize(newR);
        this.rMinHeights.resize(newR);
        for (var i = this.rr; i < newR; i++) {
            this.rowData[i].init();
            this.rowData[i].maximumSize = 0;
            this.rowData[i].pos = 0;
            this.rowData[i].size = 0;
            this.rStretch[i] = 0;
            this.rMinHeights[i] = 0;
        }
    }
    if (this.colData.size() < c) {
        var newC = tuffMax(c, this.cc * 2);
        this.colData.resize(newC);
        this.cStretch.resize(newC);
        this.cMinWidths.resize(newC);
        for (var i = this.cc; i < newC; i++) {
            this.colData[i].init();
            this.colData[i].maximumSize = 0;
            this.colData[i].pos = 0;
            this.colData[i].size = 0;
            this.cStretch[i] = 0;
            this.cMinWidths[i] = 0;
        }
    }

    if (this.hfwData && this.hfwData.size() < r) {
        this.hfwData = null;
        this.hfw_width = -1;
    }
    this.rr = r;
    this.cc = c;
  },

  addLayout: function () {},
  addSpacer: function () {},
  
});

function Layout_setupGeom () {
  // for horz:
  // hintw += spacing + childItem.sizeHint().width
  // hinth = tuffMax(hinth, childItem.sizeHint().height);

  this.minSize = TuffSize(minw, minh);
  this.maxSize = TuffSize(maxw, maxh).expandedTo(this.minSize);
  this.sizeHint = TuffSize(hintw, hinth)
    .expandedTo(minSize)
    .boundedTo(maxSize);

  this.dirty = false;
}

function Layout_sizeHint () {
  if (this.dirty) {
    this.setupGeom();
  }

  return this.sizeHint;
}

function Layout_totalSizeHint () {
  var side = 0;
  var top = 0;
  if (this.topLevel) {
    var pw = this.parentWidget();
    side += pw.leftmargin + pw.rightmargin;
    top += pw.topmargin + pw.bottommargin;
  }

  var s = this.sizeHint();
  if (this.hasHeightForWidth()) {
    s.height = this.heightForWidth(s.width + side);
  }

  return { width: s.width + side, height: s.height + top };
}

function tuffSmartMaxSize (component) {
  var sizeHint = component.sizeHint();
  var minSizeHint = component.minimumSizeHint();
  var minSize = component.minimumSize();
  var maxSize = component.maximumSize();
  var sizePolicy = component.sizePolicy();
}

function tuffSmartMinSize (component) {
  var sizeHint = component.sizeHint();
  var minSizeHint = component.minimumSizeHint();
  var minSize = component.minimumSize();
  var maxSize = component.maximumSize();
  var sizePolicy = component.sizePolicy();
  
  var s = create(Size).init(0, 0);

  if (sizePolicy.horizontalPolicy !== SizePolicy.Ignored) {
    if (sizePolicy.horizontalPolicy & SizePolicy.ShrinkFlag)
      s.width = minSizeHint.width;
    else
      s.width = tuffMax(sizeHint.width, minSizeHint.width);
  }

  if (sizePolicy.verticalPolicy !== SizePolicy.Ignored) {
    if (sizePolicy.verticalPolicy & SizePolicy.ShrinkFlag) {
      s.height = minSizeHint.height;
    } else {
      s.height = tuffMax(sizeHint.height, minSizeHint.height);
    }
  }

  s = s.boundedTo(maxSize);
  if (minSize.width > 0)
    s.width = minSize.width;
  if (minSize.height > 0)
    s.height = minSize.height;

  return s.expandedTo(QSize(0,0));
}

// Qt Layout Engine is very complex. We don't need to reimplement
// things which are already executed inside of browser.

// But we want to use simplified layout engines to provide
// controls with hints for common kinds of layout used in web and mobile.

// For example, depending on available height,
// root layout may provide space for header, footer, and scrollable area
// in the middle.
// Web works better with precise pixel layouts and breakpoints
// because of the numerous bugs of scalable units.
// Depending on the height available, root layout will compute
// height of top and bottom bars, and supply all children components
// with precise heights.
// For landscape, it may be possible to put the bar to the left side,
// and compute its width available depending on how wide screen is.
// Content will be relayouted in the center part of the screen then.
// Depending on the height available, additional bars and controls may
// appear, providing immersive desktop experience.
// In common case, root layout is complex beast
// flipping and flopping child components, showing and hiding
// some of them depending on height and width available.
// We will write custom layouts for every container component,
// refering layed items as abstract layout concepts, and not exactly
// functional elements - to keep possibility to factor out the layout
// code into some generic layout classes.
// Anyway, layout activates with given width and height.
// Depending on width and height, layout decides which components
// should be displayed and which sizes they should have.
// In Qt, those sizes are defined and extracted from child components,
// but we decided to control those hierarchically exclusively in layout.
// Parent layout determines exact widths, heights, positions,
// and visibility of all child components depending on width and height
// of its attached container component and laying out scheme.
// Laying out scheme supports very simple way of defining
// sizes and visibility of child components depending
// on height and width available.
// The scheme defines 2D ranges between fixed sizes.
// Within every range, it lists all components which
// should be visible, and determines precise size for most of components,
// but should define at least one loose sized component width or height.
// If several components are defined with loose sizes, size must
// be distributed between those. For example, a text label can be
// defined as minimum size, then layout engine will take width from
// the label component to determine used width.
// Components may provide width "classes" when queried from layout.
// Specific calculation of width may happen inside of a component
// depending on which size class it requested for.
// When one component in layout gets loose width, it may have minimum
// workable width.
// Another semi-loose components may provide exact width calculated
// from their possibly available width, when subtract all fixed size
// components and minimum workable widths of all loose size components.

// [l,t,w,h,z,type]

// When animation should be displayed as a transition between two screens,
// and some components are stay on both screens, some change size
// little bit, some morph between two different components with
// possible size change, and element which be morphed determines
// dynamically (scrollable list item tapped and scaled up to fit
// a subview when other items moved left and some new controls moved from
// right side of the screen, and item itself while scaling up
// was transforming into another view). The problem with intermediate
// sizes in this animation that those are not important to be completely
// laid out, for such morphing it may be enough to use final layout
// size and just render it scaled to present morphing.
// The whole thing is called layout transition. New sizes must be
// calculated before executing animation. And for each element on the
// previous layout it should be defined an element into which it will
// move / morph. If it is the same element (or we can use this technique
// to determine look and feel of intermediate frames when morphing),
// it's better to ask the element to render the transition animation
// so it will morph between its own parts hierarchically if it
// changes internal layout.

// Transition specifies target size for an element and result.
// It may be appearing, disappearing, just scaling, or moving on screen,
// including transitioning in and out of the visible area.
// When widget supplied with that information, it may calculate all
// necessary information for the transition before executing it.

// Dummest implementation may interpolate all intermediate sizes
// on the path of transition and lay out every size.
// But it's pretty expensive and may lead to unwrapping discrete steps,
// where component increases its size by steps showing parts of itself.

// So, when a component changes its geometry, transition animation request
// may be specified, as long as component's "taste" (case, mode)
// of presentation which may be selected depending on the current
// layout, and not purely determined by component's size.


// Layout constructor receives Component to layout inside
// or parent Layout. At construction phase,
// Layout assigns reference to itself to the Component
// or adds itself as a child layout to its parent layout.
// Then it activates topLevel layout if its parent Component is visible.
// Navigation between screens which should appear animated
// can be made by a special animated layout.
// It can work without parent layouts. In that case, to integrate
// child layouts it's necessary to create child container components.
// Layout can be created without reference to parent Component or layout.
// It can be possible to call Component.setLayout() method later,
// it'll assign reference to layout and sets parent, and calls
// invalidate() on layout. It also reparents all components
// and makes them children of that component.
// Child components are always children of parent component,
// not a layout.

// To show a Component, it's necessary to call its show() method.
// The show() method activates layout (which calculates sizes of
// all child components), also it activates layout of all parent widgets
// from bottom to top, then it shows all children, draws itself,
// and then it tells its parent to redraw itself.

// Root container should receive root layout to put anything
// inside of html page view. We can call it screen, but it is not
// screen. And it is not window, because it constrained to
// its tab view area. Moreover, mobile browsers love to display
// chrome around our root view, changing its size often.
// On rotation, root view changes its size also.
// Every time it happens, it calls layout engine to position child
// items.
// Possible calls from layout engine to children components
// (considering that width and height are given) from layout method
// setGeometry:
//   maximumSize - (0,0) if empty or tuffSmartMaxSize for the component.
//           which calls
//   minimumSize - (0,0) if empty or tuffSmartMinSize for the component,
//           which calls
//             sizeHint
//             minimumSizeHint - returns (-1,-1) or totalMinimumSize
//                               of attached layout.
//             minimumSize
//             maximumSize
//             sizePolicy
//   sizeHint - widgets (-1,-1) if no layout is attached, or
//              totalSizeHint() of the attached layout,
//              which calls Layout.setupGeom of it
//              and returns calculated Layout.sizeHint value.
//              But specific child widget will implement
//              their own custom logic for this method.
//              For example, a button will calculate it as:
//              Canvas.context.measureText() and asking
//              style.sizeFromContents() for specific style element
//              and the measured text size.
//   sizePolicy
//     (accessed thru item's expandingDirections)
//      and thru item's controlTypes)
//   hasHeightForWidth
//   setGeometry - after calculations are done.

var ViewContainer = create(Widget, {
  init: function (content) {
    // We using self only in those overriding functions
    var self = this;

    // May be list or layout, or WebGL, or Canvas
    this.content = content;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Child class creates layout:
    this.someTextField = create(tuff.LineEdit).init(this);
    this.someComboBox = create(tuff.ComboBox).init(this);

    // Creates back reference to the layout in parent widget.
    // when the widget will be displayed, 
    var layout = create(tuff.BoxLayout).init(this);
    // Makes widget as a child of its parent widget,
    // inserts LayoutItem to track layout,
    // activates layout.invalidate(), which sends
    // layoutRequest to the respective widget and all its parents
    layout.addWidget(create(tuff.Label).init('Hello'), 0, 0);
    layout.addWidget(self.someTextField, 0, 1);
    layout.addWidget(create(tuff.Label).init('Another'), 1, 0);
    this.someComboBox.setEditable(false);
    this.someComboBox.addItem('1');
    this.someComboBox.addItem('2');
    this.someComboBox.addItem('3');
    layout.addWidget(this.someComboBox, 1, 1);

    var buttonBox = create(tuff.DialogButtonBox,
      { rejected: function () {
          self.reject();
        },
        accepted: function () {
          self.accept();
        }
      })
      .init(tuff.DialogButtonBox.Ok | tuff.DialogButtonBox.Cancel, this);

    layout.addWidget(buttonBox, 2, 0, 1, 2);
  },

  // In dialog class:
  accept: function () {
  },

  // In dialog class:
  reject: function () {
  },

  setTitle: function (title) {
  },

  // All view should be repainted
  updateRequest: function () {
    // call render here
  },

  onResize: function (newSize, oldSize) {
    var self = this;
    console.log(newSize.width, newSize.height);
    // resize child content or layout
    content.resize(newSize);
    self.render();
  },

  render: function (h) {
    var self = this;

    return h('body',
      self.content);
  }
  
});

var Cont = create(Component, {
  init: function (self, parent) {
    parent.call(self);

    /*
    var metaViewport = document.querySelector('meta[name=viewport]');
    if (!metaViewport) {
      metaViewport = document.createElement('meta');
      metaViewport.id = 'viewport';
      metaViewport.name = 'viewport';
      document.getElementsByTagName('head')[0].appendChild(metaViewport);
    }

    metaViewport.setAttribute('content',
      'user-scalable=0, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0');
    */

    self.child1 = create(Child, {
      onFocus: function () {
        setTimeout( function () {
          var rect = self.trackedFrame.getBoundingClientRect();
          window.resizeTo(self.width, self.height);
          console.log('Tracked frame',
            rect, window.innerHeight, self.width, self.height);
        }, 1000);
        return Child.onFocus.apply(self.child1, arguments);
      }
    }).init();
    self.child2 = create(Child).init();
    self.c2 = create(C2).init();

    self.width = window.innerWidth;
    self.height = window.innerHeight;// - 88;
    self.minimumWidth = self.width < self.height ?
      self.width : self.height;
    self.offsetTop = 0;

    function orientation () {
      return window.screen.orientation ? window.screen.orientation.type :
        (window.orientation === 90 || window.orientation === -90) ?
        'portrait' : 'landscape';
    }

/*
    document.documentElement.style.width = self.width + 'px';
    document.documentElement.style.height = self.height + 'px';
    document.documentElement.height = self.height + 'px';
    document.documentElement.style.overflow = 'scroll';
*/
    console.log('INIT WITH', this.width, this.height,
      document.documentElement.offsetTop,
      document.documentElement.clientWidth,
        document.documentElement.clientHeight,
        document.documentElement.offsetHeight,
        document.documentElement.scrollHeight,
        window.screen.height, window.screen.width,
        //window.orientation || window.screen.orientation.type,
        window.screen.availTop, window.screen.availHeight,
        window.screen.availLeft, window.screen.availWidth);

    self.c2.setHeight(self.height);


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

    window.addEventListener('scroll', function (event) {

      self.lastScrollHappenAt = new Date().valueOf();

      if (self.lastResizeHappenAt &&
          (self.lastScrollHappenAt - self.lastResizeHappenAt)
          < 500) {
        console.log('SCROLL CANCELED', window.pageYOffset,
          window.innerHeight);
        return;
      }

      var barsDiff = window.screen.height -
        document.documentElement.clientHeight - 20;
      var barsDiffLandscape = window.screen.width -
        document.documentElement.clientHeight - 20;

      var fixHeight = window.outerHeight - window.pageYOffset +
        window.innerHeight - 1;

      console.log('==========WINDOW SCROLL',
        window.pageYOffset,
        window.innerHeight,
        window.innerHeight,
        self.scrollTop,
        document.documentElement.clientWidth,
        document.documentElement.clientHeight,
        document.documentElement.offsetHeight,
        document.documentElement.scrollHeight,
        window.screen.height, window.screen.width,
        // window.orientation || window.screen.orientation.type,
        window.screen.availTop, window.screen.availHeight,
        window.screen.availLeft, window.screen.availWidth,
        barsDiff, barsDiffLandscape);

      // 111 350 350 0    320 460 0 0 568 320 0 568 0 320
      // 131 310 310 null 320 440 0 0 568 320 0 568 0 320

      if (window.pageYOffset > 0) {
        //self.width = window.innerWidth;
        // self.height = window.innerHeight + window.pageYOffset;


        if (!window.orientation) {
          // Working for portrait in Safari only
          //self.height = (200 - (self.scrollTop || 0) -
          //  window.pageYOffset) * 2 + 20 + 1.5 + barsDiff - 88 + 20;
          // Works embedded in iOS
          self.height = (200 - (self.scrollTop || 0) -
            window.pageYOffset) * 2 + 1.5 + 88;

        } else {
          // Working for landscape in Safari only
          //self.height = (200 - (self.scrollTop || 0) -
          //  window.pageYOffset) * 2 + 20 + 1.5;
          // Works embedded in iOS (height on start determined incorrectly
          // but after restoring scroll is correct.
          self.height = (200 - (self.scrollTop || 0) -
            window.pageYOffset) * 2 + 20 + 1.5 + 44;
        }

        // self.height = 52;//fixHeight - 44;

        self.offsetTop = window.pageYOffset - 0.5;

        self.c2.setHeight(self.height);

        self.invalidate();
        self.render();
        
        // window.scrollTo(0, 0);
      } else {
        setTimeout(function () {
          self.width = window.innerWidth;
          self.height = window.innerHeight;// + self.offsetTop;
          self.offsetTop = 0;

          self.c2.setHeight(self.height);

          self.invalidate();
          self.render();
       }, 500);

        return;

        self.width = window.innerWidth;
        self.height = window.innerHeight;

      document.documentElement.style.width = self.width + 'px';
      document.documentElement.style.height = self.height + 'px';
      document.documentElement.height = self.height + 'px';
      document.documentElement.style.overflow = 'hidden';
      document.body.height = self.height + 'px';
      document.body.style.height = self.height + 'px';
      document.body.style.overflow = 'hidden';

      var metaViewport = document.querySelector('meta[name=viewport]');

      metaViewport.setAttribute('content',
        'width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, shrink-to-fit=0, height=' + self.height);

      self.c2.setHeight(self.height);

        self.invalidate();
        self.render();


        console.log(document.documentElement.clientWidth,
          document.documentElement.clientHeight,
          document.documentElement.offsetHeight,
          document.documentElement.scrollHeight,
          window.screen.height, window.screen.width,
          // window.orientation || window.screen.orientation.type,
          window.screen.availTop, window.screen.availHeight,
          window.screen.availLeft, window.screen.availWidth);

        console.log(document.body.clientWidth,
          document.body.clientHeight,
          document.body.offsetHeight,
          document.body.scrollHeight);
      }
    });

    window.addEventListener("touchstart", function (e) {
      console.log('Window touch', window.innerHeight, window.outerHeight, window.screenTop);
      // e.preventDefault();
      
      e.stopPropagation();
      e.preventDefault();
      e.cancelBubble = true;
    }, true);

    window.addEventListener("touchend", function (e) {
      console.log('Window touch end', window.innerHeight, window.outerHeight, window.screenTop);
      // e.preventDefault();
      e.stopPropagation();
      e.preventDefault();
      e.cancelBubble = true;
    }, true);

    window.addEventListener("touchmove", function (e) {
      console.log('Window move');
      // e.preventDefault();
    }, true);

    // handle event
    window.addEventListener("resize", function() {

      self.lastResizeHappenAt = new Date().valueOf();

      console.log('RESIZE REQUESTED', orientation());

      if (self.lastOrientationChangeHappenAt &&
          (self.lastResizeHappenAt - self.lastOrientationChangeHappenAt)
          < 500) {
        console.log('RESIZE CANCELED');
        return;
      }

      console.log('RES.W=', document.documentElement.clientWidth,
        document.documentElement.clientHeight,
        document.documentElement.offsetHeight,
        document.documentElement.scrollHeight,
        window.screen.height, window.screen.width,
        //window.orientation || window.screen.orientation.type,
        window.screen.availTop, window.screen.availHeight,
        window.screen.availLeft, window.screen.availWidth,
        window.clientWidth, window.clientHeight);

      console.log(document.body.clientWidth,
        document.body.clientHeight,
        document.body.offsetHeight,
        document.body.scrollHeight);

      self.width = document.documentElement.clientWidth; //window.innerWidth;
      self.height = window.innerHeight;
/*
      document.documentElement.style.width = self.width + 'px';
      document.documentElement.style.height = self.height + 'px';
      document.documentElement.height = self.height + 'px';
      document.documentElement.style.overflow = 'hidden';
      document.body.height = self.height + 'px';
      document.body.style.height = self.height + 'px';
      document.body.style.overflow = 'hidden';

      var metaViewport = document.querySelector('meta[name=viewport]');

      metaViewport.setAttribute('content',
        'width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, shrink-to-fit=0, height=' + self.height);
*/
      self.c2.setHeight(self.height);

      console.log('RESIZE:',
	window.pageXOffset,
        window.pageYOffset,
        window.innerWidth,
        window.innerHeight);

      self.invalidate();
      self.render();

      // solve bug with invalid offset after rotation on iPhone.
      if (window.pageYOffset > 0) {
        window.scrollTo(0, 0);
      }

      // self.c2.setHeight(self.height);
      console.log(document.documentElement.clientWidth,
        document.documentElement.clientHeight,
        document.documentElement.offsetHeight,
        document.documentElement.scrollHeight,
        window.screen.height, window.screen.width,
        //window.orientation || window.screen.orientation.type,
        window.screen.availTop, window.screen.availHeight,
        window.screen.availLeft, window.screen.availWidth);

      console.log(document.body.clientWidth,
        document.body.clientHeight,
        document.body.offsetHeight,
        document.body.scrollHeight);
    });

    window.addEventListener('orientationchange', function() {

      self.lastOrientationChangeHappenAt = new Date().valueOf();

      console.log(window.innerWidth, window.innerHeight,
        self.width, self.height, self.width === window.innerWidth,
        self.height === window.innerHeight,
        self.lastOrientationChangeHappenAt -
        self.lastResizeHappenAt);
        // window.orientation || window.screen.orientation.type);

      // iOS: P->L 568 320 568 320 true true 15
      //      L->P 320 460 320 460 true true 24
      // Chrome Desktop Emulator iOS: P->L 568 320 852 480 false false 10
      //                              L->P 852 480 568 320 false false 13
      // Chrome Android: P->L 320 452 320 452 true true null or > 500
      //                 L->p 534 239 534 239 true true null or > 500
      // Chrome Win Touch: we have no orientation event.

      // Google Chrome Mobile requires document's width being less
      // than screen width, otherwise it'll resize viewport:
      if (!self.lastResizeHappenAt ||
          (self.lastOrientationChangeHappenAt - self.lastResizeHappenAt)
          > 500) {
        if (self.width > self.height) {
          console.log('L->P Google Chrome Mobile');
          self.setWidth(self.minimumWidth);
        }
      }
      

      return;

      // On iOS resize comes first to create beautiful rotation transition
      // animation.
      if (window.innerWidth !== self.width ||
          window.innerHeight !== self.height) {

        if (self.innerWidth > self.innerHeight) {
          // Change width before returning to portrait mode, otherwise
          // browser will change viewport's scale.
          console.log('L->P iOS', window.innerWidth);
          self.setWidth(self.minimumWidth);
        } else {
          console.log('P->L iOS', window.innerWidth, window.innerHeight,
            self.width, self.height, window.orientation);
          self.setWidth(window.innerWidth);
        }
      }
      
      if (window.innerWidth === self.width &&
          window.innerHeight === self.height) {

        if (window.innerWidth > window.innerHeight) {
          // Change width before returning to portrait mode, otherwise
          // browser will change viewport's scale.
          console.log('L->P Chrome', window.innerWidth);
          self.setWidth(self.minimumWidth);
        }
      }

      console.log('ORIENTATION', window.innerWidth, window.innerHeight,
        self.width, self.height);
    });

    return this;
  },
  setWidth: function (self, width) {
    this.width = width;
    this.invalidate();
    this.render();
  },
  view: function (self, h) {
    // console.log(window);
    var self = this;

    console.log('--- HEIGHT:', self.height);

    // return h('body');
    return h('body',
      { style:
        { backgroundColor: 'yellow'
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
              // e.stopPropagation();
              e.preventDefault();
            },

          touchmove:
            function (e) {
              self.touched = true;
              console.log('Touchmove');//, flatten(e));
              
              // e.stopPropagation();
              e.preventDefault();
            },

          touchend:
            function (e) {
              self.touched = false;
              console.log('Touchend');//, flatten(e));
              // e.stopPropagation();
              e.preventDefault();
            },
        }
      },
      [
        h('div', { style: {
          backgroundColor: 'green',
          position: 'fixed',
          // top: '90%', //self.height - 20 + 'px',
          '-webkitBackfaceVisibility': 'hidden',
          bottom: '0px',
          right: 20 + 'px',
          zIndex: '1000'
        } },
        'RightBottom'),

      h('div#scrollingDiv',
        { style:
          { backgroundColor: 'green',
            height: self.height + 'px',
            width: self.width + 'px',
            overflowY: 'scroll',
            overflowX: 'hidden',
            '-webkitOverflowScrolling': 'touch',
            position: 'absolute',
            top: self.offsetTop + 'px'
          },
          hook:
          { postpatch:
              function (old, vnode) {
                var scrollingDiv = vnode.elm;
                console.log('DIV', scrollingDiv.clientWidth,
                  scrollingDiv.clientHeight,
                  scrollingDiv.offsetHeight,
                  scrollingDiv.scrollHeight);
              },

            insert:
              function (vnode) {
                var scrollingDiv = vnode.elm;
                console.log('DIV', scrollingDiv.clientWidth,
                  scrollingDiv.clientHeight,
                  scrollingDiv.offsetHeight,
                  scrollingDiv.scrollHeight);

                if (scrollingDiv.scrollTop === 0) {
                  self.atTop = true;
                }
                if (scrollingDiv.scrollHeight <= scrollingDiv.clientHeight) {
    console.log(scrollingDiv.scrollHeight, scrollingDiv.clientHeight);
    self.atBottom = true;
  }

  scrollingDiv.addEventListener('scroll', function(event){

    console.log('---SCROLL', event.target.scrollTop);
    self.scrollTop = event.target.scrollTop;
    
    if (event.target.scrollTop === 0) {
      self.atTop = true;
    } else {
      self.atTop = false;
    }
    
    if (event.target.scrollHeight - event.target.scrollTop === event.target.clientHeight) {
      self.atBottom = true;
    } else {
      self.atBottom = false;
    }
  });
  
  var lastY = 0;
  
  var topLock = false;
  var bottomLock = false;
  scrollingDiv.addEventListener('touchmove', function(event){
    console.log('Touchmove');
    event.preventDefault();
    console.log(screen.height, screen.availHeight, window.outerHeight);
    event.stopPropagation();
    var currentY = event.touches[0].clientY;
    if (currentY > lastY) {
      // moved down
      if (self.atTop) {
        event.preventDefault();
        console.log('pd');
        topLock = true;
      }
      
      if (bottomLock) {
        bottomLock = false;
        console.log('Unlocking bottom');
      }
      
    } else if(currentY < lastY){
      // moved top
      if (self.atBottom) {
        event.preventDefault();
        console.log('pd');
        bottomLock = true;
      }
      
      if (topLock) {
        topLock = false;
        console.log('Unlocking top');
      }
    }
     
    lastY = currentY;
  });
  scrollingDiv.addEventListener('touchstart', function(event){
    // TODO: logic when another touch happened.
    // We should prevent pinch zoom here and deactivation of our locks.
    lastY = event.touches[0].clientY;
    console.log('TOUCHSTART');
    event.stopPropagation();
    event.preventDefault();
  });
  scrollingDiv.addEventListener('touchend', function(event){
    console.log('TOUCHEND');
    event.preventDefault();
    event.stopPropagation();
  }, true);

              }
          }
        },
        
          h('div',
            { style:
              { backgroundColor: 'white',
                height: '1460px'
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
            [ this.child1.comp()
            ]
          )
      ),
      this.c2.comp(),
      h('div', { style: {
          backgroundColor: 'green',
          position: 'absolute',
          bottom: self.height - 20 + 'px'
        } },
        'TopLeft'),
      h('div', { style: {
          backgroundColor: 'green',
          position: 'absolute',
          top: '0px', //self.offsetTop / 2 + 'px',
          left: self.width - 67 + 'px'
        } },
        'TopRight'),
      h('div', { style: {
          backgroundColor: 'red',
          position: 'absolute',
          // bottom: 0 + 88 + 'px',
          top: self.height - 20 + 'px',
          right: 0 + 'px'
        } },
        'RightBottom'),

        h('div', { style: {
          backgroundColor: 'green',
          position: 'absolute',
          top: '100%', //self.height - 20 + 'px',
          right: 20 + 'px'
        } },
        'RightBottom')

      ]
    );

  }
});


window.onload = function () {
  window.scrollTo(0, 0);

  console.log('------LOAD');

    //var root = document.getElementsByTagName('body')[0];
    //root.innerHTML = '';

    //var cont = create(Cont).init();

    //cont.mount(root);
    //cont.render();
};

// TODO: this should be called from main view frame
document.addEventListener('DOMContentLoaded', function () {


  setTimeout(function () {
    var root = document.getElementsByTagName('body')[0];
    root.innerHTML = '';
    //root.style.height = window.innerHeight;
    //root.style.width = window.innerWidth;

    var cont = create(Cont).init();

    cont.mount(root);
    cont.render();
    // window.scrollTo(0, 0);

    console.log(screen.height, screen.availHeight, window.outerHeight);
  }, 1500);

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

