$(document).ready(function() {
    const totalSlots = 26;
    let selectedSlots = {};  // Stores selected slots for each date
    let confirmedSlots = {}; // Stores confirmed slots for each date
    let currentSelectedDate = null;

    // Function to create slots
    function createSlots() {
        $('#slots').empty();
        for (let i = 0; i < totalSlots; i++) {
            const slot = document.createElement('div');
            slot.classList.add('slot');
            slot.textContent = i + 1;

            // Check if slot is confirmed or selected
            if (confirmedSlots[currentSelectedDate] && confirmedSlots[currentSelectedDate].includes(i + 1)) {
                slot.classList.add('confirmed');
                slot.textContent += ' (Locked)';
            } else if (selectedSlots[currentSelectedDate] && selectedSlots[currentSelectedDate].includes(i + 1)) {
                slot.classList.add('unavailable');
            } else {
                slot.classList.add('available');
            }

            $('#slots').append(slot);
        }
    }

    // Function to update available slots display
    function updateAvailableSlots() {
        const selected = selectedSlots[currentSelectedDate] ? selectedSlots[currentSelectedDate].length : 0;
        const confirmed = confirmedSlots[currentSelectedDate] ? confirmedSlots[currentSelectedDate].length : 0;
        const availableSlots = totalSlots - (selected + confirmed);
        $('#available-slots').text(availableSlots);
    }

    // Initialize the datepicker
    $("#datepicker").datepicker({
        dateFormat: 'yy-mm-dd',
        minDate: 0,
        onSelect: function(dateText) {
            // Save the currently selected date
            currentSelectedDate = dateText;

            // Initialize slots for this date if not already stored
            if (!selectedSlots[currentSelectedDate]) {
                selectedSlots[currentSelectedDate] = [];
            }
            if (!confirmedSlots[currentSelectedDate]) {
                confirmedSlots[currentSelectedDate] = [];
            }

            // Create slots and update available slots
            createSlots();
            updateAvailableSlots();

            console.log("Selected date: " + dateText);
        }
    });

    // Initialize the timepicker
    $("#timepicker").timepicker({
        timeFormat: 'HH:mm',
        interval: 30,
        minTime: '08:00',
        maxTime: '18:00',
        defaultTime: '08:00',
        startTime: '08:00',
        dynamic: false,
        dropdown: true,
        scrollbar: true
    });

    // Handle slot selection/deselection
    $('#slots').on('click', '.slot', function() {
        const slotNumber = parseInt($(this).text());

        if ($(this).hasClass('available')) {
            // Select the slot
            $(this).removeClass('available').addClass('unavailable');
            selectedSlots[currentSelectedDate].push(slotNumber);
        } else if ($(this).hasClass('unavailable')) {
            // Deselect the slot
            $(this).removeClass('unavailable').addClass('available');
            const index = selectedSlots[currentSelectedDate].indexOf(slotNumber);
            if (index > -1) {
                selectedSlots[currentSelectedDate].splice(index, 1);
            }
        }

        updateAvailableSlots();
    });

    // Show tooltip on hover
    $('#slots').on('mouseover', '.slot', function() {
        if ($(this).hasClass('available')) {
            $(this).attr('title', 'Slot Available');
        } else if ($(this).hasClass('unavailable')) {
            $(this).attr('title', 'Slot Selected');
        } else if ($(this).hasClass('confirmed')) {
            $(this).attr('title', 'Slot Confirmed');
        }
    });

    // Show the popup with available slots
    $('#show-slots-btn').on('click', function() {
        if (currentSelectedDate) {
            $('#slots-popup').fadeIn();
        } else {
            alert("Please select a date first.");
        }
    });

    // Close the popup
    $('.close').on('click', function() {
        $('#slots-popup').fadeOut();
    });

    // Confirm and lock slots for the current date
    $("#confirm-btn").click(function() {
        $("#slots-popup").fadeOut();
        alert("Your slots for " + currentSelectedDate + " have been confirmed!");

        // Mark the selected slots as confirmed and disable further changes
        if (!confirmedSlots[currentSelectedDate]) {
            confirmedSlots[currentSelectedDate] = [];
        }

        selectedSlots[currentSelectedDate].forEach(slot => {
            confirmedSlots[currentSelectedDate].push(slot);
        });

        // Clear selected slots and lock them
        selectedSlots[currentSelectedDate] = [];
        createSlots();
        updateAvailableSlots();
    });

    // Close popup when clicking outside the content
    $(window).on('click', function(event) {
        if (event.target.id === 'slots-popup') {
            $('#slots-popup').fadeOut();
        }
    });

    // Initialize the page with default slots and availability
    createSlots();
    updateAvailableSlots();
});
