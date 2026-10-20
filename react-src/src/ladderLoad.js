// The live ladder.js collects its four data files from window.LADDER_PARTS, so set that first.
import LA from '../../cl-src/js/ladder-a.js'; import LB from '../../cl-src/js/ladder-b.js'; import LC from '../../cl-src/js/ladder-c.js'; import LDD from '../../cl-src/js/ladder-d.js';
window.LADDER_PARTS = [LA, LB, LC, LDD];
const LADDER = require('../../cl-src/js/ladder.js');
export default LADDER;
