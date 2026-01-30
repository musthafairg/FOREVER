


    const pass = document.getElementById("password");
    const confirm = document.getElementById("confirmPassword");

    document.getElementById("togglePass").onclick = () => {
        pass.type = pass.type === "password" ? "text" : "password";
    };

    document.getElementById("toggleConfirm").onclick = () => {
        confirm.type = confirm.type === "password" ? "text" : "password";
    };

         const nameid=document.getElementById("name")
         const emailid=document.getElementById("email")
         const mobileid=document.getElementById("mobile")
         const passid=document.getElementById("password")
         const confirmid = document.getElementById("confirmPassword")
         const referalid=document.getElementById("referalCode") 

         const error1=document.getElementById("error1")
         const error2=document.getElementById("error2")
         const error3=document.getElementById("error3")
         const error4=document.getElementById("error4")
         const error5=document.getElementById("error5")
         const error6=document.getElementById("error6")

         const signupForm=document.getElementById("signup-form")



         function showError(err,msg){
            err.style.display= "block",
            err.innerHTML= msg
         }

         function clearError(err){
            err.style.display= "none",
            err.innerHTML= ""
         }


        function nameValidateChecking(e){

            const nameval=nameid.value
            const namepattern=/^[A-Za-z\s]+$/
            if(nameval.trim()===""){
       
                showError(error1,"please enter a valid name")
            }else if(!namepattern.test(nameval)){
               showError(error1,"Name can only contain aiphabets and spaces")
            }else{
                clearError(error1)
            }
        }

        function emailValidateChecking(e){

            const emailval=emailid.value;
            const emailPattern= /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

            if(!emailPattern.test(emailval)){
              showError(error2,"Invalid email Format")
            }else{
                clearError(error2)
            }
        }

        function mobileValidateChecking(e){
            const mobileval=mobileid.value.trim()
            const digitPattern= /^\d{10}$/

            if(!digitPattern.test(mobileval)){
               showError(error3,"Enter 10 digit mobile number")
            }else{
               clearError(error3)
            }
        }


        function passwordValidateChecking(e){
            const passval=passid.value;
            const alpha=/[a-zA-Z]/;
            const digit=/\d/;

            if(passval.length<8){
                showError(error4,"should contain atleast 8 characters")
            }else if(!alpha.test(passval)||!digit.test(passval)){
                showError(error4,"Should contain alphabets & digits")
            }else{
                clearError(error4)
            }
        }

        function confirmPasswordValidateChecking() {
            const passval = passid.value;
            const confirmval = confirmid.value;

            if (confirmval.trim() === "") {
               showError(error5,"Please confirm your password")
            } else if (confirmval !== passval) {
                showError(error5,"Passwords do not match")
            } else {
                clearError(error5)
            }
        }

        signupForm.addEventListener("submit",async(e)=>{
            e.preventDefault()

            nameValidateChecking()
            emailValidateChecking()
            mobileValidateChecking()
            passwordValidateChecking()
            confirmPasswordValidateChecking()

            if(
                error1.innerHTML||
                error2.innerHTML||
                error3.innerHTML||
                error4.innerHTML||
                error5.innerHTML||
                error6.innerHTML
            ) return


            const formData={
                name:nameid.value,
                email:emailid.value,
                mobile:mobileid.value,
                password:passid.value,
                confirmPassword:confirmid.value,
                referalCode:referalid.value
            }

            try{
                const response= await fetch("/signup",{
                    method:"POST",
                    headers:{
                        "Content-Type":"application/json"
                    },
                    body:JSON.stringify(formData),
                    credentials:"include"
                })

                let result;

                try{

                    result= await response.json()
                }catch{
                    throw new Error ("Invalid server response")
                }
                 

                if(!result.success){

                    alert(result.message)
                    
                }else{
                    
                    window.location.href= result.redirect
                }
            } catch(error){
                
        
              console.error(error.message);
                    
            }
        })


