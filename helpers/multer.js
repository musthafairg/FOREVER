import multer from "multer"
import path from"path"
import { fileURLToPath } from "url"
import fs from "fs"


const _filname  =   fileURLToPath(import.meta.url)
const _dirname  =   path.dirname(_filname)
const uploadDir =   path.join(_dirname,"../public/uploads/image")

if(!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir,{recursive:true})
}

export const storage    =   multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,uploadDir)
    },
    filename:(req,file,cb)=>{
        const ext   =   path.extname(file.originalname)
        cb(null,Date.now()+ext)
    }
})


export const uploads   =    multer({storage})