
const form = document.getElementById("couponForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  document.querySelectorAll(".text-danger").forEach(el => el.innerText = "");

  const data = Object.fromEntries(new FormData(form).entries());

  const res = await fetch("/admin/coupons/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  const result = await res.json();

  if (!result.success) {
    for (const field in result.errors) {
      document.getElementById(`error-${field}`).innerText = result.errors[field];
    }
    return;
  }

  location.reload();
});

async function toggleCoupon(id) {
  const res = await fetch(`/admin/coupons/toggle/${id}`, { method: "PATCH" });
  const data = await res.json();

  if (!data.success) return;

  const badge = document.getElementById(`status-${id}`);
  badge.innerText = data.isActive ? "Active" : "Disabled";
  badge.className = "badge " + (data.isActive ? "bg-success" : "bg-secondary");
}

async function deleteCoupon(id) {
  Swal.fire({
    title: 'Are you sure?',
    text: "This action cannot be undone.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, delete it!'
  }).then(async (result) => {
    if (result.isConfirmed) {
      await performDelete(id);
      Swal.fire(
        'Deleted!',
        'The coupon has been deleted.',
        'success'
      )
    }
  })

  async function performDelete(id) {


  const res = await fetch(`/admin/coupons/delete/${id}`, { method: "DELETE" });
  const data = await res.json();

  if (data.success) {
    document.getElementById(`row-${id}`).remove();
  }

  }
}


