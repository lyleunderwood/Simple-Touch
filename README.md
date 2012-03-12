Simple Touch
============

Simple Touch is a basic Javascript drag and drop AMD library specifically for
touch environments. It has mostly been tested in mobile Safari on iOS. It does
not support mouse events at all (but uses Touché in the demo to function in a 
desktop browser).

Simple Touch has been designed specifically to fit my particular needs for one
project. I wrote it over a weekend because I was unsatisfied with drag and drop
options for touch environments and I wanted more of a tailored solution. The
result is fairly hacky, and probably really brittle, but should fit my needs.
If I end up using it a bit I'll likely make the API simpler and more consistent
and try to handle more use cases. I'm not sure I could recommend using this
code in its current state.

Usage
-----

Simple Touch is an AMD module:

https://github.com/amdjs/amdjs-api/wiki/AMD

I mostly work with RequireJS for my AMD needs:

http://requirejs.org/

````javascript
require("simple-touch/source", function(Source) {
  var dragSource = new Source(document.getElementById('source'));
});
````

API
---

There are three main classes in the external api. Source, Target, and Mover.
Mover only has functionality for being dragged around the screen. In most 
cases you'll want to work with Source and Target.

All three classes take a DOM node as the first argument in their constructor
and an optional options object as the second. The set of options for each
class is described below.

### Source

````javascript
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
````

### Target

````javascript
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
````

### Mover

````javascript
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
````

TODO
----

- Clean up interpendencies and API inconsistency
- Simplify overly verbose and dumb option names
- Multiple listeners per callback :)
- Better options system so options can be changed on the fly without doing
  <tt>source.options.dragTargetClass = 'whatever';</tt> and crossing your
  fingers.
- Figure out if testing for a library this interraction-oriented is feasible.
- At least do some smoke testing.
- Port AMD module to a simple object version, concatenated and minified for
  people not cool enough to use AMD.
- Plenty of optimization.