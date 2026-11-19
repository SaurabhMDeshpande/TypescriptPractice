"use strict";
let names = ["tom", "jerry", "mickey"];
console.log(names);
console.log(names[0]);
let empNames = ["tom", "jerry", "mickey"];
let empID = [1, 2, 3, 4, 1];
let empInfo = [1, "2", true, null, 1];
//multitypearray
let values = ["Tom", 100, "Saurabh", 200];
let val = ["tom", true];
// declaration
let users;
users = ["tom", "jerry", "mickey"];
// iteration index based
for (let i = 0; i < users.length; i++) {
    console.log(users[i]);
}
for (let e of users) {
    console.log(e);
}
for (let e in users) {
    console.log(users[e]);
}
