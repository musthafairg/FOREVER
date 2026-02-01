let chart;

async function loadDashboardData(filter = "monthly") {
  const res = await fetch(`/admin/dashboard/data?filter=${filter}`);
  const data = await res.json();

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
        borderColor: "#6f42c1",
        backgroundColor: "rgba(111,66,193,0.2)",
        fill: true
      }]
    }
  });

  document.getElementById("bestProducts").innerHTML =
    data.bestProducts.map(p =>
      `<li>
        <img src="/uploads/image/${p.product.productImage[0]}" style="width:30px; height:30px; object-fit:cover; border-radius:5px; margin-right:10px;">
        ${p.product.productName} – ${p.sold}
      </li>`
    ).join("");

  document.getElementById("bestCategories").innerHTML =
    data.bestCategories.map(c =>
      `<li>${c.category.name} – ${c.sold}</li>`
    ).join("");

  document.getElementById("recentOrders").innerHTML =
    data.recentOrders.map(o =>
      `<div>
        <strong>#${o.orderId}</strong> - ${o.userId.name}<br>
        ₹${o.priceDetails.total} | ${o.paymentMethod}
      </div>`
    ).join("");
}

loadDashboardData();
