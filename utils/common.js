module.exports.includesAll = (array, contains) => {
  if(!contains) return true;
  if(!contains.every) return array.includes(contains);
  let success = array.every((val) => {
      return contains.indexOf(val) !== -1;
  });
  return success;
}
