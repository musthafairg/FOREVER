const sizeButtons = document.querySelectorAll(".size-btn");
const selectedSizeInput = document.getElementById("selectedSize");
const priceEl = document.getElementById("dynamicPrice");
const oldPriceEl = document.getElementById("dynamicOldPrice");
const discountEl = document.getElementById("dynamicDiscount");
const qtyEl = document.getElementById("quantity");

let selectedVariantStock = 0;

sizeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    sizeButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    const selectedSize = button.dataset.size;
    selectedSizeInput.value = selectedSize;

    const variant = variants.find((v) => v.size === selectedSize);
    if (!variant) return;

    priceEl.innerText = `₹ ${variant.finalPrice ?? variant.price}`;

    if (variant.discountPercent > 0) {
      oldPriceEl.innerText = `₹ ${variant.originalPrice}`;
      oldPriceEl.style.display = "inline";
      discountEl.innerText = `${variant.discountPercent}% OFF`;
    } else {
      oldPriceEl.style.display = "none";
      discountEl.innerText = "";
    }

    selectedVariantStock = variant.quantity;

    qtyEl.innerText = 1;
  });
});

document.querySelector(".qty-up")?.addEventListener("click", (e) => {
  e.preventDefault();

  if (sizeButtons.length > 0 && !selectedSizeInput.value) {
    return Swal.fire({
      icon: "warning",
      title: "Select a size first",
      timer: 1200,
      showConfirmButton: false,
    });
  }

  let qty = parseInt(qtyEl.innerText);

  const MAX_LIMIT = 5;
  const MAX_ALLOWED = Math.min(selectedVariantStock, MAX_LIMIT);

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

function changeMainImage(src) {
  document.getElementById("mainImage").src = src;
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
    body: JSON.stringify({ productId }),
  });

  const data = await res.json();
  if (data.success) location.reload();
}

const addToCartBtn = document.getElementById("addToCartBtn");

if (addToCartBtn) {
  addToCartBtn.addEventListener("click", async () => {
    const productId = addToCartBtn.dataset.productId;
    const quantity = parseInt(document.getElementById("quantity").innerText);
    const selectedSize = selectedSizeInput?.value || null;

    if (sizeButtons.length > 0 && !selectedSize) {
      return Swal.fire({
        icon: "warning",
        title: "Please select a size",
        timer: 1500,
        showConfirmButton: false,
      });
    }

    try {
      addToCartBtn.disabled = true;

      const res = await fetch("/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          quantity,
          size: selectedSize,
        }),
      });

      const data = await res.json();
      addToCartBtn.disabled = false;

      if (data.success) {
        await removeWishlist(productId);
        window.location.reload();
      } else {
        Swal.fire({
          position: "top-end",
          icon: "error",
          title: data.message || "Failed to add to cart",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      addToCartBtn.disabled = false;
      console.error(err);
      Swal.fire({
        position: "top-end",
        icon: "error",
        title: "Something went wrong",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  });
}
