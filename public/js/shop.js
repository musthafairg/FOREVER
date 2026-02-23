let selectedProductId = null;
let selectedVariant = null;

function handleAddToCart(productId, sizes) {
  if (sizes && sizes.length > 0) {
    selectedProductId = productId;
    openSizeModal(sizes);
  } else {
    addToCart(productId, null);
  }
}

function openSizeModal(variants) {
  const modal = document.getElementById("sizeModal");
  const container = document.getElementById("sizeOptions");

  container.innerHTML = "";
  selectedVariant = null;

  document.getElementById("variantDetails").style.display = "none";
  document.getElementById("selectedPrice").innerHTML = "";
  document.getElementById("selectedStock").innerText = "";

  if (!variants || variants.length === 0) {
    return Swal.fire({
      icon: "error",
      title: "No sizes available",
      timer: 1500,
      showConfirmButton: false,
    });
  }

  variants.forEach((variant) => {
    const btn = document.createElement("button");
    btn.innerText = variant.size;
    btn.className = "size-option-btn";

    if (variant.quantity <= 0) {
      btn.disabled = true;
      btn.classList.add("out-of-stock");
    }

    btn.addEventListener("click", () => {

      
      document
        .querySelectorAll(".size-option-btn")
        .forEach((b) => b.classList.remove("active"));

      btn.classList.add("active");

      selectedVariant = variant;

      const details = document.getElementById("variantDetails");
      details.style.display = "block";

      if (variant.discountPercent > 0) {
        document.getElementById("selectedPrice").innerHTML = `
          <span style="text-decoration: line-through; color: gray;">
            ₹${variant.originalPrice}
          </span>
          <span style="color: red; font-weight: bold; margin-left: 8px;">
            ₹${variant.finalPrice}
          </span>
          <span style="color: green; margin-left: 6px;">
            (${variant.discountPercent}% OFF)
          </span>
        `;
      } else {
        document.getElementById("selectedPrice").innerHTML =
          `₹${variant.originalPrice}`;
      }

      document.getElementById("selectedStock").innerText =
        variant.quantity > 0
          ? `${variant.quantity} available`
          : "Out of stock";
    });

    container.appendChild(btn);
  });

  modal.style.display = "flex";
}


function confirmSize() {
  if (!selectedVariant) {
    return Swal.fire({
      icon: "warning",
      title: "Please select a size",
      timer: 1500,
      showConfirmButton: false,
    });
  }

  const modal = document.getElementById("sizeModal");
  modal.style.display = "none";

  addToCart(selectedProductId, selectedVariant.size);
}


async function toggleWishlist(productId, iconElement) {
  try {
    const res = await fetch("/wishlist/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });

    const data = await res.json();

    if (data.success) {

    
      iconElement.classList.toggle("fas");
      iconElement.classList.toggle("far");
      iconElement.classList.toggle("wishlist-active");

    }
  } catch (err) {
    console.error(err);
  }
}

async function removeWishlist(productId) {
  const res = await fetch("/wishlist/remove", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId }),
  });

  const data = await res.json();
  setTimeout(() => {
    if (data.success) location.reload();
  }, 1500);
}



async function addToCart(productId, size = null) {
  try {
    const res = await fetch("/cart/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        quantity: 1,
        size,
      }),
    });

 

    const data = await res.json();

    

    if (data.success) {
      Swal.fire({
        position: "top-end",
        icon: "success",
        title: "Added to Cart",
        showConfirmButton: false,
        timer: 1500,
      });

      await removeWishlist(productId);

   

    } else {
      Swal.fire({
        position: "top-end",
        icon: "error",
        title: data.message || "Failed to add",
        showConfirmButton: false,
        timer: 1500,
      });
      location.href = data.redirect||"/login";
    }
  } catch (err) {
    console.error(err);
    Swal.fire({
      position: "top-end",
      icon: "error",
      title: "Something went wrong",
      showConfirmButton: false,
      timer: 1500,
    });

     
  }
}

window.addEventListener("click", function (e) {
  const modal = document.getElementById("sizeModal");
  if (e.target === modal) {
    modal.style.display = "none";
  }
});
