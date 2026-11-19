let num: any="anything i can writr";

num=123;
num=true;


let lang:any[]=["naveen",100,true]
lang.push("automation")

// can return anything
function info(a:number,b:number):any{
    if(a>b){
        return "testing";
    }
    else{
        return 123;
    }
}

let n = info(12,12)
console.log(n)


// void
// only undefined is allowed to store
let number:void=undefined;
// also for fuction I cannot write return
function getInfo(mesg:string):void{
    
}

// never
// we cannot assign any value here
// return is alo not allowed
let never:never
