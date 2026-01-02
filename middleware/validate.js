import { ZodError } from "zod"



export const validate=(schema)=>(req,res,next)=>{
    try {

        schema.parse({
            body:req.body,
            params:req.params,
            query:req.query
        })
        next()

    } catch (error) {
        
        if(error instanceof ZodError){

              const errors={}
       
        error.issues.forEach((issue)=>{
            const field= issue.path[1]
            errors[field]=issue.message
        })


        return res.status(400).json({
            success:false,
            errors
        })

        }

        return res.status(500).json({
            success:false,
            message:"Validation failed"
        })
      

        
    }
}