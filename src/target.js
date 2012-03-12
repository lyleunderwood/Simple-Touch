define('simple-touch/target', ['simple-touch', './manager'],
  function(ST, Manager) {

  var Target = function(node, options) {
    if (!options) {
      options = {};
    }

    var defaultOptions = {
      // enable sorting
      sort: true,

      // the class to be applied to our splitter node when created
      splitterClass: 'stSplitter',

      // only sort stuff that came from the Source that overlaps thit Target
      sortInternalOnly: false,

      // vertical, horizontal, or grid
      orientation: 'vertical',

      // function for building a new item
      itemBuilder: function(avatar, source) {
        var sourceNode = avatar.node;
        var node = document.createElement(sourceNode.tagName);
        node.innerHTML = sourceNode.innerHTML;
        node.className = '';
        return node;
      }
    };

    options = ST.merge(defaultOptions, options);

    var self = this;

    this.options = options;

    this.node = node;

    var avatarPosition = null;

    var splitter = null;

    var setup = function() {
      splitter = document.createElement('div');
      splitter.className = ' ' + options.splitterClass;
      if (options.orientation == 'vertical') {
        splitter.className += ' vertical';
      } else {
        splitter.className += ' horizontal';
      }
    };

    var sortItemVertical = function(itemCoords) {
      var x = itemCoords[0];
      var y = itemCoords[1];
      var nodes = node.children;
      var relativePosition = null;
      var child = null;

      for (var i = 0, l = nodes.length; i < l; i++) {
        child = nodes[i];
        if (child.style.display == 'none') {
          continue;
        }

        var box = ST.findBox(child);

        if (y > box.y + box.h / 2) {
          relativePosition = 'after';
        } else {
          relativePosition = 'before';
          break;
        }

      }

      return {
        child: child,
        relativePosition: relativePosition
      };
    };

    var sortItemHorizontal = function(itemCoords) {
      var x = itemCoords[0];
      var y = itemCoords[1];
      var nodes = node.children;
      var relativePosition = null;
      var child = null;

      for (var i = 0, l = nodes.length; i < l; i++) {
        child = nodes[i];
        if (child.style.display == 'none') {
          continue;
        }

        var box = ST.findBox(child);

        if (x > box.x + box.w / 2) {
          relativePosition = 'after';
        } else {
          relativePosition = 'before';
          break;
        }

      }

      splitter.style.height = box.h + 'px';

      return {
        child: child,
        relativePosition: relativePosition
      };
    };

    var sortItemGrid = function(itemCoords) {
      var x = itemCoords[0];
      var y = itemCoords[1];
      var nodes = node.children;
      var relativePosition = null;
      var child = null;

      var clear = false;

      for (var i = 0, l = nodes.length; i < l; i++) {
        child = nodes[i];
        if (child.style.display == 'none' || child == splitter) {
          continue;
        }

        var box = ST.findBox(child);
        if (y > box.y + box.h / 1.2) {
          relativePosition = 'after'; // the mouse is too low on this box
          clear = true;
        } else {
          if (x > box.x + box.w / 2 && y > box.y + box.h / 8) {
            // the mouse is to the right of and vertically within this box
            relativePosition = 'after';
            clear = false;
          } else {
            // the mouse is to the left of this box
            relativePosition = 'before';
            break;
          }
        }
      }

      splitter.style.height = box.h + 'px';
      splitter.style.clear = clear ? 'left' : 'none';

      return {
        child: child,
        relativePosition: relativePosition
      };
    };

    var sortAvatar = function(avatar, e) {
      var touch = e.touches[0];

      var x = parseInt(touch.pageX);
      var y = parseInt(touch.pageY);

      var relativePosition, child;

      if (options.orientation == 'vertical') {
        var obj = sortItemVertical([x, y]);
        relativePosition = obj.relativePosition;
        child = obj.child;
      } else if (options.orientation == 'horizontal') {
        var obj = sortItemHorizontal([x, y]);
        relativePosition = obj.relativePosition;
        child = obj.child;
      } else if (options.orientation == 'grid') {
        var obj = sortItemGrid([x, y]);
        relativePosition = obj.relativePosition;
        child = obj.child;
      }

      if (child) {
        if (relativePosition == 'before') {
          self.node.insertBefore(splitter, child);
        } else {
          self.node.appendChild(splitter);
        }
      }

    };

    var stopSorting = function() {
      if (!splitter.parentNode) {
        return;
      }

      self.node.removeChild(splitter);
    };

    this.isValidType = function(type) {
      if (!options.types) {
        return true;
      }

      if (options.types.indexOf(type) !== -1) {
        return true;
      }
    };

    this.isValidDrop = function(avatar, source) {
      return this.isValidType(source.type) &&
        avatar.testNode(this.node, 'anchor');
    };

    this.droppedHere = function(avatar, source, e) {
      var item = options.itemBuilder(avatar, source);
      if (item) {
        if (splitter.parentNode) {
          self.node.replaceChild(item, splitter);
        } else {
          self.node.appendChild(item);
        }

      }
      stopSorting();
    };

    this.avatarMoved = function(avatar, source, e) {
      if (
        options.sort &&
        self.node.children.length > 0 &&
        (!options.sortInternalOnly || source.node === node))
      {
        sortAvatar(avatar, e);
      }
    };

    this.avatarLeft = function(avatar, source, e) {
      stopSorting();
    };

    setup();

    Manager.addTarget(this);
  };

  return Target;

});