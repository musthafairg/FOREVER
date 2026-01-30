
  const SUBTOTAL = <%= subtotal %>;
document.getElementById("checkoutForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const payload = Object.fromEntries(formData.entries());


  const res = await fetch("/checkout/place-order", {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (payload.paymentMethod === "COD") {
    window.location.href = data.redirect;
    return;
  }
  if (payload.paymentMethod === "WALLET") {
    if(data.success){
      window.location.href = data.redirect;
      return;   
    }else{
      Swal.fire({
        icon: 'error',
        title: 'Insufficient Wallet Balance',
        text: data.message||'Your wallet balance is insufficient for this order.',
      });
    }  
    return; 
  }
    
    


  const options = {
    key: data.key,
    amount: data.amount,
    currency: "INR",
    name: "FOREVER",
    order_id: data.razorpayOrderId,
    handler: async function (response) {
      const verify = await fetch("/payment/verify",{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          ...response,
          orderId: data.dbOrderId
        })
      });

      const result = await verify.json();
      if(result.success){
        window.location.href="/order-success";
      }else{
        window.location.href="/order-failure";
      }
    },

     modal: {
    ondismiss: function () {
      window.location.href = "/order-failure";
    },
  },
  };

  new Razorpay(options).open();
});



async function applyCoupon() {
  const code = document.getElementById("couponCode").value;

  if (!code) {
    const errorEl = document.getElementById("errorCoupon");
    errorEl.innerText = "Please enter a coupon code.";
    return;
  }else {
    document.getElementById("errorCoupon").innerText = "";
  }

  const res = await fetch("/coupon/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      subtotal: SUBTOTAL    })
  });

  const data = await res.json();

  if (data.success) {
    location.reload();
  } else {
    const errorEl = document.getElementById("errorCoupon");
    errorEl.innerText = data.message || "Failed to apply coupon.";
  }
}

async function removeCoupon() {
  await fetch("/coupon/remove", { method: "POST" });
  location.reload();
}




function applyCouponFromList(code) {
  document.getElementById("couponCode").value = code;
  applyCoupon();
}




