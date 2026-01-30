

    function confirmAction(url,message){
        Swal.fire({
            title:message,
            text:"Are you sure?",
            icon:"warning",
            showCancelButton:true,
            confirmButtonColor:"#d33",
            cancelButtonColor:"#3085d6",
            confirmButtonText:"Yes, proceed"
        }).then((result)=>{
            if(result.isConfirmed){
                window.location.href=url;
            }
        })
    }
