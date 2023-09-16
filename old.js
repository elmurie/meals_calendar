// Get today's date and set it as the starting date
const today = new Date();
today.setHours(0, 0, 0, 0);

// Initialize the current date
let currentDate = today;

// Function to update the displayed meals
function updateMeals() {
    console.log(currentDate)
    // Find the corresponding week and day in your JSON data
    const currentWeek = jsonData.weeks.find((week) => week.week_id === currentDate.getWeek());
    console.log(currentWeek)

    const currentDay = currentWeek.days.find((day) => day.weekday_id === currentDate.getWeekday());

    // Update the HTML to display the meals for the current day
    const mealPlanElement = document.getElementById('meal-plan');
    mealPlanElement.innerHTML = `<h2>${currentDay.weekday_label}</h2>`;
    
    currentDay.meals.forEach((meal) => {
        mealPlanElement.innerHTML += `<h3>${meal.meal_label}</h3><p>${meal.item}</p>`;
    });
}




// Function to navigate to the previous day
document.getElementById('prev-day').addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() - 1);
    updateMeals();
});

// Function to navigate to the next day
document.getElementById('next-day').addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() + 1);
    updateMeals();
});


// Helper function to get the week number
Date.prototype.getWeek = function () {
    const date = new Date(this.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

// Function to fetch the JSON data from the file
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

// Load JSON data when the page loads
let jsonData = null;

fetchJsonData().then((data) => {
    if (data) {
        jsonData = data;
        // Initialize the current date and update meals
        currentDate = today;
        updateMeals();
    }
});