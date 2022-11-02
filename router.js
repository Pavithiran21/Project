const express = require("express");
const User = require('./userModel');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");


const salt = bcrypt.genSaltSync(10);
const nodemailer = require("nodemailer");


const router = express.Router();


function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
router.get('/check-user/:id',async function(req,res){
  try {
    console.log(req.params)
    let user = await User.findOne({ _id: req.params.id, isActive: true })
    console.log(user)
    if (user) {
        res.json({ status: true, data: user, message: "" })
    }
    else {
        res.json({ status: false, message: "Invalid Link.Please try again" })
    }
} catch (ex) {
    console.log(ex)
    res.send("Something went wrong")
}
})
router.post('/activate/account',async function(req,res){
  try {
    console.log(req.body)
    console.log(Date.now())
        let users = await User.findOne({"activeToken": req.body.id,isActive:false})
        console.log(users)
        if (users) {

            users.isActive = true
            users.activation_id=""
            users.save()
            
            res.json({ status: true, message: "User Activated Successfully" })

            setTimeout(() => {
                users.activation_id
                users.save()
            }, 600000)
        }
        else {
            res.json({ status: false, message: "User Not found" })
        }
    
} 
catch(ex){
    console.log(ex)
    res.json({status:false,message:"Something went wrong"})
}
})
router.post('/forget-password',async function(req,res){
  try {
    let data = req.body
    console.log(data)
    let users = await User.findOne({ "_id": data.user_id })
    console.log(users)
    if (users) {
        users.isActive = false
        
        bcrypt.hash(req.body.password, salt, function (err, hash) {
            users.password = hash
            users.update_ts = Date.now()
            users.save()
        }
        );
        res.json({ status: true, message: "Forget Password updated Successfully" })
    }
    else {
        res.json({ status: false, message: "Invalid Link.Please try again" })
    }

} catch (ex) {
    res.json({ status: false, message: "Something went wrong" })
}
})
router.post('/register',async function(req,res){
 
  try {
    let { username, email, password } = req.body
    let user = await User.findOne({ "email": email })
    console.log(user)
    if (user == null) {
        user = new User()
        

        user.password = await bcrypt.hash(password, salt)
        user.username = username
        user.email = email
        user.update_ts = Date.now()
        const buf = await crypto.randomBytes(20); 
       
        user.activeToken=buf.toString('hex')
        console.log(buf)
      
        user.activeExpires=Date.now() + 24 * 3600 * 1000;
        
        let emailObj = {
            from: 'Urlshortner@gmail.com',
            to: user.email,
            subject: "Thanks for Registering || Activation mail",
            html: '',
            link:process.env.BASE_URL+'/activate/'+user.activeToken
        }
        sendActivationLink(emailObj)
        user.save()
        res.json({ status: true, message: "User Registered Successfully",data:user })
    }
    else {
        res.json({ status: false, message: "Already Registered" })
    }
} catch (ex) {
    console.log(ex)
    res.json({ status: false, message: "Already Registered" })
    //  res.send("Something went wrong")
}
})
router.get('/activation/:id',async function (req,res){
  try{
    if(req.params.id){
       
        let users = await User.findOne({"activeToken": req.params.id,isActive:false })
        if(users){
               res.json({status:true,data:users})
        }
        else{
            res.json({ status: false, message: "Invalid link" })
        }
    }
    else{

    }
}
catch(e){
console.log(e);

}
})
router.post('/login',async (req,res) =>{
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email,isActive:true});
    console.log(user);
    if(user){
        if((await bcrypt.compare(password, user.password))){
            const token = jwt.sign(
                { user_id: user._id, email },
                process.env.JWT_TOKEN,
                {
                  expiresIn: "2h",
                }
            );
             
            console.log(token)
            res.status(200).json({ status: true, data: user,user_token:token});
        }
        else {
            res.json({ status: false, message: "You have entered an invalid username or password" })
        }
    }
    else {
        res.json({ status: false, message: "Your Account is still inactive" })
    }

} catch (err) {
    console.log(err)
    res.json({ status: false, message: "Something went wrong Please try again later" })
}   
})
module.exports=router;