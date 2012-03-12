define('simple-touch/manager', ['simple-touch'], function(ST) {

  var Manager = function() {
    var sources = [];
    var targets = [];

    var currentTarget = null;

    var findValidDropTarget = function(avatar, source) {
      for (var i = 0, l = targets.length; i < l; i++) {
        var target = targets[i];
        if (target.isValidDrop(avatar, source)) {
          return target;
        };
      }

      return null;
    };

    this.startDrag = function(e, avatarNode, source) {
      var options = ST.merge(source.getMoverOptions(), {
        startCallback: function(mover) {
          mover.source = source;
        },
        stopCallback: function(mover) {
          // avatar dropped, check if we're over a target or what
          var target;
          if (target = findValidDropTarget(mover, source)) {
            if (target.node == source.node) {
              source.droppedHere(mover, target, e);
              target.droppedHere(mover, source, e);
            } else {
              source.droppedElsewhere(mover, target, e);
              target.droppedHere(mover, source, e);
            }
          } else {
            source.droppedNowhere(mover, e);
          }
          mover.destroy();
          currentTarget = null;
        },

        moveCallback: function(mover, x, y, e) {
          var target;
          if (target = findValidDropTarget(mover, source)) {
            if (currentTarget && target !== currentTarget) {
              currentTarget.avatarLeft(avatar, source, e);
            }
            currentTarget = target;
            mover.addClass('stOverTarget');
            target.avatarMoved(mover, source, e);
          } else {
            mover.removeClass('stOverTarget');

            if (currentTarget) {
              currentTarget.avatarLeft(avatar, source, e);
            }

            currentTarget = null;
          }
        }
      });

      var Mover = require('simple-touch/mover');

      var avatar = new Mover(avatarNode, options);

      avatar.startDrag(e);
      avatar.move(e);
      this.avatar = avatar;

      return avatar;
    };

    this.addSource = function(source) {
      sources.push(source);
    };

    this.addTarget = function(target) {
      targets.push(target);
    };

    this.targetForNode = function(targetNode) {
      for (var i = 0, l = targets.length; i < l; i++) {
        if (targets[i].node == targetNode) {
          return targets[i];
        }
      }
    };

    this.sourceForNode = function(sourceNode) {
      for (var i = 0, l = sources.length; i < l; i++) {
        if (sources[i].node == sourceNode) {
          return sources[i];
        }
      }
    };
  };

  return new Manager();

});