let names:string[]=["tom","jerry","mickey"];
console.log(names);
console.log(names[0]);


let empNames:Array<string>=["tom","jerry","mickey"];
let empID:Array<number>=[1,2,3,4,1];
let empInfo:Array<any>=[1,"2",true,null,1];

//multitypearray

let values:(string | number)[]=["Tom",100,"Saurabh",200];
let val : Array<String | boolean> = ["tom",true]


// declaration
let users: Array<string>;
users=["tom","jerry","mickey"]


// iteration index based

for(let i=0;i<users.length;i++){
    console.log(users[i])

}


for(let e of users){
    console.log(e)
}

// e is index in console

for(let e in users){
    console.log(users[e])
}

