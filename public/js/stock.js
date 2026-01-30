
   
      async function updateStock(id) {
        const qty = Number(document.getElementById(`input-${id}`).value)
        const errorEl = document.getElementById(`error-${id}`)
        errorEl.innerText = ''

        const res = await fetch(`/admin/stock/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity: qty })
        })

        const data = await res.json()

        if (!data.success) {
          errorEl.innerText = data.errors?.quantity || 'Update failed'
          return
        }

        document.getElementById(`qty-${id}`).innerText = data.quantity
        document.getElementById(`status-${id}`).innerText = data.status
        document.getElementById(`status-${id}`).className =
          'badge ' + (data.status === 'Available' ? 'bg-success' : 'bg-danger')
      }
    