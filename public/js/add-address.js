
const form = document.getElementById("addressForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();


  document.querySelectorAll(".error").forEach(el => el.innerText = "");

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());


    const res = await fetch("/address/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const response = await res.json();

    if (!response.success) {
      for (const field in response.errors) {
        const errorEl = document.getElementById(`error-${field}`);
        if (errorEl) {
          errorEl.innerText = response.errors[field];
        }
      }
      return;
    }

  
    window.location.href = "/address";

  
});

