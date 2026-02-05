
    //Form Validation

  async function validateAndSubmit(){
    if(!validateForm())return

    const form = document.getElementById("productForm")
    const formData = new FormData(form)

    try {
        

const productId = new URLSearchParams(window.location.search).get("id");





        const response= await fetch(`/admin/edit-product?id=${productId}`,{
            method:"POST",
            body:formData,
            credentials:"include"
        })

        const result = await response.json()

        if(result.success){
            
            window.location.href=result.redirect
        }else{
            Swal.fire({
                position: 'top-end',
                icon: 'error',
                title: 'Error',
                text: result.message || 'Update failed',
                showConfirmButton: false,
                timer: 1500
              })
        }
    } catch (error) {
        console.error("Edit product error:",error.message);
        Swal.fire({
            position: 'top-end',
            icon: 'error',
            title: 'Error',
            text: 'An error occurred while updating the product.',
            showConfirmButton: false,
            timer: 1500
          })
        
    }
  }


    function validateForm(){
        let imageDatas  =   false
        clearErrorMessages()

        const name= document.getElementsByName('productName')[0].value
        const description= document.getElementsByName('descriptionData')[0].value
        const price= document.getElementsByName('regularPrice')[0].value
        
        const category= document.getElementsByName('category')[0].value
        const quantity= document.getElementsByName('quantity')[0].value
        imageDatas= document.getElementById("imageDatas")?.value

        const ExistingImages= document.getElementById("ExistingImages").value

        let isValid= true

        if(name.trim()===""){
            displayErrorMessage('productName-error','Please enter a productname.')
            isValid=false
        }

        if(description.trim()===""){
            displayErrorMessage('description-error','Please enter a product description.')
            isValid=false
        }

        if(!category||category.trim()===""){
            displayErrorMessage('category-error','Please Select a category.')
            isValid=false
        }

        
        const quantityVal= parseInt(quantity)
        if(isNaN(quantityVal)||quantityVal<=0){
            displayErrorMessage('quantity-error','Please a valid non-negative integer quantity.')
            isValid=false
        }

         if (!/^\d+(\.\d{1,2})?$/.test(price) || parseFloat(price) < 0) {
            displayErrorMessage('regularPrice-error', 'Please enter a valid non-negative price (e.g., 10 or 10.50).')
            isValid = false
        }

        
        const regularPriceVal = parseFloat(price);
       

        let imagesSelected = false;
        const ExistImg= Number(ExistingImages)
        for (let i = 1; i <= 4; i++) {
            const input = document.getElementById(`input${i}`)
            if (input && input.files && input.files.length > 0) {
                imagesSelected = true;
                break
            }
        }
        if (ExistImg===0 && !imagesSelected) {
            displayErrorMessage("images-error", 'Please select at least one image.')
            isValid = false
        }
        
        return isValid;



    }


    function displayErrorMessage(elementId,message){
        var errorElement= document.getElementById(elementId)
        if(!errorElement)return
        errorElement.innerText=message
        errorElement.style.display= "block"
    }

    function clearErrorMessages(){
        const errorElements= document.getElementsByClassName('error-message')
        Array.from(errorElements).forEach(element=>{
            element.innerText=""
            element.style.display="none"
        })
    }



    //Crop Image

    const cropStates= {}

    for (let i = 1; i <= 4; i++) {
        cropStates[i] = {
            container: document.getElementById(`container${i}`),
            mainImage: document.getElementById(`mainImage${i}`),
            cropArea: document.getElementById(`crop-area${i}`),
            cropBtn: document.getElementById(`cropBtn${i}`),
            preview: document.getElementById(`preview${i}`),
            input: document.getElementById(`input${i}`)
        };
        initDragHandlers(i);
        initCropButton(i);
    }


    function onFileChange(event, index) {
        const state = cropStates[index];
        const input = state.input;
        const container = state.container;
        const mainImage = state.mainImage;
        const cropArea = state.cropArea;
        const cropBtn = state.cropBtn;
        const preview = state.preview;

        preview.innerHTML = "";

         if (input.files && input.files[0]) {
            const file = input.files[0];
            const reader = new FileReader();

            reader.onload = function(ev) {
                mainImage.src = ev.target.result;
                container.style.display = 'block';
                cropBtn.style.display = 'inline-block';

                 mainImage.onload = function() {
                    
                    cropArea.style.left = "50px";
                    cropArea.style.top = "50px";
                    cropArea.style.width = "150px";
                    cropArea.style.height = "150px";
                };
            };

            reader.readAsDataURL(file);
        } else {
            container.style.display = 'none';
            cropBtn.style.display = 'none';
            mainImage.src = "";
            preview.innerHTML = "";
        }
    }


    function initDragHandlers(index) {
        const state = cropStates[index];
        const cropArea = state.cropArea;
        const container = state.container;

        if (!cropArea || !container) return;

        cropArea.onmousedown = function(e) {
            if (e.target !== cropArea) return;

            const rect = cropArea.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            const shiftX = e.clientX - rect.left;
            const shiftY = e.clientY - rect.top;

            function moveAt(ev) {
                let newLeft = ev.clientX - shiftX - containerRect.left;
                let newTop = ev.clientY - shiftY - containerRect.top;

                if (newLeft < 0) newLeft = 0;
                if (newTop < 0) newTop = 0;
                if (newLeft + cropArea.offsetWidth > container.offsetWidth) {
                    newLeft = container.offsetWidth - cropArea.offsetWidth;
                }
                if (newTop + cropArea.offsetHeight > container.offsetHeight) {
                    newTop = container.offsetHeight - cropArea.offsetHeight;
                }

                cropArea.style.left = newLeft + "px";
                cropArea.style.top = newTop + "px";
            }

            function stop() {
                document.removeEventListener("mousemove", moveAt);
                document.removeEventListener("mouseup", stop);
            }

            document.addEventListener("mousemove", moveAt);
            document.addEventListener("mouseup", stop);
        };
    }

    function initCropButton(index) {
        const state = cropStates[index];
        const cropBtn = state.cropBtn;

        if (!cropBtn) return;

        cropBtn.onclick = function() {
            const mainImage = state.mainImage;
            const cropArea = state.cropArea;
            const preview = state.preview;
            const input = state.input;

            if (!mainImage.src) return;

            const cropRect = cropArea.getBoundingClientRect();
            const imgRect = mainImage.getBoundingClientRect();

            const left = cropRect.left - imgRect.left;
            const top = cropRect.top - imgRect.top;
            const width = cropRect.width;
            const height = cropRect.height;

            if (width <= 0 || height <= 0) return;

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");

            ctx.drawImage(mainImage, left, top, width, height, 0, 0, width, height);

            const dataUrl = canvas.toDataURL("image/png");

             preview.innerHTML = `
                <h6>Cropped Image ${index}</h6>
                <img src="${dataUrl}" class="img-preview" />
            `;

            canvas.toBlob(function(blob) {
                if (!blob) return;
                const fileName = `cropped-img-${Date.now()}-${index}.png`;
                const croppedFile = new File([blob], fileName, { type: "image/png" });

                const dt = new DataTransfer();
                dt.items.add(croppedFile);
                input.files = dt.files;
            }, "image/png", 1.0);
        };
    }


    async function deleteProductImage (imageName,productId){

        try {
            
            const res= await fetch("/admin/delete-image",{
                method:"POST",
                credentials:"include",
                headers:{"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"
            },
            body:new URLSearchParams({
                imageNameToServer:imageName,
                productIdToServer:productId,
            })
            })

            const data= await res.json()

            console.log("Delete Image Response :",data);

            if(data.status===true){
                window.location.reload()
            }else{
                Swal.fire({
                    position: 'top-end',
                    icon: 'error',
                    title: 'Error',
                    text: data.message || 'Error deleting image',
                    showConfirmButton: false,
                    timer: 1500
                  })

            }
            


        } catch (error) {
            
            console.error("Error in calling delete image");
            
            Swal.fire({
                position: 'top-end',
                icon: 'error',
                title: 'Error',
                text: 'An error occurred while deleting the image.',
                showConfirmButton: false,
                timer: 1500
              })    
        }
    }



