let flags:boolean = true;
if(flags){
    console.log("pass")
}else{
    console.log("fail")
}

let x:number=10,y:number=20
if(x>y){
    console.log("x greater than y")
}
else{
    console.log("y greater than x")
}

// < > <= >= === !=

let a:number=100
let b:number=200
let c:number=300

if(a>b && a>c){
    console.log("a greatest")
}
else if(b>c){
     console.log("b greatest")
}
else
     console.log("c greatest")


// ternary

let i:number=10
let j:number=20
i>j ? console.log("i is greater than j" ): console.log("j is greater")

let browser: string ="chrome";

(browser === "chrome")? console.log("launch cheome"):(browser === "firefox")?console.log("launch firefox"): console.log("please enter correct browser");

