let chart;

async function loadDashboardData(filter = "monthly") {
  const res = await fetch(`/admin/dashboard/data?filter=${filter}`);
  const data = await res.json();

  /* SALES GRAPH */
  const labels = data.sales.map(s => s._id);
  const values = data.sales.map(s => s.total);

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("salesChart"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Sales",
        data: values,
        borderColor: "#7b2ff7",
        backgroundColor: "rgba(123,47,247,0.1)",
        tension: 0.4
      }]
    }
  });

  /* BEST PRODUCTS */
  document.getElementById("bestProducts").innerHTML =
    data.bestProducts.map(p =>
      `<li>${p.product.productName} – ${p.sold} sales</li>`
    ).join("");

  /* RECENT ORDERS */
  document.getElementById("recentOrders").innerHTML =
    data.recentOrders.map(o =>
      `<div style="border-bottom:1px solid #eee;padding:8px 0">
        <strong>#${o.orderId}</strong> - ${o.userId.name}<br>
        ₹${o.priceDetails.total} | ${o.paymentMethod} | ${o.orderStatus}
      </div>`
    ).join("");
}

loadDashboardData();
