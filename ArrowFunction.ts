// Arrow function

let infom =()=>{
    console.log("first arrow function")

}

infom();

class person{
    firstnamd:string;
    lastnamed:string;

    constructor(firstname:string,lastnamed:string){
        this.firstnamd=firstname;
        this.lastnamed=lastnamed;

    }
    display=()=>console.log( this.firstnamd,this.lastnamed);
    
}
let p= new person('Tom','Deshpande')
p.display()