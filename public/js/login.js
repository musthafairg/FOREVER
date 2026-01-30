
  
         const pass = document.getElementById("password");
    

    document.getElementById("togglePass").onclick = () => {
        pass.type = pass.type === "password" ? "text" : "password";
    };


    

    const loginForm= document.getElementById("loginForm")
    const errMsg= document.getElementById("errMsg")

    loginForm.addEventListener("submit",async(e)=>{
        e.preventDefault()

        const formData= new FormData(e.target)
        const data= Object.fromEntries(formData.entries())

        const res = await fetch("/login",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify(data),
            credentials:"include"
        })

        const result= await res.json()

        if(!result.success){
            errMsg.style.display="block"
            errMsg.innerText=result.message
        }else{
            window.location.href="/"
        }
    })



     