// Sets the ladder parts on window first, because ladder.js picks them up from there.
import a from '../../cl-src/js/ladder-a.js'; import b from '../../cl-src/js/ladder-b.js'; import c from '../../cl-src/js/ladder-c.js'; import d from '../../cl-src/js/ladder-d.js';
window.LADDER_PARTS = [a, b, c, d];
export default window.LADDER_PARTS;
