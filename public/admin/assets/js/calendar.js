const calendar = document.querySelector(".calendar"),
    date = document.querySelector(".date"),
    daysContainer = document.querySelector(".days"),
    prev = document.querySelector(".prev"),
    next = document.querySelector(".next"),
    todayBtn = document.querySelector(".today-btn"),
    gotoBtn = document.querySelector(".goto-btn"),
    dateInput = document.querySelector(".date-input"),
    eventDay = document.querySelector(".event-day"),
    eventDate = document.querySelector(".event-date"),
    eventsContainer = document.querySelector(".events"),
    addEventBtn = document.querySelector(".add-event"),
    addEventWrapper = document.querySelector(".add-event-wrapper"),
    addEventCloseBtn = document.querySelector(".close"),
    addEventTitle = document.querySelector(".event-name"),
    addEventStartDate = document.querySelector(".event-start-date"),
    addEventEndDate = document.querySelector(".event-end-date"),
    addEventFrom = document.querySelector(".event-time-from"),
    addEventTo = document.querySelector(".event-time-to"),
    addEventSubmit = document.querySelector(".add-event-btn"),
    eventCountDisplay = document.querySelector(".event-count");

let today = new Date();
let activeDay;
let month = today.getMonth();
let year = today.getFullYear();
let editingEventIndex = null; // Track the index of the event being edited
let highlightedEventId = null; // Track the currently highlighted event

const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const eventsArr = [];
getEvents();

// Convert time to 12-hour format with AM/PM
function formatTime12Hour(time) {
    let [hour, minute] = time.split(":");
    let ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${ampm}`;
}

// Initialize calendar
function initCalendar() {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);
    const prevDays = prevLastDay.getDate();
    const lastDate = lastDay.getDate();
    const day = firstDay.getDay();
    const nextDays = 7 - lastDay.getDay() - 1;

    date.innerHTML = months[month] + " " + year;

    let days = "";

    // Previous month's days
    for (let x = day; x > 0; x--) {
        days += `<div class="day prev-date">${prevDays - x + 1}</div>`;
    }

    // Current month's days
    for (let i = 1; i <= lastDate; i++) {
        let event = false;
        eventsArr.forEach((eventObj) => {
            if (isDateWithinRange(`${year}-${month + 1}-${i}`, eventObj.startDate, eventObj.endDate)) {
                event = true;
            }
        });

        if (i === today.getDate() && year === today.getFullYear() && month === today.getMonth()) {
            activeDay = i;
            getActiveDay(i);
            updateEvents(i);
            days += `<div class="day today active ${event ? 'event' : ''}">${i}</div>`;
        } else {
            days += `<div class="day ${event ? 'event' : ''}">${i}</div>`;
        }
    }

    // Next month's days
    for (let j = 1; j <= nextDays; j++) {
        days += `<div class="day next-date">${j}</div>`;
    }
    daysContainer.innerHTML = days;
    addListener();
}

// Check if a date is within a range
function isDateWithinRange(date, startDate, endDate) {
    const currentDate = new Date(Date.UTC(...date.split('-')));
    const start = new Date(Date.UTC(...startDate.split('-')));
    const end = new Date(Date.UTC(...endDate.split('-')));

    return start <= currentDate && currentDate <= end;
}

function prevMonth() {
    month--;
    if (month < 0) {
        month = 11;
        year--;
    }
    initCalendar();
}

function nextMonth() {
    month++;
    if (month > 11) {
        month = 0;
        year++;
    }
    initCalendar();
}

prev.addEventListener("click", prevMonth);
next.addEventListener("click", nextMonth);

todayBtn.addEventListener("click", () => {
    today = new Date();
    month = today.getMonth();
    year = today.getFullYear();
    initCalendar();
});

dateInput.addEventListener("input", (e) => {
    dateInput.value = dateInput.value.replace(/[^0-9/]/g, "");
    if (dateInput.value.length === 2) {
        dateInput.value += "/";
    }
    if (dateInput.value.length > 7) {
        dateInput.value = dateInput.value.slice(0, 7);
    }
    if (e.inputType === "deleteContentBackward") {
        if (dateInput.value.length === 3) {
            dateInput.value = dateInput.value.slice(0, 2);
        }
    }
});

gotoBtn.addEventListener("click", gotoDate);

function gotoDate() {
    const dateArr = dateInput.value.split("/");
    if (dateArr.length === 2) {
        if (dateArr[0] > 0 && dateArr[0] < 13 && dateArr[1].length === 4) {
            month = dateArr[0] - 1;
            year = dateArr[1];
            initCalendar();
            return;
        }
    }
    alert("Invalid Date");
}

function addListener() {
    const days = document.querySelectorAll(".day");
    days.forEach((day) => {
        day.addEventListener("click", (e) => {
            getActiveDay(e.target.innerHTML);
            updateEvents(Number(e.target.innerHTML));
            activeDay = Number(e.target.innerHTML);

            // Auto-fill the Start Date field when a day is clicked
            const clickedDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(activeDay).padStart(2, "0")}`;
            addEventStartDate.value = clickedDate;

            days.forEach((day) => {
                day.classList.remove("active");
            });

            if (e.target.classList.contains("prev-date")) {
                prevMonth();
                setTimeout(() => {
                    const days = document.querySelectorAll(".day");
                    days.forEach((day) => {
                        if (!day.classList.contains("prev-date") && day.innerHTML === e.target.innerHTML) {
                            day.classList.add("active");
                        }
                    });
                }, 100);
            } else if (e.target.classList.contains("next-date")) {
                nextMonth();
                setTimeout(() => {
                    const days = document.querySelectorAll(".day");
                    days.forEach((day) => {
                        if (!day.classList.contains("next-date") && day.innerHTML === e.target.innerHTML) {
                            day.classList.add("active");
                        }
                    });
                }, 100);
            } else {
                e.target.classList.add("active");
            }
        });
    });
}

function getActiveDay(date) {
    const day = new Date(year, month, date);
    const dayName = day.toString().split(" ")[0];
    eventDay.innerHTML = dayName;
    eventDate.innerHTML = date + " " + months[month] + " " + year;
}

function updateEvents(date) {
    let events = "";
    let eventCount = 0; // Initialize the event counter

    eventsArr.forEach((event, index) => {
        if (isDateWithinRange(`${year}-${month + 1}-${date}`, event.startDate, event.endDate)) {
            eventCount++; // Increment the counter for each event
            events += `
                <div class="event eventlist" onclick="toggleHighlightEvent('${event.startDate}', '${event.endDate}', ${index})">
                <div class="eventcontents">
                    <div class="title">
                        <i class="fas fa-circle"></i>
                        <h3 class="event-title">${event.title}</h3>
                    </div>
                    <div class="event-date-range">
                        <span>${event.startDate} to ${event.endDate}</span>
                    </div>
                    <div class="event-time">
                        <span>${event.time}</span>
                    </div>
                    <div>
                        <button class="edit-event-btn " onclick="editEvent(event, ${index})">Edit</button>
                    <button class="remove-event-btn " onclick="removeEvent('${event.title}', '${event.startDate}', '${event.endDate}')">Remove</button>
                    </div>
                    
                </div>    
                
                </div>`;
        }
    });

    if (events === "") {
        events = `<div class="no-event"><h3>No Events</h3></div>`;
    }

    eventsContainer.innerHTML = events;

    // Display event count under the day name
    eventCountDisplay.innerHTML = `${eventCount} Events`;
    saveEvents();
}

// Toggle highlight for event dates
function toggleHighlightEvent(startDate, endDate, eventId) {
    if (highlightedEventId === eventId) {
        clearHighlight();
        highlightedEventId = null;
    } else {
        clearHighlight();
        highlightEventDates(startDate, endDate);
        highlightedEventId = eventId;
    }
}

// Highlight event dates in the calendar
function highlightEventDates(startDate, endDate) {
    const days = document.querySelectorAll(".day");
    days.forEach((day) => {
        const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day.textContent).padStart(2, "0")}`;
        if (isDateWithinRange(date, startDate, endDate)) {
            day.classList.add("highlight");
        }
    });
}

// Clear all highlighted dates
function clearHighlight() {
    const days = document.querySelectorAll(".day.highlight");
    days.forEach((day) => {
        day.classList.remove("highlight");
    });
}

function removeEvent(title, startDate, endDate) {
    const eventIndex = eventsArr.findIndex(event => event.title === title && event.startDate === startDate && event.endDate === endDate);
    if (eventIndex !== -1) {
        eventsArr.splice(eventIndex, 1);
        updateEvents(activeDay);
    }
}

// Edit event
function editEvent(e, index) {
    e.stopPropagation();  // Prevent triggering the event click for highlighting
    const event = eventsArr[index];
    editingEventIndex = index;
    addEventTitle.value = event.title;
    addEventStartDate.value = event.startDate;
    addEventEndDate.value = event.endDate;
    addEventFrom.value = event.time.split(" - ")[0];
    addEventTo.value = event.time.split(" - ")[1];
    addEventWrapper.classList.add("active");
}

addEventBtn.addEventListener("click", () => {
    addEventWrapper.classList.toggle("active");
    editingEventIndex = null; // Reset edit mode when opening the form
});

addEventCloseBtn.addEventListener("click", () => {
    addEventWrapper.classList.remove("active");
    editingEventIndex = null; // Reset edit mode when closing the form
});

document.addEventListener("click", (e) => {
    if (e.target !== addEventBtn && !addEventWrapper.contains(e.target)) {
        addEventWrapper.classList.remove("active");
        editingEventIndex = null;
    }
});

addEventSubmit.addEventListener("click", () => {
    const eventTitle = addEventTitle.value;
    const eventStartDate = addEventStartDate.value;
    const eventEndDate = addEventEndDate.value;
    const eventTimeFrom = addEventFrom.value;
    const eventTimeTo = addEventTo.value;

    if (!eventTitle || !eventStartDate || !eventEndDate || !eventTimeFrom || !eventTimeTo) {
        alert("Please fill all the fields");
        return;
    }

    const formattedTimeFrom = formatTime12Hour(eventTimeFrom);
    const formattedTimeTo = formatTime12Hour(eventTimeTo);
    const newEvent = {
        title: eventTitle,
        startDate: eventStartDate,
        endDate: eventEndDate,
        time: `${formattedTimeFrom} - ${formattedTimeTo}`
    };

    if (editingEventIndex !== null) {
        eventsArr[editingEventIndex] = newEvent;
    } else {
        eventsArr.push(newEvent);
    }

    addEventWrapper.classList.remove("active");

    addEventTitle.value = "";
    addEventStartDate.value = "";
    addEventEndDate.value = "";
    addEventFrom.value = "";
    addEventTo.value = "";

    updateEventsDisplay();
    editingEventIndex = null; // Reset edit mode
});

function updateEventsDisplay() {
    let eventsHTML = "";
    eventsArr.forEach((event, index) => {
        eventsHTML += `
            <div class="event" onclick="toggleHighlightEvent('${event.startDate}', '${event.endDate}', ${index})">
                <div class="title">
                    <i class="fas fa-circle"></i>
                    <h3 class="event-title">${event.title}</h3>
                </div>
                <div class="event-date-range">
                    <span>${event.startDate} to ${event.endDate}</span>
                </div>
                <div class="event-time">
                    <span>${event.time}</span>
                </div>
                <button class="edit-event-btn" onclick="editEvent(event, ${index})">Edit</button>
                <button class="remove-event-btn" onclick="removeEvent('${event.title}', '${event.startDate}', '${event.endDate}')">Remove</button>
            </div>`;
    });
    eventsContainer.innerHTML = eventsHTML || `<div class="no-event"><h3>No Events</h3></div>`;
    saveEvents();
}

function saveEvents() {
    localStorage.setItem("events", JSON.stringify(eventsArr));
}

function getEvents() {
    if (localStorage.getItem("events")) {
        eventsArr.push(...JSON.parse(localStorage.getItem("events")));
    }
}

initCalendar();
