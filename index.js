const constants = require("./lib/constants.js");
const maps = require("./lib/maps.js");

// module.exports.otherOrderTypesMap = constants.otherOrderTypesMap;
// module.exports = {
//   orderTypeNamesMap: constants.orderTypeNamesMap,
// };

module.exports = {
  ...constants,
  ...maps,
};
