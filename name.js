"use strict";
console.log("Hello, TypeScript!");


function greet(name) {
    if (name) {
        console.log(`Hello, ${name}!`);
    } else {
        console.log("Hello, World!");
    }
}

greet();