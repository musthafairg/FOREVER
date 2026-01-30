


async function cancelOrder(orderId) {
  const result = await Swal.fire({
    title: 'Cancellation Reason',
    input: 'text',
    inputLabel: 'Please provide a reason for cancelling the order:',
    inputPlaceholder: 'Enter cancellation reason',
    showCancelButton: true,
    inputValidator: (value) => {
      if (!value) {
        return 'Cancellation reason is required';
      }
    }
  });

  if (!result.isConfirmed) return;

  const reason = result.value;

  const res = await fetch(`/orders/${orderId}/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason })
  });

  const data = await res.json();

  if (data.success) {
    Swal.fire({
      icon: 'success',
      title: 'Order cancelled successfully',
      timer: 1500,
      showConfirmButton: false
    });
    location.reload();
  } else {
    Swal.fire({
      icon: 'error',
      title: 'Unable to cancel order',
      timer: 1500,
      showConfirmButton: false
    });
  }
}



async function cancelItem(orderId, productId) {
  const result = await Swal.fire({
    title: 'Cancellation Reason',
    input: 'text',
    inputLabel: 'Please provide a reason for cancelling this item:',
    inputPlaceholder: 'Enter cancellation reason',
    showCancelButton: true,
    inputValidator: (value) => {
      if (!value) {
        return 'Cancellation reason is required';
      }
    }
  });

  if (!result.isConfirmed) return;

  const reason = result.value;

  const res = await fetch(`/orders/${orderId}/cancel-item`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, reason })
  });

  const data = await res.json();

  if (data.success) {
    Swal.fire({
      icon: 'success',
      title: 'Item cancelled successfully',
      timer: 1500,
      showConfirmButton: false
    });
    location.reload();
  } else {
    Swal.fire({
      icon: 'error',
      title: 'Unable to cancel item',
      timer: 1500,
      showConfirmButton: false
    });
  }
}

async function returnOrder(orderId) {
  const result = await Swal.fire({
    title: 'Return Reason',
    input: 'text',
    inputLabel: 'Please provide a reason for returning the order:',
    inputPlaceholder: 'Enter return reason',
    showCancelButton: true,
    inputValidator: (value) => {
      if (!value) {
        return 'Return reason is required';
      }
    }
  });

  if (!result.isConfirmed) return;

  const reason = result.value;

  const res = await fetch(`/orders/${orderId}/return`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason })
  });

  const data = await res.json();

  if (data.success) {
    Swal.fire({
      icon: 'success',
      title: 'Order return initiated',
      timer: 1500,
      showConfirmButton: false
    });
    location.reload();
  } else {
    Swal.fire({
      icon: 'error',
      title: 'Unable to return order',
      timer: 1500,
      showConfirmButton: false
    });
  }
}



async function returnOrderItem(orderId, productId) {
  const result = await Swal.fire({
    title: 'Return Reason',
    input: 'text',
    inputLabel: 'Please provide a reason for returning this item:',
    inputPlaceholder: 'Enter return reason',
    showCancelButton: true,
    inputValidator: (value) => {
      if (!value) {
        return 'Return reason is required';
      }
    }
  });

  if (!result.isConfirmed) return;

  const reason = result.value;

  const res = await fetch(`/orders/${orderId}/return-item`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, reason })
  });

  const data = await res.json();

  if (data.success) {
    Swal.fire({
      icon: 'success',
      title: 'Item return initiated',
      timer: 1500,
      showConfirmButton: false
    });
    location.reload();
  } else {
    Swal.fire({
      icon: 'error',
      title: 'Unable to return item',
      timer: 1500,
      showConfirmButton: false
    });
  }
}





