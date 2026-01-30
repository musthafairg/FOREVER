
const editCategoryForm = document.getElementById("editCategoryForm");
const category_name = document.getElementById("category_name");
const descriptionId = document.getElementById("descriptionId");

const name_error = document.getElementById("name_error");
const description_error = document.getElementById("description_error");

function showError(err, msg) {
  err.style.display = "block";
  err.innerHTML = msg;
}

function clearError(err) {
  err.style.display = "none";
  err.innerHTML = "";
}

function toTitleCase(str) {
  return str
    .toLowerCase()
    .split(" ")
    .filter(word => word.trim() !== "")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function nameValidateChecking() {
  const nameVal = category_name.value.trim();
  const namePattern = /^[A-Za-z\s]+$/;

  if (!nameVal) {
    showError(name_error, "Please enter a category name");
    return false;
  } else if (!namePattern.test(nameVal)) {
    showError(name_error, "Name can contain only letters and spaces");
    return false;
  } else {
    clearError(name_error);
    return true;
  }
}

function descriptionValidateChecking() {
  const descriptionVal = descriptionId.value.trim();

  if (!descriptionVal) {
    showError(description_error, "Please enter a description");
    return false;
  } else {
    clearError(description_error);
    return true;
  }
}

editCategoryForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const isValid =
    nameValidateChecking() &&
    descriptionValidateChecking();

  if (!isValid) return;

  const formData = {
    name: toTitleCase(category_name.value.trim()),
    description: descriptionId.value.trim()
  };

  const response = await fetch("/admin/edit-category", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
    credentials: "include"
  });

  const result = await response.json();

  if (!result.success) {
    Swal.fire({
      position: "top-end",
      icon: "error",
      title: "Error",
      text: result.message || "An error occurred",
      showConfirmButton: false,
      timer: 1500
    });
  } else {
    window.location.href = result.redirect;
  }
});

