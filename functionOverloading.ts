// in typecript we can do function overloading
// but parameter list should be same

// we can implement this by using below step


// provide implementtation or prototype
function add(a:string,b:string):string;
function add(a:number,b:number):number;

// need to implement this only once:
function add (a:any, b:any):any{
    return a+b
}

// print above methods