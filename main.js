const DEFAULT_SETTINGS = Object.freeze({
    planName: 'Dieta Simone',
    startDate: '2023-08-28',
    theme: 'auto',
    fontSize: 'medium',
    primaryColor: '#374d7c'
});
const SETTINGS_STORAGE_KEY = 'meal-plan-settings-v1';
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const previousButton = document.getElementById('prev-day');
const nextButton = document.getElementById('next-day');
const todayButton = document.getElementById('today');
const dateDisplay = document.getElementById('date');
const weekDisplay = document.getElementById('week-number');
const weekStrip = document.getElementById('week-strip');
const dayViewButton = document.getElementById('day-view');
const weekViewButton = document.getElementById('week-view');
const searchToggle = document.getElementById('search-toggle');
const searchPanel = document.getElementById('search-panel');
const searchInput = document.getElementById('meal-search');
const closeSearchButton = document.getElementById('close-search');
const searchSummary = document.getElementById('search-summary');
const searchResults = document.getElementById('search-results');
const appTitle = document.getElementById('app-title');
const settingsToggle = document.getElementById('settings-toggle');
const settingsDialog = document.getElementById('settings-dialog');
const settingsForm = document.getElementById('settings-form');
const closeSettingsButton = document.getElementById('close-settings');
const resetSettingsButton = document.getElementById('reset-settings');
const planNameInput = document.getElementById('plan-name');
const planStartDateInput = document.getElementById('plan-start-date');
const themeSelect = document.getElementById('theme-select');
const fontSizeSelect = document.getElementById('font-size-select');
const primaryColorInput = document.getElementById('primary-color');
const primaryColorValue = document.getElementById('primary-color-value');
const mealPlanDisplay = document.getElementById('meal-plan');
const statusDisplay = document.getElementById('status');

let dietPlan = null;
let settings = loadSettings();
let planStartDate = parseLocalDate(settings.startDate);
let currentDisplayDate = startOfDay(new Date());
let viewMode = 'day';
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
    const elapsedDays = Math.round((startOfDay(date) - planStartDate) / MILLISECONDS_PER_DAY);

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

    dateDisplay.textContent = viewMode === 'week'
        ? formatWeekRange(currentDisplayDate).toUpperCase()
        : currentDisplayDate.toLocaleDateString('it-IT', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).toUpperCase();
    weekDisplay.textContent = `Settimana ${weekNumber} di ${totalWeeks}`;

    renderWeekStrip();
    mealPlanDisplay.classList.toggle('weekly-plan', viewMode === 'week');
    if (viewMode === 'week') {
        renderWeeklyPlan();
    } else {
        mealPlanDisplay.replaceChildren(...day.meals.map(createMealCard));
    }
    todayButton.disabled = isSameDay(currentDisplayDate, new Date());
}

function formatWeekRange(date) {
    const monday = getMonday(date);
    const sunday = addDays(monday, 6);
    const sameMonth = monday.getMonth() === sunday.getMonth();
    const start = monday.toLocaleDateString('it-IT', sameMonth
        ? { day: 'numeric' }
        : { day: 'numeric', month: 'short' });
    const end = sunday.toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    return `${start} – ${end}`;
}

function renderWeeklyPlan() {
    const monday = getMonday(currentDisplayDate);
    const daySections = Array.from({ length: 7 }, (_, index) => {
        const date = addDays(monday, index);
        const { day } = getPlanDay(date);
        return createWeekDaySection(date, day);
    });

    mealPlanDisplay.replaceChildren(...daySections);
}

function createWeekDaySection(date, planDay) {
    const section = document.createElement('section');
    section.className = 'week-plan-day';
    if (isSameDay(date, new Date())) section.classList.add('is-today');

    const headingButton = document.createElement('button');
    headingButton.type = 'button';
    headingButton.className = 'week-plan-heading';
    headingButton.textContent = date.toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });
    headingButton.title = 'Apri questo giorno';
    headingButton.addEventListener('click', () => {
        setViewMode('day');
        selectDate(date);
    });

    const meals = document.createElement('div');
    meals.className = 'week-plan-meals';
    meals.append(...planDay.meals.map((meal) => {
        const row = document.createElement('div');
        row.className = 'week-meal-row';

        const label = document.createElement('strong');
        label.textContent = meal.meal_label_it;

        const description = document.createElement('p');
        description.textContent = meal.item;

        row.append(label, description);
        return row;
    }));

    section.append(headingButton, meals);
    return section;
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

function setViewMode(mode) {
    viewMode = mode;
    const isDayView = mode === 'day';
    dayViewButton.classList.toggle('is-active', isDayView);
    weekViewButton.classList.toggle('is-active', !isDayView);
    dayViewButton.setAttribute('aria-pressed', String(isDayView));
    weekViewButton.setAttribute('aria-pressed', String(!isDayView));
    previousButton.setAttribute('aria-label', isDayView ? 'Giorno precedente' : 'Settimana precedente');
    nextButton.setAttribute('aria-label', isDayView ? 'Giorno successivo' : 'Settimana successiva');
    renderPage();
}

function toggleSearch(forceOpen) {
    const shouldOpen = forceOpen ?? searchPanel.hidden;
    searchPanel.hidden = !shouldOpen;
    searchToggle.setAttribute('aria-expanded', String(shouldOpen));
    searchToggle.classList.toggle('is-active', shouldOpen);
    if (shouldOpen) searchInput.focus();
}

function searchMeals(query) {
    if (!dietPlan) return;
    const normalizedQuery = normalizeText(query.trim());
    searchResults.replaceChildren();

    if (normalizedQuery.length < 2) {
        searchSummary.textContent = query ? 'Inserisci almeno 2 caratteri.' : '';
        return;
    }

    const matches = [];
    dietPlan.weeks.forEach((week, weekIndex) => {
        week.days.forEach((day, dayIndex) => {
            day.meals.forEach((meal) => {
                const searchableText = normalizeText(`${meal.meal_label_it} ${meal.item}`);
                if (searchableText.includes(normalizedQuery)) {
                    matches.push({ weekIndex, dayIndex, day, meal });
                }
            });
        });
    });

    searchSummary.textContent = matches.length === 1
        ? '1 risultato trovato'
        : `${matches.length} risultati trovati`;
    searchResults.append(...matches.map(createSearchResult));
}

function createSearchResult(result) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'search-result';

    const context = document.createElement('span');
    context.className = 'search-result-context';
    context.textContent = `Settimana ${result.weekIndex + 1} · ${result.day.weekday_label_it} · ${result.meal.meal_label_it}`;

    const text = document.createElement('span');
    text.className = 'search-result-text';
    text.textContent = result.meal.item;

    button.append(context, text);
    button.addEventListener('click', () => {
        const targetDate = getDateForPlanPosition(result.weekIndex, result.dayIndex);
        toggleSearch(false);
        setViewMode('day');
        selectDate(targetDate);
    });
    return button;
}

function getDateForPlanPosition(weekIndex, dayIndex) {
    const daysPerWeek = dietPlan.weeks[0].days.length;
    const currentCycleDay = getCycleDay(currentDisplayDate);
    const cycleStart = addDays(currentDisplayDate, -currentCycleDay);
    return addDays(cycleStart, weekIndex * daysPerWeek + dayIndex);
}

function getCycleDay(date) {
    const cycleLength = dietPlan.weeks.length * dietPlan.weeks[0].days.length;
    const elapsedDays = Math.round((startOfDay(date) - planStartDate) / MILLISECONDS_PER_DAY);
    return ((elapsedDays % cycleLength) + cycleLength) % cycleLength;
}

function normalizeText(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('it-IT');
}

function loadSettings() {
    try {
        const savedSettings = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY));
        return sanitizeSettings({ ...DEFAULT_SETTINGS, ...savedSettings });
    } catch (error) {
        console.warn('Impossibile leggere le impostazioni salvate:', error);
        return { ...DEFAULT_SETTINGS };
    }
}

function sanitizeSettings(candidate) {
    const validThemes = ['auto', 'light', 'dark'];
    const validFontSizes = ['small', 'medium', 'large'];
    return {
        planName: String(candidate.planName || DEFAULT_SETTINGS.planName).slice(0, 40),
        startDate: /^\d{4}-\d{2}-\d{2}$/.test(candidate.startDate) ? candidate.startDate : DEFAULT_SETTINGS.startDate,
        theme: validThemes.includes(candidate.theme) ? candidate.theme : DEFAULT_SETTINGS.theme,
        fontSize: validFontSizes.includes(candidate.fontSize) ? candidate.fontSize : DEFAULT_SETTINGS.fontSize,
        primaryColor: /^#[0-9a-f]{6}$/i.test(candidate.primaryColor) ? candidate.primaryColor : DEFAULT_SETTINGS.primaryColor
    };
}

function parseLocalDate(value) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function applySettings() {
    appTitle.textContent = settings.planName;
    document.title = settings.planName;
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.dataset.fontSize = settings.fontSize;
    document.documentElement.style.setProperty('--primary', settings.primaryColor);
    document.documentElement.style.setProperty('--on-primary', getContrastColor(settings.primaryColor));
    planStartDate = parseLocalDate(settings.startDate);
}

function getContrastColor(hexColor) {
    const red = Number.parseInt(hexColor.slice(1, 3), 16);
    const green = Number.parseInt(hexColor.slice(3, 5), 16);
    const blue = Number.parseInt(hexColor.slice(5, 7), 16);
    const luminance = (red * 299 + green * 587 + blue * 114) / 1000;
    return luminance > 150 ? '#172033' : '#ffffff';
}

function populateSettingsForm() {
    planNameInput.value = settings.planName;
    planStartDateInput.value = settings.startDate;
    themeSelect.value = settings.theme;
    fontSizeSelect.value = settings.fontSize;
    primaryColorInput.value = settings.primaryColor;
    primaryColorValue.value = settings.primaryColor.toUpperCase();
}

function openSettings() {
    populateSettingsForm();
    if (typeof settingsDialog.showModal === 'function') settingsDialog.showModal();
    else settingsDialog.setAttribute('open', '');
}

function closeSettings() {
    if (typeof settingsDialog.close === 'function') settingsDialog.close();
    else settingsDialog.removeAttribute('open');
}

function saveSettings(event) {
    event.preventDefault();
    settings = sanitizeSettings({
        planName: planNameInput.value.trim(),
        startDate: planStartDateInput.value,
        theme: themeSelect.value,
        fontSize: fontSizeSelect.value,
        primaryColor: primaryColorInput.value
    });
    try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
        console.warn('Le impostazioni verranno applicate, ma non possono essere salvate:', error);
    }
    applySettings();
    closeSettings();
    renderPage();
}

function resetSettings() {
    settings = { ...DEFAULT_SETTINGS };
    try {
        localStorage.removeItem(SETTINGS_STORAGE_KEY);
    } catch (error) {
        console.warn('Impossibile eliminare le impostazioni salvate:', error);
    }
    applySettings();
    populateSettingsForm();
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

previousButton.addEventListener('click', () => moveToDay(viewMode === 'week' ? -7 : -1));
nextButton.addEventListener('click', () => moveToDay(viewMode === 'week' ? 7 : 1));
todayButton.addEventListener('click', () => {
    selectDate(new Date());
});
dayViewButton.addEventListener('click', () => setViewMode('day'));
weekViewButton.addEventListener('click', () => setViewMode('week'));
searchToggle.addEventListener('click', () => toggleSearch());
closeSearchButton.addEventListener('click', () => toggleSearch(false));
searchInput.addEventListener('input', () => searchMeals(searchInput.value));
settingsToggle.addEventListener('click', openSettings);
closeSettingsButton.addEventListener('click', closeSettings);
settingsForm.addEventListener('submit', saveSettings);
resetSettingsButton.addEventListener('click', resetSettings);
primaryColorInput.addEventListener('input', () => {
    primaryColorValue.value = primaryColorInput.value.toUpperCase();
});
settingsDialog.addEventListener('click', (event) => {
    if (event.target === settingsDialog) closeSettings();
});

document.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || isInteractiveElement(event.target)) return;

    if (event.key === 'ArrowLeft') {
        event.preventDefault();
        moveToDay(viewMode === 'week' ? -7 : -1);
    } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        moveToDay(viewMode === 'week' ? 7 : 1);
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
    if (isHorizontalSwipe) {
        const step = viewMode === 'week' ? 7 : 1;
        moveToDay(deltaX < 0 ? step : -step);
    }
}

function cancelPointerGesture() {
    pointerStart = null;
    mealPlanDisplay.classList.remove('is-dragging');
}

applySettings();
loadDietPlan();
