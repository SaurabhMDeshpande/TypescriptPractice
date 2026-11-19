// typecript is statically typed language
// type inference
// type annotation

let fname:string; // type annotations
fname="Naveen";
fName = 40;


let n:number=30;
let name1:string="Saurabh";

let test ="teyopecript"; //string data type // type inference


// null and undefined
let n1:number;
console.log(n1); // undefined

let n2:number|null;
console.log(n2); // null

// union types
let n3:number|string;
n3=30;
n3="Naveen";    
//any type
let n4:any;
n4=30;
n4="Naveen";
n4=true;

// void type
// we can write any also
function greet(name:string):void{
    console.log(`Hello, ${name}!`);
}
greet("Naveen");

// never type

function error(message:string):never{
    throw new Error(message);
}
error("This is an error message.");

// type aliases
type User = {
    name:string;
    age:number;
    isActive:boolean;
};

let user:User={
    name:"Naveen",
    age:30,
    isActive:true
};
