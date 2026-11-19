//TSC
// I know what type is better than you 

let Bill:any=123;
let final=<number>Bill +12;
console.log(final)

let somevalue: any="Hello"
let len =(somevalue as string).length;
console.log(len)

let flag:any= true;
if(flag as boolean){
    console.log("checked")
}