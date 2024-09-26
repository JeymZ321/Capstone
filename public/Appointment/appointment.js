document.addEventListener("DOMContentLoaded", function() {
    const form = document.querySelector(".appointment-form");
    const modal = document.getElementById("terms-modal");
    const termsLink = document.getElementById("terms-link");
    const closeBtn = document.querySelector(".close-btn");

    form.addEventListener("submit", function(event) {
        event.preventDefault();
        alert("Appointment requested successfully!");
    });

    // Show the terms and conditions modal when the link is clicked
    termsLink.addEventListener("click", function(event) {
        event.preventDefault();
        modal.style.display = "flex";
    });

    // Close the modal when the close button is clicked
    closeBtn.addEventListener("click", function() {
        modal.style.display = "none";
    });

    // Close the modal if the user clicks outside the modal content
    window.addEventListener("click", function(event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
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
    function togglePanel(panelId) {
        const panelBtn = document.getElementById(panelId + 'Btn');
        const panelCheckbox = document.getElementById(panelId);
        
        // Toggle the checkbox value
        panelCheckbox.checked = !panelCheckbox.checked;
        
        // Change the button color based on the checked state
        if (panelCheckbox.checked) {
            panelBtn.classList.remove('btn-outline-primary');
            panelBtn.classList.add('btn-primary');
        } else {
            panelBtn.classList.remove('btn-primary');
            panelBtn.classList.add('btn-outline-primary');
        }
    }
});
