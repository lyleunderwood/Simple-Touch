define('simple-touch/source', ['simple-touch', './manager'],
  function(ST, Manager) {

  Source = function(node, options) {
    if (!options) {
      options = {};
    }

    var defaultOptions = {
      // class name to match for draggable items
      dragTargetClass: undefined,

      // a function for finding draggable items (see defaultMatcher below)
      dragTargetMatcher: undefined,

      // the class that gets applied to the avatar upon creation
      avatarClass: 'stAvatar',

      // 'clone', 'move', or a function which takes the dragged node as an
      // argument and returns a node to be used as the avatar
      avatarMethod: 'move',

      // this is actually the pixel offset required before a drag starts
      dragTimer: 0,

      // class for finding the drag handle for a draggable
      dragHandleClass: undefined,

      // options to be passed to the Mover when the avatar is created (see Mover)
      moverOptions: {},

      // types are matched by Targets, so that only matching types can be dropped
      type: undefined,

      // function(source, avatarMover, e)
      dragStartCallback: undefined,
      // function(source, avatarMover, e)
      droppedCallback: undefined,
      // function(source, avatarMover, e)
      removedCallback: undefined
    };

    options = ST.merge(defaultOptions, options);

    var self = this;

    this.options = options;

    this.node = node;

    // on ios touchstartEvent.touches[0] is actually the same TouchEvent instance
    // as touchmoveEvent.touches[0]. therefore i use this struct to just hold onto
    // it's values
    var Point = function(x, y) {
      this.x = x;
      this.y = y;
    };

    var dragStartTouch = null;

    var defaultMatcher = function(matchNode) {
      // apparently real touch events (or maybe just safari mobile) will use text
      // nodes as the target where click events will not ? so let's throw those
      // out
      if (Object.prototype.toString.apply(matchNode) == '[object Text]') {
        return false;
      }

      if (options.dragTargetClass) {
        // ugh, no classList api in mobile safari
        //return matchNode.classList.contains(options.dragTargetClass);
        // close enough
        return matchNode.className.indexOf(options.dragTargetClass) !== -1;
      }

      return matchNode.parentNode == node ? true : false;
    };

    if (options.dragTargetMatcher) {
      if (typeof options.dragTargetMatcher === 'string') {
        options.dragTargetClass = options.dragTargetMatcher;
        options.dragTargetMatcher = defaultMatcher;
      }
    } else {
      options.dragTargetMatcher = defaultMatcher;
    }

    var checkHandle = function(targetNode) {
      if (Object.prototype.toString.apply(targetNode) == '[object Text]') {
        return false;
      }

      if (!options.dragHandleClass) {
        return false;
      }

      return targetNode.className.indexOf(options.dragHandleClass) !== -1;
    };

    var getTarget = function(e) {
      var target = e.target;
      var needHandle = !!options.dragHandleClass;
      var gotHandle = false;

      while (
        target && // we're not outside of the document root
        target !== node  && // we're not at the root of the source
        ( // find out if we've found the situation we need to start a drag
          ( // we need the drag handle and have not yet found it
            (needHandle && !(gotHandle || (gotHandle = checkHandle(target))))
          ) ||
          ( // we have gotten the handle but this is not the drag node
            (needHandle && gotHandle && !options.dragTargetMatcher(target)) ||
            // or we don't need the handle but this is still not the drag node
            (!needHandle && !options.dragTargetMatcher(target))
          )
        )
      ) {
        // move up the dom
        target = target.parentNode;
      }

      // we reached the root of the source, which is not valid for dragging
      if (target === node) {
        target = null;
      }

      return target ? target : null;
    };

    var prepareAvatarNode = function(avatar) {
      avatar.className += ' ' + options.avatarClass;
      return avatar;
    };

    var originalTargetDisplay = undefined;
    var hiddenTargetNode = null;
    var hideTarget = function(target) {
      originalTargetDisplay = target.style.display;
      target.style.display = 'none';
      hiddenTargetNode = target;
    };

    var unhideTarget = function() {
      if (!hiddenTargetNode) {
        return;
      }

      hiddenTargetNode.style.display = originalTargetDisplay;
      originalTargetDisplay = undefined;
      hiddenTargetNode = null;
    };

    var destroyHiddenTarget = function() {
      if (hiddenTargetNode) {
        hiddenTargetNode.parentNode.removeChild(hiddenTargetNode);
      }

      hiddenTargetNode = null;
      originalTargetDisplay = undefined;
    };

    var buildAvatar = function(sourceNode) {
      var method = 'move';
      if (options.avatarMethod && options.avatarMethod.apply) {
        return prepareAvatarNode(options.avatarMethod(sourceNode));
      }

      if (options.avatarMethod && typeof options.avatarMethod == 'string') {
        method = options.avatarMethod;
      }

      switch(method) {
        case 'copy':
          return prepareAvatarNode(sourceNode.cloneNode(true));
          break;
        case 'move':
        default:
          hideTarget(sourceNode);
          return prepareAvatarNode(sourceNode.cloneNode(true));
          //return prepareAvatarNode(sourceNode);
          break;
      }
    };

    var startDrag = function(target, e) {
      var avatarNode = buildAvatar(target);
      var avatar = Manager.startDrag(e, avatarNode, self);

      if (options.dragStartCallback) {
        options.dragStartCallback(self, avatar, e);
      }
    };

    var resetDragTimer = function() {
      dragStartTouch = null;
      document.removeEventListener('touchmove', updateDragTimer);
      document.removeEventListener('touchend', resetDragTimer);
      updateDragTimer = originalUpdateDragTimer;
    };

    var getDistance = function(startTouch, endTouch) {
      return Math.sqrt(
        Math.pow((endTouch.x - startTouch.x), 2) +
        Math.pow((endTouch.y - startTouch.y), 2)
      );
    };

    var originalUpdateDragTimer = updateDragTimer = function(e, callback) {
      var currentTouch = e.touches[0];
      currentTouch = new Point(currentTouch.pageX, currentTouch.pageY);

      if (getDistance(dragStartTouch, currentTouch) > options.dragTimer) {
        resetDragTimer();
        callback(e);
      }
    };

    var startDragTimer = function(e, target, callback) {
      if (!options.dragTimer) {
        return startDrag(target, e);
      }

      var touch = e.touches[0];

      dragStartTouch = new Point(touch.pageX, touch.pageY);

      updateDragTimer = function(e) {
        originalUpdateDragTimer(e, callback);
      };

      document.addEventListener('touchmove', updateDragTimer);
      document.addEventListener('touchend', resetDragTimer);
    };

    var handleStart = function(e) {
      var target;
      if (!(target = getTarget(e))) {
        return;
      }

      var touch = e.touches[0];

      if (!touch) {
        throw new Error('Source#handleStart was called without any touches for ' +
          'some reason.');
      }

      startDragTimer(e, target, function(endTouch) {
        startDrag(target, endTouch);
      });

      e.preventDefault();
    };

    var setup = function() {
      node.addEventListener('touchstart', handleStart);
    };

    this.getMoverOptions = function() {
      return self.options.moverOptions;
    };

    this.isTarget = function() {
      return Manager.targetForNode(node);
    };

    this.droppedNowhere = function(avatar, e) {
      if (avatar.source == this) {
        unhideTarget();
      }
    };

    this.droppedHere = function(avatar, target, e) {
      if (avatar.source == this) {
        if (self.isTarget()) {
          // i guess don't, because we can just move the target around in the list
          // later
          destroyHiddenTarget();
        } else {
          unhideTarget();
        }
      }

      if (options.droppedCallback) {
        options.droppedCallback(self, avatar, e);
      }
    };

    this.droppedElsewhere = function(avatar, target, e) {
      if (avatar.source === this) {
        destroyHiddenTarget();

        if (options.removedCallback) {
          options.removedCallback(this, avatar, e);
        }
      }
    };

    setup();

    Manager.addSource(this);
  };

  return Source;

});