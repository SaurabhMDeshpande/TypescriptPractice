// named function

function getInfo():void{


console.log("hello")
}


function add(a:number,b:number){
    console.log(a+b)
}
add(10,20)

function calNumbers(a:number,b:number,c:number){
    let total:number=a+b+c;

}
let result=calNumbers(10,20,30)
console.log(result);


function isUserActive(userName:string): boolean{
    if(userName==='Tom'){
        return true
    }
    else
        return false
}

isUserActive('Saurabh')


//2. anonomous function

const test =function(){
console.log("hello ts")
}
    

let sum =function(x:number,y:number):number{
    return x+y
}
let res:number = sum(5,6)
console.log(res);