document.addEventListener("DOMContentLoaded", function() {
    const functionalityInput = document.getElementById('functionality'); // Ensure this exists in HTML
    

    // Functionality buttons (Make sure buttons exist)
    const yesBtn = document.getElementById('yesBtn');
    const noBtn = document.getElementById('noBtn');
    
    if (yesBtn && noBtn && functionalityInput) {
        yesBtn.addEventListener('click', function() {
            setFunctionality('functional');
        });
        
        noBtn.addEventListener('click', function() {
            setFunctionality('nonfunctional');
        });
    }

});
