
  async function removeWishlist(productId) {
    const res = await fetch("/wishlist/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId })
    });

    const data = await res.json();
    if (data.success) location.reload();
  }

  async function addToCart(productId) {
    const res = await fetch("/cart/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: 1 })
    });

    const data = await res.json();
    if (data.success) {
        Swal.fire({
      position: 'top-end',  
      icon: 'success',
      title: 'Product added to cart',
      showConfirmButton: false,
      timer: 1500
          
    });

      
  await removeWishlist(productId);
  setTimeout(() => {  
    location.reload();
  }, 1600);
  
    } else {

      Swal.fire({
        position: 'top-end',
        icon: 'error',
        title: 'Failed to add product to cart',
        showConfirmButton: false,
        timer: 1500
      });
    }
  }
