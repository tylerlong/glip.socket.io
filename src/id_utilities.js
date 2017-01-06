// Provides utilities for handling IDs
var idUtilities = function () {
}

// Define mask for accessing the object type field
idUtilities.prototype.TYPE_MASK = 0x1fff

//
// Public
//
// ID_Utilities.extract_type();
//
// purpose: Extract the type from a given ID
// arguments:
//    id: id from which to extract type
// returns: the type as an integer
//
idUtilities.prototype.extract_type = function (id) {
  return id & this.TYPE_MASK
}

//
// Public
//
// ID_Utilities.extract_pure_id();
//
// purpose: Extract the pure ID (without type) from a given ID
// arguments:
//    id: id from which to extract pure id
// WARNING: THIS IS A BIT CPU INTENSIVE!!!
// returns: the pure ID
//
idUtilities.prototype.extract_pure_id = function (id) {
  return Math.floor(id / (this.TYPE_MASK + 1))
}

module.exports = idUtilities
