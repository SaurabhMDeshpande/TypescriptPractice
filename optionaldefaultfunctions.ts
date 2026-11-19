//optional parameters

function getInformation(firstname:string,age?:number):string{
    return firstname + " " + age;
}
console.log(getInformation("Tom"))
console.log(getInformation("Tom",12))

// default parameters
function setDetails(name:string,mesg:string="welcome"):string{
    return mesg+''+name;
}
console.log(setDetails('Saurabh'));