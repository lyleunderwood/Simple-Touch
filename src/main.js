define('simple-touch', function() {

var ST = {

  merge: function() {
    var result = {};
    for (var i = 0, l = arguments.length; i < l; i++) {
      var obj = arguments[i];
      if (typeof obj !== 'object') {
        continue;
      }

      for (var key in obj) {
        result[key] = obj[key];
      }
    }

    return result;
  },

  findPosition: function(node) {
    var left = 0;
    var top = 0;

    do {
      left += node.offsetLeft;
      top += node.offsetTop;
    } while (node = node.offsetParent);

    return [left, top];
  },

  findSize: function(node) {
    var style = window.getComputedStyle(node);

    var w = parseInt(style.width) + parseInt(style.paddingLeft) +
      parseInt(style.paddingRight);

    var h = parseInt(style.height) + parseInt(style.paddingTop) +
      parseInt(style.paddingBottom);

    return [w, h];
  },

  findBox: function(node) {
    var position = this.findPosition(node);
    var size = this.findSize(node);
    return {
      x: position[0],
      y: position[1],
      w: size[0],
      h: size[1]
    };
  }

};

return ST;

});