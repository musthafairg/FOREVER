


          const qtyEl = document.getElementById("quantity");
          const maxStock = <%= product.quantity %>;
          const MAX_LIMIT = 5;
          const MAX_ALLOWED = Math.min(maxStock, MAX_LIMIT);

          document.querySelector(".qty-up")?.addEventListener("click", (e) => {
            e.preventDefault();
            let qty = parseInt(qtyEl.innerText);
            if (qty < MAX_ALLOWED) {
              qtyEl.innerText = qty + 1;
            }
          });

          document.querySelector(".qty-down")?.addEventListener("click", (e) => {
            e.preventDefault();
            let qty = parseInt(qtyEl.innerText);
            if (qty > 1) {
              qtyEl.innerText = qty - 1;
            }
          });

                  function changeMainImage(src){
                    document.getElementById("mainImage").src=src
                  }



              const zoomContainer = document.getElementById("zoomContainer");
              const zoomImage = document.getElementById("mainImage");
              const zoomResult = document.getElementById("zoomResult");

              zoomContainer.addEventListener("mouseenter", () => {
                  zoomResult.style.display = "block";
                  zoomResult.style.backgroundImage = `url(${zoomImage.src})`;
              });

              zoomContainer.addEventListener("mousemove", (e) => {
                  const rect = zoomContainer.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;

                  zoomResult.style.backgroundPosition = `${x}% ${y}%`;
              });

              zoomContainer.addEventListener("mouseleave", () => {
                  zoomResult.style.display = "none";
              });

const wishlistBtn = document.getElementById("wishlistBtn");

  if (wishlistBtn) {
    wishlistBtn.addEventListener("click", async () => {
      const productId = wishlistBtn.dataset.productId;

      try {
        const res = await fetch("/wishlist/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });

        const data = await res.json();

        if (data.success) {
          Swal.fire({
            position: "top-end",
            icon: "success",
            title: "Added to Wishlist",
            showConfirmButton: false,
            timer: 1500,
          });
        } else {
          Swal.fire({
            position: "top-end",
            icon: "info",
            title: data.message || "Already in wishlist",
            showConfirmButton: false,
            timer: 1500,
          });
        }
      } catch (error) {
        console.error(error);
        Swal.fire({
          position: "top-end",
          icon: "error",
          title: "Please login to add wishlist",
          showConfirmButton: false,
          timer: 1500,
        });
      }
    });
  }


              async function removeWishlist(productId) {
        const res = await fetch("/wishlist/remove", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId })
        });

        const data = await res.json();
        if (data.success) location.reload();
      }


                const addToCartBtn = document.getElementById("addToCartBtn");

                if (addToCartBtn) {
                  addToCartBtn.addEventListener("click", async () => {
                    const productId = addToCartBtn.dataset.productId;
                    const quantity = parseInt(document.getElementById("quantity").innerText);

                    try {
                      addToCartBtn.disabled=true;

                      const res = await fetch("/cart/add", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ productId, quantity })
                      });

                      addToCartBtn.disabled= false;

                      const data = await res.json();

                      if (data.success) {

                           await removeWishlist(productId);
                             window.location.reload();

                             } else {
                        Swal.fire({
                          position: "top-end",
                          icon: "error",
                          title: data.message || "Failed to add to cart",
                          showConfirmButton: false,
                          timer: 1500
                        });

                             }


                    } catch (err) {
                      console.error(err);
                      Swal.fire({
                        position: "top-end",
                        icon: "error",
                        title: "An error occurred. Please try again.",
                        showConfirmButton: false,
                        timer: 1500
                      });
                    }
                  });
                }
   