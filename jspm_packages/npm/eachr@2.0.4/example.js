/* */ 
var each = require("./out/lib/eachr");
var arr = ["first", "second", "third"];
var obj = {
  a: "first",
  b: "second",
  c: "third"
};
var iterator = function(value, key) {
  console.log({
    value: value,
    key: key
  });
  if (value === "second") {
    console.log("break");
    return false;
  }
};
each(arr, iterator);
each(obj, iterator);
