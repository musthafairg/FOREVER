let time=60
let countdown;
const timerDisplay=document.getElementById("timer")
const resendBtn=document.getElementById("resendBtn")



const inputs=document.querySelectorAll(".otp-inputs input")

inputs.forEach((input,i)=>{
    input.addEventListener("input",(e)=>{
        if(e.target.value.match(/^[0-9]$/) && i< inputs.length-1) inputs[i+1].focus()
        else if(!e.target.value.match(/^[0-9]$/) && e.target.value) e.target.value='';

    });
    input.addEventListener("keydown",(e)=>{
        if(e.key==="Backspace" && !e.target.value && i > 0)
            inputs[i-1].focus();
    })
})

function startTimer(){
    clearInterval(countdown)
    resendBtn.disabled= true;
    resendBtn.classList.remove("active");

    const timerTextElement= document.querySelector(".otp-timer");
    timerTextElement.innerHTML=`Resend OTP in : <span id="timer">${time}</span> sec`;

    countdown = setInterval(()=>{
        time--;
        document.getElementById("timer").textContent= time;

        if(time<=0){
            clearInterval(countdown);
            resendBtn.disabled= false;
            resendBtn.classList.add("active");
            timerTextElement.textContent="OTP expired. Click 'Resend OTP' to get a new OTP";

        }
    }, 1000)
}

startTimer();



// OTP Validation

function validateOTPForm(){

    const otpInputs=document.querySelectorAll(".otp-inputs input");
    let fullOTP= "";
    otpInputs.forEach(input=>{
        fullOTP+= input.value;
    })

    if(fullOTP.length !==6){
        Swal.fire({
            icon:"warning",
            title:"Incomplete OTP",
            text:"Please enter the complete 6-digit OTP."

        })
        return false;
    }
    $.ajax({
        type:"POST",
        url:"/verify-otp-email",
        data:{otp:fullOTP},
        success:function(response){
            if(response.success){
                Swal.fire({
                    icon:"success",
                    title:"OTP Verified Successfully",
                    showConfirmButton:false,
                    timer:1500
                }).then(()=>{
                    window.location.href=response.redirectUrl;
                })
            }else{
                Swal.fire({
                    icon:"error",
                    title:"Verification Failed",
                    text:response.message,
                })
            }
        },
        error:function(jqXHR){
            const errorData=jqXHR.responseJSON||{};
            Swal.fire({
                icon:"error",
                title:"Server Error",
                text:errorData.message ||"Could not verify OTP. Please try again."
            })
        }
    })
    return false;
}



// Resend OTP 

function resendOtp(){

    inputs.forEach(input=>input.value= "");
    inputs[0].focus();


    time=60;
    startTimer();


    $.ajax({
        type:"POST",
        url:"/resend-otp",
        data:{},
        success:function(response){
            if(response.success){
                Swal.fire({
                    icon:"success",
                    title:"New OTP Sent Successfully",
                    text:response.message,
                    showConfirmButton:false,
                    timer:1500,
                })
            }else{
                Swal.fire({
                    icon:"error",
                    title:"Resend Failed",
                    text:response.message|| "An error occured while resending OTP. Please try again."
                })
                resendBtn.disabled= false;
            }
        },
        error:function(jqXHR){
            const errorData=jqXHR.responseJSON||{};
            Swal.fire({
                icon:"error",
                title:"Network Error",
                text:errorData.message||"Could not reach the server to resend OTP."
            })

            resendBtn.disabled= false;
        }
    })
}