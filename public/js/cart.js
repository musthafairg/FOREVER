async function updateQty(productId, size, action) {

  const res = await fetch("/cart/update-qty", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, size, action })
  });

  const data = await res.json();

  if (data.success) {
    location.reload();
  } else {
    Swal.fire({
      position: "top-end",
      icon: "error",
      title: data.message || "Failed to update quantity",
      showConfirmButton: false,
      timer: 1500
    });
  }
}

async function removeItem(productId, size) {

  Swal.fire({
    title: 'Are you sure?',
    text: "Once confirmed, you cannot undo this.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, remove it!'
  }).then(async (result) => {

    if (!result.isConfirmed) return;

    const res = await fetch("/cart/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, size })
    });

    const data = await res.json();

    if (data.success) {
      location.reload();
    }
  });
}
