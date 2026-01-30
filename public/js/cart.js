

  async function updateQty(productId, action) {
    const res = await fetch("/cart/update-qty", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, action })
    });

    const data = await res.json();
    if (data.success) {
      document.getElementById("qty-" + productId).innerText = data.quantity;
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

  async function removeItem(productId) {

    Swal.fire({ 
      title: 'Are you sure?',
      text: "Once confirmed, you cannot undo this.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, remove it!'
    }).then((result) => {
      if (result.isConfirmed) {
        proceedRemove(productId);
      }
    });

    async function proceedRemove(productId) {

    

    const res = await fetch("/cart/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId })
    });

    const data = await res.json();
    if (data.success) location.reload();

  }

  }



