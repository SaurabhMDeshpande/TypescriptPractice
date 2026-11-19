"use strict";
// Enum: Enumeration is data type which hold set of  constants 
//numeric
// string
// heterogeneous
// enum is not supported in JS it is the feature of TS
var Browser;
(function (Browser) {
    // if we are intializingvalues we have to write it in end
    Browser[Browser["Fireforx"] = 5] = "Fireforx";
    Browser[Browser["Safari"] = 6] = "Safari";
    Browser[Browser["Edge"] = 7] = "Edge";
    Browser[Browser["Chrome"] = getVersion('chrome')] = "Chrome";
})(Browser || (Browser = {}));
console.log(Browser.Chrome);
console.log(Browser);
console.log(Browser.Safari);
console.log(Browser.Fireforx);
console.log(Browser.Safari);
console.log(Browser.Edge);
function getVersion(browserName) {
    if (browserName === "chrome") {
        return 115;
    }
    return -1;
}
