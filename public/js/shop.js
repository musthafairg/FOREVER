


function showMessage(message, type = "success") {
  const modalTitle = document.getElementById("modalTitle");
  const modalMessage = document.getElementById("modalMessage");
  const modalIcon = document.getElementById("modalIcon");

  if (type === "success") {
    modalTitle.innerText = "Success";
    modalIcon.innerHTML = `<i class="fas fa-check-circle modal-success"></i>`;
  } else {
    modalTitle.innerText = "Error";
    modalIcon.innerHTML = `<i class="fas fa-times-circle modal-error"></i>`;
  }

  modalMessage.innerText = message;

  const modalEl = document.getElementById("messageModal");
  const modal = new bootstrap.Modal(modalEl);
  modal.show();

  setTimeout(() => {
    modal.hide();
  }, 1800);
}


  async function toggleWishlist(productId) {
    try {
      const res = await fetch("/wishlist/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId })
      });

      const data = await res.json();

      if (data.success) {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: "Wishlist Updated",
          text: "Product added to wishlist",
          showConfirmButton: false,
          timer: 1500
        });
      } else {
        Swal.fire({
          position: "top-end",
          icon: "error",
          title: "Failed",
          text: "Unable to update wishlist",
          showConfirmButton: false,
          timer: 1500
        });
      }
    } catch (err) {
          Swal.fire({
        position: "top-end",  
        icon: "error",
        title: "Error",
        text: "An error occurred",
        showConfirmButton: false,
        timer: 1500
      });
      console.error(err);


    }
  }


  
  async function removeWishlist(productId) {
    const res = await fetch("/wishlist/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId })
    });

    const data = await res.json();
  if (data.success){
 
     console.log("Removed from wishlist");
     setTimeout(() => {
      location.reload();
    
    }, 1500);

  } else {
    Swal.fire({
      position: "top-end",
      icon: "error",
      title: "Failed to Remove",
      showConfirmButton: false,
      timer: 1500 
    });
  }
}


  async function addToCart(productId) {


      const btn = event.target;
  btn.disabled = true;

    const res = await fetch("/cart/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: 1 })
    });

    const data = await res.json();
    btn.disabled = false;

    if (data.success) {
     Swal.fire({
      position: "top-end",
      icon: "success",
      title: data.message || "Added to Cart",
      showConfirmButton: false,
      timer: 1500 
    });
      
  await removeWishlist(productId);

      setTimeout(() => {
      location.reload();
    }, 2000);

    } else {
     Swal.fire({
      position: "top-end",
      icon: "error",
      title: "Failed to Add",
      text: data.message || "Please try again",
      showConfirmButton: false,
      timer: 1500 
    });
    }
  }
