define('simple-touch/mover', ['simple-touch'],
  function(ST) {

  var Mover = function(node, options) {
    if (!options) {
      options = {};
    }

    var defaultOptions = {
      // bounds can be broken, resulting in snap events
      snapBounds: false,

      // {x: y: w: h:} or a DOM node
      bounds: null,

      // 'middle', 'start', or {x: y:}
      anchor: 'middle',

      // distance the mouse must be pulled out of bounds to snap the object out
      snapDistance: 40,

      // autostart means the node will be setup with a touchstart event
      autostart: false,

      // class which will be applied to the node
      moverClass: 'stMover',

      // class applied to the node when snapped out of bounds
      snapOutClass: 'stSnapOut',

      // function(mover, e)
      startCallback: undefined,
      // function(mover, e)
      stopCallback: undefined,
      // function(mover, x, y, e) -- i don't know why this one is inconsistent
      moveCallback: undefined,

      // function(mover, x, y)
      boundsOutCallback: undefined,
      // function(mover, x, y)
      boundsInCallback: undefined,

      // bound callbacks will be called when the mover comes into contact with
      // an edge of its bounds

      // function(mover, touching)
      topBoundCallback: undefined,
      // function(mover, touching)
      bottomBoundCallback: undefined,
      // function(mover, touching)
      rightBoundCallback: undefined,
      // function(mover, touching)
      leftBoundCallback: undefined
    };

    options = ST.merge(defaultOptions, options);

    this.options = options;

    this.node = node;

    var self = this;

    var usesStartAnchor = false;

    var usesElementBounds = false;
    var originalBoundsElement = null;

    var nodePrepared = false;

    var nodeComputedStyle = null;

    var snappedBounds = false;

    var touchingTop = touchingLeft = touchingRight = touchingBottom = false;

    var prepareNode = function() {
      if (nodePrepared) {
        return;
      }

      node.style.position = 'absolute';
      node.style.display = 'block';
      document.body.appendChild(node);
      self.addClass(options.moverClass);

      nodeComputedStyle = window.getComputedStyle(node);

      nodePrepared = true;
    };

    var findPosition = function(node) {
      var left = 0;
      var top = 0;

      do {
        left += node.offsetLeft;
        top += node.offsetTop;
      } while (node = node.offsetParent);

      return [left, top];
    };

    var findSize = function(node) {
      var style = window.getComputedStyle(node);

      var w = parseInt(style.width) + parseInt(style.paddingLeft) +
        parseInt(style.paddingRight);

      var h = parseInt(style.height) + parseInt(style.paddingTop) +
        parseInt(style.paddingBottom);

      return [w, h];
    };

    var boundToElement = function(container, node, x, y) {
      var position = findPosition(container);
      var style = window.getComputedStyle(container);

      var box = {
        x: position[0],
        y: position[1],
        w: parseInt(style.width),
        h: parseInt(style.height)
      };

      originalBoundsElement = options.bounds;
      options.bounds = box;
      usesElementBounds = true;

      return boundToBox(box, node, x, y);
    };

    var falsifyAllBounds = function() {
      if (touchingTop) {
        touchingTop = false;
        if (options.topBoundCallback) {
          options.topBoundCallback(self, false);
        }
      }
      if (touchingBottom) {
        touchingBottom = false;
        if (options.bottomBoundCallback) {
          options.bottomBoundCallback(self, false);
        }
      }
      if (touchingLeft) {
        touchingLeft = false;
        if (options.leftBoundCallback) {
          options.leftBoundCallback(self, false);
        }
      }
      if (touchingRight) {
        touchingRight = false;
        if (options.rightBoundCallback) {
          options.rightBoundCallback(self, false);
        }
      }
    };

    var handleSnap = function(box, w, h, x, y) {
      if (!options.snapBounds) {
        return false;
      }

      var snapDistance = options.snapDistance;

      var box = {
        x: box.x - snapDistance,
        y: box.y - snapDistance,
        w: box.w + snapDistance * 2,
        h: box.h + snapDistance * 2
      };

      if (
        (x + w > box.w + box.x) ||
        (x < box.x) ||
        (y + h > box.y + box.h) ||
        (y < box.y)
      ) {
        if (!snappedBounds) {
          snappedBounds = true;
          self.addClass(options.snapOutClass);

          falsifyAllBounds();

          if (options.boundsOutCallback) {
            options.boundsOutCallback(self, x, y);
          }
        }
        return [x, y];
      }

      if (snappedBounds) {
        snappedBounds = false;
        self.removeClass(options.snapOutClass);
        if (options.boundsInCallback) {
          options.boundsInCallback(self, x, y);
        }
      }

      return false;
    };

    var boundToBox = function(box, node, x, y) {
      var size = findSize(node);
      var w = size[0];
      var h = size[1];

      var snapCoords;
      if (snapCoords = handleSnap(box, w, h, x, y)) {
        return snapCoords;
      }

      if (x + w > box.w + box.x) {
        x = box.w + box.x - w;

        if (!touchingRight) {
          touchingRight = true;
          if (options.rightBoundCallback) {
            options.rightBoundCallback(self, touchingRight);
          }
        }
      } else if (touchingRight) {
        touchingRight = false;
        if (options.rightBoundCallback) {
          options.rightBoundCallback(self, touchingRight);
        }
      }

      if (x < box.x) {
        x = box.x;

        if (!touchingLeft) {
          touchingLeft = true;
          if (options.leftBoundCallback) {
            options.leftBoundCallback(self, touchingLeft);
          }
        }
      } else if (touchingLeft) {
        touchingLeft = false;
        if (options.leftBoundCallback) {
          options.leftBoundCallback(self, touchingLeft);
        }
      }

      if (y + h > box.y + box.h) {
        y = box.y + box.h - h;

        if (!touchingBottom) {
          touchingBottom = true;
          if (options.bottomBoundCallback) {
            options.bottomBoundCallback(self, touchingBottom);
          }
        }
      } else if (touchingBottom) {
        touchingBottom = false;
        if (options.bottomBoundCallback) {
          options.bottomBoundCallback(self, touchingBottom);
        }
      }

      if (y < box.y) {
        y = box.y;

        if (!touchingTop) {
          touchingTop = true;
          if (options.topBoundCallback) {
            options.topBoundCallback(self, touchingTop);
          }
        }
      } else if (touchingTop) {
        touchingTop = false;
        if (options.topBoundCallback) {
          options.topBoundCallback(self, touchingTop);
        }
      }

      return [x, y];
    };

    var placeNode = function(x, y) {
      if (options.bounds) {
        var bounds = options.bounds;
        if (bounds.appendChild) {
          var coords = boundToElement(bounds, node, x, y);
          x = coords[0];
          y = coords[1];
        } else {
          var coords = boundToBox(bounds, node, x, y);
          x = coords[0];
          y = coords[1];
        }
      }

      node.style.top = y + 'px';
      node.style.left = x + 'px';
    };

    var getAnchorCoords = function() {
      if (options.anchor == 'middle') {
        var size = findSize(node);
        return [size[0] / 2, size[1] / 2];
      } else if (typeof options.anchor == 'object') {
        return [options.anchor.x, options.anchor.y];
      } else {
        return [0, 0];
      }
    };

    var performAnchorOffset = function(x, y) {
      if (!options.anchor) {
        return [x, y];
      }

      var anchorCoords = getAnchorCoords();

      return [x - anchorCoords[0], y - anchorCoords[1]];
    };

    var move = function(e) {
      var touch = e.touches[0];
      if (!touch) {
        throw new Error('Mover#move was called when we do not have a touch for' +
            ' some reason. ' + e);
      }

      e.preventDefault();

      var coords = performAnchorOffset(touch.pageX, touch.pageY);
      placeNode(coords[0], coords[1]);

      if (options.moveCallback) {
        options.moveCallback(self, coords[0], coords[1], e);
      }
    };

    this.getPosition = function() {
      var anchorCoords = getAnchorCoords();
      var position = findPosition(node);
      return [position[0] + anchorCoords[0], position[1] + anchorCoords[1]];
    };

    this.move = function(e) {
      move(e);
    };

    this.testBox = function(box) {
      var position = findPosition(node);
      var x = position[0];
      var y = position[1];
      var size = findSize(node);
      var w = size[0];
      var h = size[1];

      if (
        (x + w > box.w + box.x) ||
        (x < box.x) ||
        (y + h > box.y + box.h) ||
        (y < box.y)
      ) {
        return false;
      }

      return true;
    };

    this.testNode = function(target, type) {
      var position = findPosition(target);
      var size = findSize(target);

      if (type == 'anchor') {
        anchorCoords = getAnchorCoords();

        var nodePosition = findPosition(node);
        var x = nodePosition[0] + anchorCoords[0];
        var y = nodePosition[1] + anchorCoords[1];

        if (
          (x > size[0] + position[0]) ||
          (x < position[0]) ||
          (y > size[1] + position[1]) ||
          (y < position[1])
        ) {
          return false;
        }

        return true;
      }

      var box = {
        x: position[0],
        y: position[1],
        w: size[0],
        h: size[1]
      };

      return self.testBox(box);
    };

    this.stopDrag = function(e) {
      e.preventDefault();

      document.removeEventListener('touchmove', move);
      document.removeEventListener('touchend', self.stopDrag);

      if (usesStartAnchor) {
        options.anchor = 'start';
      }

      if (usesElementBounds) {
        options.bounds = originalBoundsElement;
      }

      if (options.stopCallback) {
        options.stopCallback(self, e);
      }
    };

    var handleStartAnchor = function(e) {
      if (options.anchor != 'start') {
        return;
      }

      var size = findSize(node);

      var pos = findPosition(node);

      options.anchor = {
        x: e.pageX - pos[0],
        y: e.pageY - pos[1]
      };

      usesStartAnchor = true;
    };

    this.addClass = function(className) {
      if (node.className.indexOf(className) !== -1) {
        return;
      }

      this.node.className += ' ' + className;
    };

    this.removeClass = function(className) {
      this.node.className = this.node.className.split(className).join('');
    };

    this.startDrag = function(e) {
      prepareNode();

      document.addEventListener('touchmove', move);
      document.addEventListener('touchend', this.stopDrag);

      handleStartAnchor(e);

      if (options.startCallback) {
        options.startCallback(self, e);
      }
    };

    if (options.autostart) {
      node.addEventListener('touchstart', function(e) {
        if (e.touches.length > 1) {
          return;
        }

        e.preventDefault();

        self.startDrag(e);
      });
    };

    this.destroy = function() {
      document.body.removeChild(node);
    };
  };

  return Mover;

});