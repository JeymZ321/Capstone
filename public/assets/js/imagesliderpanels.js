const images = [
    {
        src: "assets/img/bodypanels/carbodypanels.png",
        tokens: ["Token 1-1", "Token 1-2", "Token 1-3", "Brent"]
    },
    {
        src: "assets/img/bodypanels/pickuptruckbodypanels.png",
        tokens: ["Token 2-1", "Token 2-2", "Token 2-3", "Symond"]
    },
    {
        src: "assets/img/bodypanels/carbodypanels.png",
        tokens: ["Token 3-1", "Token 3-2", "Token 3-3", "Creaa"]
    }
];

let currentIndex = 0;

// Store the state of token checkboxes
const tokenStates = [
    [false, false, false, false], // For image 1
    [false, false, false, false], // For image 2
    [false, false, false, false]  // For image 3
];

function updateSlider() {
    // Update the image
    const sliderImage = document.getElementById("slider-image");
    sliderImage.src = images[currentIndex].src;

    // Update the toggle tokens
    document.getElementById("token1").textContent = images[currentIndex].tokens[0];
    document.getElementById("token2").textContent = images[currentIndex].tokens[1];
    document.getElementById("token3").textContent = images[currentIndex].tokens[2];
    document.getElementById("token4").textContent = images[currentIndex].tokens[3];


    // Update the checkbox states based on stored values
    document.getElementById("token1-checkbox").checked = tokenStates[currentIndex][0];
    document.getElementById("token2-checkbox").checked = tokenStates[currentIndex][1];
    document.getElementById("token3-checkbox").checked = tokenStates[currentIndex][2];
    document.getElementById("token4-checkbox").checked = tokenStates[currentIndex][3];

}

function nextImage() {
    currentIndex = (currentIndex + 1) % images.length;
    updateSlider();
}

function prevImage() {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    updateSlider();
}

// Toggle the token state when clicked
function toggleToken(tokenIndex) {
    tokenStates[currentIndex][tokenIndex] = !tokenStates[currentIndex][tokenIndex];
}

// Initialize slider
updateSlider();

