document.addEventListener("DOMContentLoaded", function() {
    const form = document.querySelector(".appointment-form");
    const modal = document.getElementById("terms-modal");
    const termsLink = document.getElementById("terms-link");
    const closeBtn = document.querySelector(".close-btn");
    


    form.addEventListener("submit", function(event) {
        event.preventDefault();
        alert("Appointment requested successfully!");
    });

    function setFunctionality(value) {
        // Get the buttons and hidden input field
        const yesBtn = document.getElementById('yesBtn');
        const noBtn = document.getElementById('noBtn');
        const functionalityInput = document.getElementById('functionality');
        
        // Set the value of the hidden input based on the selected button
        functionalityInput.value = value;
        
        // Change the button styles to indicate selection
        if (value === 'functional') {
            yesBtn.classList.remove('btn-outline-success');
            yesBtn.classList.add('btn-success');
            noBtn.classList.remove('btn-danger');
            noBtn.classList.add('btn-outline-danger');
        } else {
            noBtn.classList.remove('btn-outline-danger');
            noBtn.classList.add('btn-danger');
            yesBtn.classList.remove('btn-success');
            yesBtn.classList.add('btn-outline-success');
        }
    }
    form.addEventListener("submit", function(event) {
        event.preventDefault();
        alert("Appointment requested successfully!");
    });

    // Open the modal when the Terms and Conditions link is clicked
    termsLink.onclick = function(event) {
        event.preventDefault(); // Prevent the default anchor behavior
        modal.style.display = "block"; // Show the modal
    }

    // Close the modal when the close button is clicked
    closeBtn.onclick = function() {
        modal.style.display = "none"; // Hide the modal
    }

    // Close the modal when clicking outside of the modal content
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = "none"; // Hide the modal
        }
    }
}); 
    

