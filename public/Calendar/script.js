$(document).ready(function() {
    const totalSlots = 26;
    let availableSlots = totalSlots;

    // Initialize the datepicker
    $("#datepicker").datepicker({
        onSelect: function(dateText) {
            // When a date is selected, store the value or do something with it
            console.log("Selected date: " + dateText);
        }
    });

    // Create 26 slots
    for (let i = 0; i < totalSlots; i++) {
        const slot = document.createElement('div');
        slot.classList.add('slot', 'available');
        slot.textContent = i + 1;
        $('#slots').append(slot);
    }

    // Update available slots display
    function updateAvailableSlots() {
        $('#available-slots').text(availableSlots);
    }

    // Handle slot selection
    $('#slots').on('click', '.slot.available', function() {
        $(this).removeClass('available').addClass('unavailable');
        availableSlots--;
        updateAvailableSlots();
    });

    // Show tooltip on hover
    $('#slots').on('mouseover', '.slot', function() {
        if ($(this).hasClass('available')) {
            $(this).attr('title', 'Slot Available');
        } else {
            $(this).attr('title', 'Slot Unavailable');
        }
    });

    // Show the popup with available slots
    $('#show-slots-btn').on('click', function() {
        $('#slots-popup').fadeIn();
    });

    // Close the popup
    $('.close').on('click', function() {
        $('#slots-popup').fadeOut();
    });

    $("#confirm-btn").click(function() {
        $("#slots-popup").hide();
    });

    // Close the popup when clicking outside of the popup content
    $(window).on('click', function(event) {
        if (event.target.id === 'slots-popup') {
            $('#slots-popup').fadeOut();
        }
    });

    updateAvailableSlots();
});

$(document).ready(function() {
    $("#datepicker").datepicker({
        dateFormat: 'yy-mm-dd',
        minDate: 0
    });

    $("#timepicker").timepicker({
        timeFormat: 'HH:mm',
        interval: 30, // Change interval as needed
        minTime: '08:00',
        maxTime: '18:00',
        defaultTime: '08:00',
        startTime: '08:00',
        dynamic: false,
        dropdown: true,
        scrollbar: true
    });

    // Show Slots Popup
    $("#show-slots-btn").click(function() {
        $("#slots-popup").show();
    });

    // Close Slots Popup
    $(".close").click(function() {
        $("#slots-popup").hide();
    });
});
