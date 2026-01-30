

    
    const pass = document.getElementById("password");
    const confirm = document.getElementById("confirmPassword");

    document.getElementById("togglePass").onclick = () => {
        pass.type = pass.type === "password" ? "text" : "password";
    };

    document.getElementById("toggleConfirm").onclick = () => {
        confirm.type = confirm.type === "password" ? "text" : "password";
    };


    
    const errorPass = document.getElementById("errorPass");
    const errorConfirm = document.getElementById("errorConfirm");
    const form = document.getElementById("resetForm");

    function validatePassword() {
        const val = pass.value;
        const alpha = /[a-zA-Z]/;
        const digit = /\d/;

        if (val.length < 8) {
            errorPass.style.display = "block";
            errorPass.innerHTML = "Should contain at least 8 characters";
        } else if (!alpha.test(val) || !digit.test(val)) {
            errorPass.style.display = "block";
            errorPass.innerHTML = "Should contain alphabets & digits";
        } else {
            errorPass.style.display = "none";
            errorPass.innerHTML = "";
        }
    }

    function validateConfirm() {
        if (confirm.value !== pass.value) {
            errorConfirm.style.display = "block";
            errorConfirm.innerHTML = "Passwords do not match";
        } else {
            errorConfirm.style.display = "none";
            errorConfirm.innerHTML = "";
        }
    }

    pass.addEventListener("input", validatePassword);
    confirm.addEventListener("input", validateConfirm);

    form.addEventListener("submit", (e) => {
        validatePassword();
        validateConfirm();

        if (errorPass.innerHTML || errorConfirm.innerHTML) {
            e.preventDefault();
        }
    });

