const changeForm = document.getElementById("changeForm");
const errMsg = document.getElementById("errMsg");

changeForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const btn = document.getElementById("submitBtn");
  btn.disabled = true;

  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  const res = await fetch("/change-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });

  const result = await res.json();
  btn.disabled = false;

  if (!result.success) {
    errMsg.style.display = "block";
    errMsg.innerText = result.message;
  } else {
    window.location.href = result.redirect;
  }
});
