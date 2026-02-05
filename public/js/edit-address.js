
const form = document.getElementById("editAddressForm");
const index = document.getElementById("addressIndex").value;

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  document.querySelectorAll(".error").forEach(el => el.innerText = "");

  const data = Object.fromEntries(new FormData(form).entries());

  const res = await fetch(`/address/edit/${index}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  const result = await res.json();

  if (!result.success) {
    for (const field in result.errors) {
      const el = document.getElementById(`error-${field}`);
      if (el) el.innerText = result.errors[field];
    }
    return;
  }

  window.location.href = "/address";
});

