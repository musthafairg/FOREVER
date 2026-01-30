

  const form = document.getElementById("productOfferForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    document.getElementById("error-productId").innerText = "";
    document.getElementById("error-discount").innerText = "";

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    const res = await fetch("/admin/offers/product/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!data.success) {
      if (data.errors) {
        for (const field in data.errors) {
          const el = document.getElementById(`error-${field}`);
          if (el) el.innerText = data.errors[field];
        }
      }
      return;
    }

    location.reload();
  });

  async function toggleProductOffer(id) {
    const res = await fetch(`/admin/offers/product/toggle/${id}`, {
      method: "PATCH",
    });

    const data = await res.json();
    if (!data.success) return;

    const badge = document.getElementById(`status-${id}`);
    badge.innerText = data.isActive ? "Active" : "Disabled";
    badge.className =
      "badge " + (data.isActive ? "bg-success" : "bg-secondary");
  }

