function createDateArray(startDateInput) {

    let startDate = new Date(startDateInput);

    let currentDate = new Date();


    if (currentDate < startDate) {
        startDate = currentDate;
    }
    // Calculate the end date as 3 weeks from the current date
    const endDate = new Date();
    endDate.setDate(currentDate.getDate() + 21);  // Adding 21 days (3 weeks)
    //porta fuori da usare come limite
    endingDate = endDate;

    const dateArray = [];
    let currentDateObj;

    let currentDateCopy = new Date(startDate);  // Create a copy to avoid modifying startDate

    while (currentDateCopy <= endDate) {
        currentDateObj = new Date(currentDateCopy);
        const dateItem = {
            date: currentDateObj,
            today: currentDateCopy.toDateString() === currentDate.toDateString()
        };
        dateArray.push(dateItem);

        // Move to the next day
        currentDateCopy.setDate(currentDateCopy.getDate() + 1);
    }
    console.log(dateArray);
    return dateArray;
}



async function fetchJsonData() {
    try {
        const response = await fetch('diet_plan.json'); // Replace with your JSON file's name
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    } catch (error) {
        console.error('Error fetching JSON data:', error);
    }
}

function createMealPlan(calendar, mealPlan) {

    const totalWeeks = mealPlan.weeks.length;
    let mealIndex = 0;

    for (let i = 0; i < calendar.length; i++) {
        const weekIndex = Math.floor(mealIndex / mealPlan.weeks[0].days.length) % totalWeeks;
        const dayIndex = mealIndex % mealPlan.weeks[0].days.length;

        const mealPlanDay = mealPlan.weeks[weekIndex].days[dayIndex];
        calendar[i].mealPlan = mealPlanDay;

        mealIndex++;
    }

    return calendar;


}



function init() {
    calendar = createDateArray(startingDate, jsonData);
    mealPlan = createMealPlan(calendar, jsonData);
    createPage(current_display_date, mealPlan)
}

function formatDateToYYYYMMDD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Adding 1 to month due to zero-based indexing
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}



function createPage(date, plan) {
    let chosenDay = plan.find((day) => formatDateToYYYYMMDD(day.date) == formatDateToYYYYMMDD(date));
    date_display.innerText = `${chosenDay.date.toLocaleDateString('it-it', { weekday: "long", year: "numeric", month: "long", day: "numeric" }).toUpperCase()}`
    brk_display.innerText = `${chosenDay.mealPlan.meals[0].item}`
    snack_m_display.innerText = `${chosenDay.mealPlan.meals[1].item}`
    lunch_display.innerText = `${chosenDay.mealPlan.meals[2].item}`
    snack_a_display.innerText = `${chosenDay.mealPlan.meals[3].item}`
    dinner_display.innerText = `${chosenDay.mealPlan.meals[4].item}`

}

function previousDay() {
    current_display_date.setDate(current_display_date.getDate() - 1);
    if(current_display_date < startingDate) {
        alert('Non puoi andare piú indietro di cosí')
        return;
    }
    createPage(current_display_date, mealPlan)
}
function nextDay() {
    current_display_date.setDate(current_display_date.getDate() + 1);
    if(current_display_date > endingDate) {
        alert('Non puoi andare piú avanti di cosí')
        return;
    }
    createPage(current_display_date, mealPlan)
}

function toDay() {
    today = new Date();
    current_display_date = today;
    createPage(current_display_date, mealPlan)
}

let jsonData = null;
let calendar = [];
let mealPlan = [];

const prev_date = document.getElementById('prev-day');
const next_date = document.getElementById('next-day');
const today_date = document.getElementById('today');
const date_display = document.getElementById('date');
const brk_display = document.getElementById('brk');
const snack_m_display = document.getElementById('snack_m');
const lunch_display = document.getElementById('lunch');
const snack_a_display = document.getElementById('snack_a');
const dinner_display = document.getElementById('dinner');

let current_display_date;
let today = new Date();
current_display_date = today;

const startingDate = new Date('2023-08-28');
let endingDate;

prev_date.addEventListener('click', previousDay);
next_date.addEventListener('click', nextDay);
today_date.addEventListener('click', toDay);

// Load JSON data when the page loads

fetchJsonData().then((data) => {
    if (data) {
        jsonData = data;
        // Initialize the current date and update meals
        init();
    } else {
        alert('Non sono riuscito a caricare la dieta')
    }
});