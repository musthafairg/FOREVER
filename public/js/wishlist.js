let selectedProductId = null;
let selectedVariant = null;

/* ===============================
   REMOVE FROM WISHLIST
================================ */
async function removeWishlist(productId) {
  try {
    const res = await fetch("/wishlist/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId })
    });

    const data = await res.json();
    if (data.success) location.reload();

  } catch (err) {
    console.error(err);
  }
}

/* ===============================
   HANDLE ADD TO CART
================================ */
function handleAddToCart(productId, variants) {

  if (variants && variants.length > 0) {
    selectedProductId = productId;
    openSizeModal(variants);
  } else {
    addToCart(productId, null);
  }
}

/* ===============================
   OPEN SIZE MODAL
================================ */
function openSizeModal(variants) {

  const modal = document.getElementById("sizeModal");
  const container = document.getElementById("sizeOptions");

  container.innerHTML = "";
  selectedVariant = null;

  const availableVariants = variants.filter(v => v.quantity > 0);

  if (availableVariants.length === 0) {
    return Swal.fire({
      icon: "error",
      title: "All sizes out of stock",
      showConfirmButton: false,
      timer: 1500
    });
  }

  availableVariants.forEach(variant => {

    const btn = document.createElement("button");
    btn.innerText = variant.size;
    btn.className = "size-option-btn";

    btn.addEventListener("click", () => {

      document.querySelectorAll(".size-option-btn")
        .forEach(b => b.classList.remove("active"));

      btn.classList.add("active");
      selectedVariant = variant;

      showVariantDetails(variant);
    });

    container.appendChild(btn);
  });

  modal.style.display = "flex";
}

/* ===============================
   SHOW VARIANT DETAILS
================================ */
function showVariantDetails(variant) {

  const detailsDiv = document.getElementById("variantDetails");
  const priceEl = document.getElementById("selectedPrice");
  const stockEl = document.getElementById("selectedStock");

  if (!detailsDiv || !priceEl || !stockEl) return;

  detailsDiv.style.display = "block";

  if (variant.discountPercent > 0) {

    priceEl.innerHTML = `
      <span style="text-decoration: line-through; color: gray;">
        ₹${variant.originalPrice.toLocaleString('en-IN')}
      </span>
      <span style="color: red; font-weight: bold; margin-left: 8px;">
        ₹${variant.finalPrice.toLocaleString('en-IN')}
      </span>
      <span style="color: green; margin-left: 6px;">
        (${variant.discountPercent}% OFF)
      </span>
    `;

  } else {

    priceEl.innerHTML =
      `₹${variant.originalPrice.toLocaleString('en-IN')}`;
  }

  stockEl.innerText =
    variant.quantity > 0
      ? `${variant.quantity} available`
      : "Out of stock";
}

/* ===============================
   CONFIRM SIZE
================================ */
function confirmSize() {

  if (!selectedVariant) {
    return Swal.fire({
      icon: "warning",
      title: "Please select a size",
      showConfirmButton: false,
      timer: 1500
    });
  }

  document.getElementById("sizeModal").style.display = "none";

  addToCart(selectedProductId, selectedVariant.size);
}

/* ===============================
   ADD TO CART
================================ */
async function addToCart(productId, size = null) {

  try {
    const res = await fetch("/cart/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        quantity: 1,
        size
      })
    });

    const data = await res.json();

    if (data.success) {

      Swal.fire({
        position: "top-end",
        icon: "success",
        title: "Added to Cart",
        showConfirmButton: false,
        timer: 1500
      });

      await removeWishlist(productId);

    } else {

      Swal.fire({
        position: "top-end",
        icon: "error",
        title: data.message || "Failed to add",
        showConfirmButton: false,
        timer: 1500
      });
    }

  } catch (err) {
    console.error(err);
    Swal.fire({
      position: "top-end",
      icon: "error",
      title: "Something went wrong",
      showConfirmButton: false,
      timer: 1500
    });
  }
}

/* ===============================
   CLOSE MODAL ON OUTSIDE CLICK
================================ */
window.addEventListener("click", function(e) {
  const modal = document.getElementById("sizeModal");
  if (e.target === modal) {
    modal.style.display = "none";
  }
});
