// Loads live data files that only set globals. Parts of the ladder are passed in first so ladder.js does not need dynamic require.
const parts = [require('../../cl-src/js/ladder-a.js'), require('../../cl-src/js/ladder-b.js'), require('../../cl-src/js/ladder-c.js'), require('../../cl-src/js/ladder-d.js')];
globalThis.LADDER_PARTS = parts;
require('../../cl-src/js/companies-data.js');
require('../../cl-src/js/interview.js');
require('../../cl-src/js/interview2.js');
module.exports = { LADDER: require('../../cl-src/js/ladder.js'), JOBS: require('../../cl-src/js/jobs.js'), get COMPANIES() { return globalThis.COMPANIES; }, get IVGUIDE() { return globalThis.IVGUIDE; }, get IVTRACK() { return globalThis.IVTRACK; } };
