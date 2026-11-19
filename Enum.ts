// Enum: Enumeration is data type which hold set of  constants 
//numeric
// string
// heterogeneous

// enum is not supported in JS it is the feature of TS
enum Browser{
    // if we are intializingvalues we have to write it in end
    Fireforx=5, // default value is one
    Safari, // value is 6
    Edge=getVersion('chrome')*5, // value is 7 also we can give value explicitly
    Chrome=getVersion('chrome'), // by default 0
    


}
console.log(Browser.Chrome)
console.log(Browser)
console.log(Browser.Safari)
console.log(Browser.Fireforx)
console.log(Browser.Safari)
console.log(Browser.Edge)


function getVersion(browserName:string):number{
    if(browserName === "chrome"){
        return 115;
    }
    return -1

}

// String Enum


enum environment {
    DEV="dev",
    QA="qa",
    STAGE="stage",
    PROD="prod"
}
console.log(environment.DEV)
console.log(environment['STAGE'])

// heterogenenoud data

enum Status{
    ACTIVE='active',
    DEACTIVE =1,
    PENDING

}
console.log(Status.ACTIVE)
console.log(Status.DEACTIVE)
console.log(Status.PENDING)
