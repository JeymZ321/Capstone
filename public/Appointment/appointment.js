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
});
