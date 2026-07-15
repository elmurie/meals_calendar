const PLAN_START_DATE = new Date(2023, 7, 28); // Lunedì 28 agosto 2023
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const previousButton = document.getElementById('prev-day');
const nextButton = document.getElementById('next-day');
const todayButton = document.getElementById('today');
const dateDisplay = document.getElementById('date');
const weekDisplay = document.getElementById('week-number');
const weekStrip = document.getElementById('week-strip');
const mealPlanDisplay = document.getElementById('meal-plan');
const statusDisplay = document.getElementById('status');

let dietPlan = null;
let currentDisplayDate = startOfDay(new Date());
let pointerStart = null;

function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, amount) {
    const result = new Date(date);
    result.setDate(result.getDate() + amount);
    return result;
}

function getPlanDay(date) {
    const totalWeeks = dietPlan.weeks.length;
    const daysPerWeek = dietPlan.weeks[0].days.length;
    const cycleLength = totalWeeks * daysPerWeek;
    const elapsedDays = Math.round((startOfDay(date) - PLAN_START_DATE) / MILLISECONDS_PER_DAY);

    // Il doppio modulo mantiene il risultato positivo anche prima della data iniziale.
    const cycleDay = ((elapsedDays % cycleLength) + cycleLength) % cycleLength;
    const weekIndex = Math.floor(cycleDay / daysPerWeek);
    const dayIndex = cycleDay % daysPerWeek;

    return {
        day: dietPlan.weeks[weekIndex].days[dayIndex],
        weekNumber: weekIndex + 1,
        totalWeeks
    };
}

function renderPage() {
    if (!dietPlan) return;

    const { day, weekNumber, totalWeeks } = getPlanDay(currentDisplayDate);

    dateDisplay.textContent = currentDisplayDate.toLocaleDateString('it-IT', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).toUpperCase();
    weekDisplay.textContent = `Settimana ${weekNumber} di ${totalWeeks}`;

    renderWeekStrip();
    mealPlanDisplay.replaceChildren(...day.meals.map(createMealCard));
    todayButton.disabled = isSameDay(currentDisplayDate, new Date());
}

function renderWeekStrip() {
    const monday = getMonday(currentDisplayDate);
    const days = Array.from({ length: 7 }, (_, index) => addDays(monday, index));
    weekStrip.replaceChildren(...days.map(createDayButton));
}

function getMonday(date) {
    const weekday = date.getDay();
    const daysSinceMonday = (weekday + 6) % 7;
    return addDays(date, -daysSinceMonday);
}

function createDayButton(date) {
    const button = document.createElement('button');
    const selected = isSameDay(date, currentDisplayDate);
    const today = isSameDay(date, new Date());
    const weekday = date.toLocaleDateString('it-IT', { weekday: 'short' }).replace('.', '');

    button.type = 'button';
    button.className = 'week-day';
    button.classList.toggle('is-selected', selected);
    button.classList.toggle('is-today', today);
    button.title = date.toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });
    button.setAttribute('aria-label', button.title);
    if (selected) button.setAttribute('aria-current', 'date');

    const label = document.createElement('span');
    label.className = 'week-day-label';
    label.textContent = weekday;

    const number = document.createElement('span');
    number.className = 'week-day-number';
    number.textContent = date.getDate();

    button.append(label, number);
    button.addEventListener('click', () => selectDate(date));
    return button;
}

function createMealCard(meal) {
    const card = document.createElement('article');
    card.className = 'meal mt-3 p-3 rounded-3';
    card.dataset.mealId = meal.meal_id;

    const title = document.createElement('h3');
    title.className = 'label fw-bold';
    title.textContent = meal.meal_label_it;

    const description = document.createElement('p');
    description.className = 'mb-0';
    description.textContent = meal.item;

    card.append(title, description);
    return card;
}

function isSameDay(firstDate, secondDate) {
    return startOfDay(firstDate).getTime() === startOfDay(secondDate).getTime();
}

function moveToDay(offset) {
    selectDate(addDays(currentDisplayDate, offset), offset > 0 ? 'next' : 'previous');
}

function selectDate(date, direction) {
    const oldDate = currentDisplayDate;
    currentDisplayDate = startOfDay(date);
    const animationDirection = direction ?? (currentDisplayDate > oldDate ? 'next' : 'previous');
    animateMealPlan(animationDirection);
    renderPage();
}

function animateMealPlan(direction) {
    mealPlanDisplay.classList.remove('slide-next', 'slide-previous');
    void mealPlanDisplay.offsetWidth;
    mealPlanDisplay.classList.add(direction === 'next' ? 'slide-next' : 'slide-previous');
}

async function loadDietPlan() {
    setLoading(true);

    try {
        const data = window.DIET_PLAN ?? await fetchDietPlan();
        validateDietPlan(data);
        dietPlan = data;
        statusDisplay.hidden = true;
    } catch (error) {
        console.error('Impossibile caricare il piano alimentare:', error);
        statusDisplay.textContent = 'Non è stato possibile caricare il piano alimentare. Riprova aggiornando la pagina.';
        statusDisplay.className = 'alert alert-danger';
        statusDisplay.hidden = false;
    } finally {
        setLoading(false);
        if (dietPlan) renderPage();
    }
}

async function fetchDietPlan() {
    const response = await fetch('diet_plan.json');
    if (!response.ok) throw new Error(`Errore HTTP ${response.status}`);
    return response.json();
}

function validateDietPlan(data) {
    if (!Array.isArray(data?.weeks) || data.weeks.length === 0) {
        throw new Error('Il piano non contiene settimane valide');
    }

    const daysPerWeek = data.weeks[0]?.days?.length;
    if (!daysPerWeek || data.weeks.some((week) => week.days?.length !== daysPerWeek)) {
        throw new Error('Le settimane non hanno lo stesso numero di giorni');
    }
}

function setLoading(isLoading) {
    previousButton.disabled = isLoading;
    nextButton.disabled = isLoading;
    todayButton.disabled = isLoading;

    if (isLoading) {
        statusDisplay.textContent = 'Caricamento del piano…';
        statusDisplay.className = 'alert alert-light';
        statusDisplay.hidden = false;
    }
}

previousButton.addEventListener('click', () => moveToDay(-1));
nextButton.addEventListener('click', () => moveToDay(1));
todayButton.addEventListener('click', () => {
    selectDate(new Date());
});

document.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || isInteractiveElement(event.target)) return;

    if (event.key === 'ArrowLeft') {
        event.preventDefault();
        moveToDay(-1);
    } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        moveToDay(1);
    }
});

function isInteractiveElement(element) {
    return element instanceof HTMLElement && Boolean(element.closest('button, a, input, textarea, select'));
}

mealPlanDisplay.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
    mealPlanDisplay.setPointerCapture(event.pointerId);
});

mealPlanDisplay.addEventListener('pointermove', (event) => {
    if (!pointerStart || event.pointerId !== pointerStart.id) return;
    const horizontalDistance = Math.abs(event.clientX - pointerStart.x);
    const verticalDistance = Math.abs(event.clientY - pointerStart.y);
    mealPlanDisplay.classList.toggle('is-dragging', horizontalDistance > 10 && horizontalDistance > verticalDistance);
});

mealPlanDisplay.addEventListener('pointerup', finishPointerGesture);
mealPlanDisplay.addEventListener('pointercancel', cancelPointerGesture);

function finishPointerGesture(event) {
    if (!pointerStart || event.pointerId !== pointerStart.id) return;

    const deltaX = event.clientX - pointerStart.x;
    const deltaY = event.clientY - pointerStart.y;
    const isHorizontalSwipe = Math.abs(deltaX) >= 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25;

    cancelPointerGesture();
    if (isHorizontalSwipe) moveToDay(deltaX < 0 ? 1 : -1);
}

function cancelPointerGesture() {
    pointerStart = null;
    mealPlanDisplay.classList.remove('is-dragging');
}

loadDietPlan();
