const oldPassword = document.getElementById("oldPassword");
const currentPassword = document.getElementById("current-password");
const newPassword = document.getElementById("new-password");
const confirmPassword = document.getElementById("confirm-password");

const errorCurrentPassword = document.getElementById("error1");
const errorNewPassword = document.getElementById("error2");
const errorConfirmPassword = document.getElementById("error3");
const form = document.getElementById("changeForm");
const errMsg = document.getElementById("errMsg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  const res = await fetch("/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });

  const result = await res.json();

  if (!result.success) {
    errMsg.style.display = "block";
    errMsg.innerText = result.message;
  } else {
    window.location.href = "/user-profile";
  }
});

function validateNewPassword() {
  const val = newPassword.value;
  const alpha = /[a-zA-Z]/;
  const digit = /\d/;

  if (val.length < 8) {
    errorNewPassword.style.display = "block";
    errorNewPassword.innerHTML = "Should contain at least 8 characters";
  } else if (!alpha.test(val) || !digit.test(val)) {
    errorNewPassword.style.display = "block";
    errorNewPassword.innerHTML = "Should contain alphabets & digits";
  } else {
    errorNewPassword.style.display = "none";
    errorNewPassword.innerHTML = "";
  }
}

function validateConfirm() {
  if (confirmPassword.value !== newPassword.value) {
    errorConfirmPassword.style.display = "block";
    errorConfirmPassword.innerHTML = "Passwords do not match";
  } else {
    errorConfirmPassword.style.display = "none";
    errorConfirmPassword.innerHTML = "";
  }
}

newPassword.addEventListener("input", validateNewPassword);
confirmPassword.addEventListener("input", validateConfirm);

form.addEventListener("submit", (e) => {
  validateNewPassword();
  validateConfirm();

  if (
    errorCurrentPassword.innerHTML ||
    errorNewPassword ||
    errorConfirmPassword.innerHTML
  ) {
    e.preventDefault();
  }
});
