const form = document.getElementById("couponForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  document
    .querySelectorAll(".text-danger")
    .forEach((el) => (el.innerText = ""));

  const data = Object.fromEntries(new FormData(form).entries());

  const res = await fetch("/admin/coupons/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!result.success) {
    for (const f in result.errors) {
      document.getElementById(`error-${f}`).innerText = result.errors[f];
    }
    return;
  }

  location.reload();
});

async function toggleCoupon(id) {
  const res = await fetch(`/admin/coupons/toggle/${id}`, { method: "PATCH" });
  const data = await res.json();

  const badge = document.getElementById(`status-${id}`);
  badge.innerText = data.isActive ? "Active" : "Disabled";
  badge.className = "badge " + (data.isActive ? "bg-success" : "bg-secondary");
}

async function deleteCoupon(id) {
  const ok = await Swal.fire({ title: "Delete?", showCancelButton: true });
  if (!ok.isConfirmed) return;

  await fetch(`/admin/coupons/delete/${id}`, { method: "DELETE" });
  document.getElementById(`row-${id}`).remove();
}

const modal = new bootstrap.Modal(document.getElementById("editCouponModal"));

async function openEditModal(id) {
  const res = await fetch(`/admin/coupons/${id}`);
  const c = await res.json();

  editCouponForm.reset();
  editCouponForm.id.value = c._id;
  editCouponForm.code.value = c.code;
  editCouponForm.discountType.value = c.discountType;
  editCouponForm.discountValue.value = c.discountValue;
  editCouponForm.minPurchase.value = c.minPurchase || "";
  editCouponForm.expiryDate.value = c.expiryDate.split("T")[0];

  modal.show();
}

editCouponForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  document
    .querySelectorAll("[id^='edit-error']")
    .forEach((el) => (el.innerText = ""));

  const data = Object.fromEntries(new FormData(editCouponForm).entries());

  const res = await fetch(`/admin/coupons/edit/${data.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!result.success) {
    for (const f in result.errors) {
      document.getElementById(`edit-error-${f}`).innerText = result.errors[f];
    }
    return;
  }

  location.reload();
});
