import express from 'express'
import 'dotenv/config'
import session from 'express-session'
import nocache from 'nocache'
import connectDB from './config/mongodb.js'
import path from 'path'
import passport from './config/passport.js'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import userRouter from './routes/user.js'
import adminRouter from './routes/admin.js'
import {notFound,errorHandler} from './middleware/errorMiddleware.js'
import { no } from 'zod/locales'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const app = express()
const port =process.env.PORT||5000
connectDB()


app.use(nocache())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000*60*60*24 ,
      httpOnly: true,
      secure: false,
    },
}))


app.set('views',path.join(__dirname,'views'))
app.set('view engine','ejs')

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({extended:true}))
app.use(express.json())


app.use(passport.initialize())
app.use(passport.session())

app.use('/',userRouter)
app.use('/admin',adminRouter)

app.use(notFound)

app.use((req, res, next) => {
  res.locals.formErrors = req.session.formErrors || {};
  res.locals.formData = req.session.formData || {};

  req.session.formErrors = null;
  req.session.formData = null;

  next();
});


app.listen(port,()=>{
    console.log(`Server started on port ${port}`);
    
})

app.use(errorHandler)