const { ReturnDocument } = require("mongodb")

const isLogin=async(req,res,next)=>{
    try {

        if(req.session.admin){
            
        }
        else{

           return res.redirect('/admin')
        }
        next()
        
    } catch (error) {

        console.log(error.message)
        
    }

}

const isLogout= async(req,res,next)=>{

        try {

            if(req.session.admin){

            return res.redirect('/admin/home')
            }
            next()

            
        } catch (error) {

            console.log(error.message)
            
        }
}

module.exports={

    isLogin,
    isLogout
}