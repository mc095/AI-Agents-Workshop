// API Configuration
const API_URL = 'http://localhost:8000';

// State variables
let tasks = [];
let currentFilter = 'all';
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

// Sample songs data
const songs = [
    {
        title: "Blinding Lights",
        artist: "The Weeknd",
        embed: "https://open.spotify.com/embed/track/0VjIjW4GlUZAMYd2vXMi3b"
    },
    {
        title: "Levitating",
        artist: "Dua Lipa",
        embed: "https://open.spotify.com/embed/track/39LLxExYz6ewLAcYrzQQyP"
    },
    {
        title: "Stay",
        artist: "The Kid LAROI, Justin Bieber",
        embed: "https://open.spotify.com/embed/track/5HCyWlXZPP0y6Gqq8TgA20"
    },
    {
        title: "All the Stars",
        artist: "SZA",
        embed: "https://open.spotify.com/embed/track/3GCdLUSnKSMJhs4Tj6CV3s"
    },
    {
        title: "Fortnight",
        artist: "Taylor Swift & Post Malone",
        embed: "https://open.spotify.com/embed/track/2OzhQlSqBEmt7hmkYxfT6m"
    }
];

// Predefined images for gallery
const images = [
    {
        src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
        alt: "Beach"
    },
    {
        src: "https://images.unsplash.com/photo-1519046904884-53103b34b206",
        alt: "Ocean"
    },
    {
        src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05",
        alt: "Forest"
    },
    {
        src: "https://images.unsplash.com/photo-1519681393784-d120267933ba",
        alt: "Snowy Peak"
    }
];

async function fetchWeatherData() {
    try {
        // Hardcoded coordinates for Bhimavaram, India
        const latitude = 16.8073;
        const longitude = 81.5316;

        // Fetch weather data with explicit current parameters
        console.log('Fetching weather data...');
        const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode&timezone=Asia%2FKolkata`
        );

        console.log('Weather API status:', weatherResponse.status);

        if (!weatherResponse.ok) {
            throw new Error(`Weather API error! Status: ${weatherResponse.status}`);
        }

        const weatherData = await weatherResponse.json();
        console.log('Weather API response:', weatherData);

        // Check for current data
        if (!weatherData.current || typeof weatherData.current.temperature_2m !== 'number') {
            throw new Error('Invalid weather data: Missing temperature_2m');
        }

        // Handle missing weathercode gracefully
        const weatherCode = weatherData.current.weathercode !== undefined ? weatherData.current.weathercode : 0; // Default to 0 (Clear sky) if missing
        const weatherInfo = {
            temp: `${Math.round(weatherData.current.temperature_2m)}°C`,
            desc: getWeatherDescription(weatherCode),
            emoji: getWeatherEmoji(weatherCode)
        };

        // Verify DOM elements
        const weatherTemp = document.getElementById('weatherTemp');
        const weatherDesc = document.getElementById('weatherDesc');
        const weatherEmoji = document.getElementById('weatherEmoji');

        if (!weatherTemp || !weatherDesc || !weatherEmoji) {
            throw new Error('DOM elements for weather display not found');
        }

        // Update DOM
        weatherTemp.textContent = weatherInfo.temp;
        weatherDesc.textContent = weatherInfo.desc;
        weatherEmoji.textContent = weatherInfo.emoji;

        console.log('Weather updated successfully:', weatherInfo);
    } catch (error) {
        console.error('Error fetching weather data:', error.message, error.stack);
        // Update DOM with fallback values
        const weatherTemp = document.getElementById('weatherTemp');
        const weatherDesc = document.getElementById('weatherDesc');
        const weatherEmoji = document.getElementById('weatherEmoji');
        if (weatherTemp) weatherTemp.textContent = 'N/A';
        if (weatherDesc) weatherDesc.textContent = 'Unable to fetch weather';
        if (weatherEmoji) weatherEmoji.textContent = '🌡️';
    }
}

// Helper function to map WMO weather codes to descriptions
function getWeatherDescription(weatherCode) {
    const wmoCodes = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Fog',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        61: 'Light rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        71: 'Light snow',
        73: 'Moderate snow',
        75: 'Heavy snow',
        80: 'Light showers',
        81: 'Moderate showers',
        82: 'Heavy showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with light hail',
        99: 'Thunderstorm with heavy hail'
    };
    return wmoCodes[weatherCode] || 'Unknown';
}

// Helper function to map WMO weather codes to emojis
function getWeatherEmoji(weatherCode) {
    if (weatherCode === 0) return '☀️';
    if ([1, 2].includes(weatherCode)) return '🌤️';
    if (weatherCode === 3) return '☁️';
    if ([45, 48].includes(weatherCode)) return '🌫️';
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weatherCode)) return '🌧️';
    if ([71, 73, 75].includes(weatherCode)) return '❄️';
    if ([95, 96, 99].includes(weatherCode)) return '⛈️';
    return '🌤️';
}

// Update stats display
function updateStats() {
    const completedTasks = tasks.filter(task => task.status).length;
    const activeTasks = tasks.filter(task => !task.status).length;
    document.getElementById('completedTasks').textContent = completedTasks;
    document.getElementById('activeTasks').textContent = activeTasks;
}

// Initialize habits
let habits = [];
function loadHabits() {
    const savedHabits = localStorage.getItem('dashboardHabits');
    if (savedHabits) {
        habits = JSON.parse(savedHabits);
    } else {
        habits = [
            { id: 1, name: 'Morning Walk', time: '5:00 AM - 5:30 AM', completed: false },
            { id: 2, name: 'Read 20 Pages', time: 'Before bed', completed: false },
            { id: 3, name: 'Meditate', time: '10 minutes', completed: false }
        ];
    }
    renderHabits();
}

function saveHabits() {
    localStorage.setItem('dashboardHabits', JSON.stringify(habits));
}

function renderHabits() {
    const habitsList = document.getElementById('habitsList');
    habitsList.innerHTML = habits.map(habit => `
        <div class="flex justify-between items-center p-2 bg-white rounded-lg shadow-sm">
            <div>
                <div class="text-sm font-medium">${escapeHtml(habit.name)}</div>
                <div class="text-xs text-gray-500">${escapeHtml(habit.time)}</div>
            </div>
            <div class="flex space-x-1">
                <button onclick="toggleHabitStatus(${habit.id})" class="w-5 h-5 rounded-full ${habit.completed ? 'bg-green-100 text-green-500' : 'bg-gray-100 text-gray-500'} flex items-center justify-center">
                    <i class="fas fa-check text-xs"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function toggleHabitForm() {
    const habitForm = document.getElementById('editHabitsForm');
    habitForm.classList.toggle('hidden');
    if (!habitForm.classList.contains('hidden')) {
        document.getElementById('habit1Name').value = habits[0]?.name || '';
        document.getElementById('habit1Time').value = habits[0]?.time || '';
        document.getElementById('habit2Name').value = habits[1]?.name || '';
        document.getElementById('habit2Time').value = habits[1]?.time || '';
        document.getElementById('habit3Name').value = habits[2]?.name || '';
        document.getElementById('habit3Time').value = habits[2]?.time || '';
        document.getElementById('habit1Name').focus();
    }
}

function saveHabitsForm() {
    const newHabits = [
        {
            id: 1,
            name: document.getElementById('habit1Name').value.trim(),
            time: document.getElementById('habit1Time').value.trim(),
            completed: habits[0]?.completed || false
        },
        {
            id: 2,
            name: document.getElementById('habit2Name').value.trim(),
            time: document.getElementById('habit2Time').value.trim(),
            completed: habits[1]?.completed || false
        },
        {
            id: 3,
            name: document.getElementById('habit3Name').value.trim(),
            time: document.getElementById('habit3Time').value.trim(),
            completed: habits[2]?.completed || false
        }
    ].filter(habit => habit.name); // Only include habits with a name
    if (newHabits.length > 3) {
        alert('You can only save up to 3 habits.');
        return;
    }
    habits = newHabits;
    saveHabits();
    renderHabits();
    toggleHabitForm();
}

function toggleHabitStatus(habitId) {
    const habit = habits.find(h => h.id === habitId);
    if (habit) {
        habit.completed = !habit.completed;
        saveHabits();
        renderHabits();
    }
}

// Image gallery cycling
let currentImageIndex = 0;
function refreshImages() {
    const imageElements = [
        document.getElementById('galleryImage1'),
        document.getElementById('galleryImage2'),
        document.getElementById('galleryImage3')
    ];
    for (let i = 0; i < 3; i++) {
        const index = (currentImageIndex + i) % images.length;
        imageElements[i].src = images[index].src;
        imageElements[i].alt = images[index].alt;
    }
    currentImageIndex = (currentImageIndex + 3) % images.length;
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('addTaskBtn').addEventListener('click', toggleAddTaskForm);
    document.getElementById('saveTaskBtn').addEventListener('click', addTask);
    document.getElementById('cancelTaskBtn').addEventListener('click', toggleAddTaskForm);
    document.getElementById('filterAll').addEventListener('click', () => filterTasks('all'));
    document.getElementById('filterActive').addEventListener('click', () => filterTasks('active'));
    document.getElementById('filterCompleted').addEventListener('click', () => filterTasks('completed'));
    document.getElementById('prevMonth').addEventListener('click', prevMonth);
    document.getElementById('nextMonth').addEventListener('click', nextMonth);
    document.getElementById('changeSongBtn').addEventListener('click', changeFavoriteSong);
    document.getElementById('refreshImagesBtn').addEventListener('click', refreshImages);
    document.getElementById('saveNotesBtn').addEventListener('click', saveNotes);
    document.getElementById('clearNotesBtn').addEventListener('click', clearNotes);
    document.getElementById('editHabitsBtn').addEventListener('click', toggleHabitForm);
    document.getElementById('saveHabitsBtn').addEventListener('click', saveHabitsForm);
    document.getElementById('cancelHabitsBtn').addEventListener('click', toggleHabitForm);
    document.getElementById('notesTextarea').addEventListener('input', function () {
        document.getElementById('charCount').textContent = this.value.length;
    });
    loadTasks();
    renderCalendar(currentMonth, currentYear);
    loadNotes();
    loadHabits();
    fetchWeatherData();
    refreshImages();
});

// Load saved notes from localStorage
function loadNotes() {
    const savedNotes = localStorage.getItem('dashboardNotes');
    if (savedNotes) {
        document.getElementById('notesTextarea').value = savedNotes;
        document.getElementById('charCount').textContent = savedNotes.length;
    }
}

// Save notes to localStorage
function saveNotes() {
    const notes = document.getElementById('notesTextarea').value;
    localStorage.setItem('dashboardNotes', notes);
    alert('Notes saved!');
}

// Clear notes
function clearNotes() {
    if (confirm('Are you sure you want to clear your notes?')) {
        document.getElementById('notesTextarea').value = '';
        document.getElementById('charCount').textContent = '0';
        localStorage.removeItem('dashboardNotes');
    }
}

// Change favorite song
function changeFavoriteSong() {
    const randomSong = songs[Math.floor(Math.random() * songs.length)];
    document.getElementById('songTitle').textContent = randomSong.title;
    document.getElementById('songArtist').textContent = randomSong.artist;
    document.getElementById('songEmbed').src = randomSong.embed;
}

// Load tasks from the API
async function loadTasks() {
    try {
        const response = await fetch(`${API_URL}/`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (Array.isArray(data)) {
            tasks = data;
        } else if (data && Array.isArray(data.tasks)) {
            tasks = data.tasks;
        } else {
            throw new Error('Unexpected response format from server');
        }
        filterTasks(currentFilter);
        updateStats();
    } catch (error) {
        console.error('Error loading tasks:', error);
        alert('Could not load tasks. Please try again later.');
        tasks = [];
        filterTasks(currentFilter);
    }
}

// Display tasks based on the current filter
function filterTasks(filter) {
    currentFilter = filter;
    const filterAllBtn = document.getElementById('filterAll');
    const filterActiveBtn = document.getElementById('filterActive');
    const filterCompletedBtn = document.getElementById('filterCompleted');
    filterAllBtn.classList.remove('bg-primary-100', 'text-primary-600');
    filterActiveBtn.classList.remove('bg-primary-100', 'text-primary-600');
    filterCompletedBtn.classList.remove('bg-primary-100', 'text-primary-600');
    if (filter === 'all') {
        filterAllBtn.classList.add('bg-primary-100', 'text-primary-600');
    } else if (filter === 'active') {
        filterActiveBtn.classList.add('bg-primary-100', 'text-primary-600');
    } else {
        filterCompletedBtn.classList.add('bg-primary-100', 'text-primary-600');
    }
    let filteredTasks = tasks;
    if (filter === 'active') {
        filteredTasks = tasks.filter(task => !task.status);
    } else if (filter === 'completed') {
        filteredTasks = tasks.filter(task => task.status);
    }
    renderTasks(filteredTasks);
}

// Render tasks to the DOM
function renderTasks(tasksToRender) {
    const tasksList = document.getElementById('tasksList');
    if (tasksToRender.length === 0) {
        tasksList.innerHTML = `
            <div class="text-center py-8">
                <div class="text-gray-300 mb-4">
                    <i class="fas fa-clipboard-list text-4xl"></i>
                </div>
                <p class="text-gray-500">No tasks found</p>
                <p class="text-sm text-gray-400 mt-1">Add a new task to get started</p>
            </div>
        `;
        return;
    }
    tasksList.innerHTML = tasksToRender.map(task => `
        <div class="task-card bg-white p-4 rounded-xl shadow-sm border border-gray-100 ${task.status ? 'opacity-70' : ''}">
            <div class="flex items-start">
                <button onclick="toggleTaskStatus(${task.id})" class="flex-shrink-0 mr-3">
                    <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center
                                ${task.status ? 'bg-green-500 border-green-500' : 'border-gray-300'}">
                        ${task.status ? '<i class="fas fa-check text-white text-xs"></i>' : ''}
                    </div>
                </button>
                <div class="flex-1">
                    <input type="text" value="${escapeHtml(task.name)}"
                           onchange="updateTask(${task.id}, 'name', this.value)"
                           class="w-full text-gray-800 font-medium bg-transparent focus:outline-none focus:ring-1 focus:ring-primary-500 rounded px-1 ${task.status ? 'line-through' : ''}">
                    ${task.description ? `<textarea onchange="updateTask(${task.id}, 'description', this.value)"
                                      class="w-full text-gray-600 text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-primary-500 rounded px-1 mt-1 resize-none ${task.status ? 'line-through' : ''}"
                                      rows="1">${escapeHtml(task.description)}</textarea>` : ''}
                </div>
                <button onclick="deleteTask(${task.id})" class="text-gray-400 hover:text-red-500 ml-2">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Toggle the add task form
function toggleAddTaskForm() {
    const addTaskForm = document.getElementById('addTaskForm');
    addTaskForm.classList.toggle('hidden');
    if (!addTaskForm.classList.contains('hidden')) {
        document.getElementById('taskName').focus();
    }
}

// Add a new task
async function addTask() {
    const taskNameInput = document.getElementById('taskName');
    const taskDescriptionInput = document.getElementById('taskDescription');
    const name = taskNameInput.value.trim();
    const description = taskDescriptionInput.value.trim();
    if (!name) {
        alert('Please enter a task name');
        return;
    }
    try {
        const tempId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
        const newTask = {
            id: tempId,
            name: name,
            description: description,
            status: false
        };
        const response = await fetch(`${API_URL}/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newTask)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        taskNameInput.value = '';
        taskDescriptionInput.value = '';
        toggleAddTaskForm();
        await loadTasks();
        const newTaskElement = document.querySelector('.task-card:last-child');
        if (newTaskElement) {
            newTaskElement.scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Error adding task:', error);
        alert('Could not add task: ' + error.message);
    }
}

// Update a task
async function updateTask(taskId, field, value) {
    try {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        const updatedTask = { ...task, [field]: value };
        const response = await fetch(`${API_URL}/update/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedTask)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        await loadTasks();
    } catch (error) {
        console.error('Error updating task:', error);
        alert('Could not update task: ' + error.message);
        loadTasks();
    }
}

// Toggle task status
async function toggleTaskStatus(taskId) {
    try {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        const updatedTask = { ...task, status: !task.status };
        const response = await fetch(`${API_URL}/update/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedTask)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        await loadTasks();
    } catch (error) {
        console.error('Error toggling task status:', error);
        alert('Could not toggle task status: ' + error.message);
        loadTasks();
    }
}

// Delete a task
async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
        const response = await fetch(`${API_URL}/delete/${taskId}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        await loadTasks();
    } catch (error) {
        console.error('Error deleting task:', error);
        alert('Could not delete task: ' + error.message);
    }
}

// Go to previous month
function prevMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar(currentMonth, currentYear);
}

// Go to next month
function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar(currentMonth, currentYear);
}

// Render calendar
function renderCalendar(month, year) {
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    document.getElementById('currentMonthYear').textContent = `${monthNames[month]} ${year}`;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    let calendarHTML = '';
    for (let i = 0; i < firstDay; i++) {
        const day = daysInPrevMonth - firstDay + i + 1;
        calendarHTML += `<div class="h-8 text-center text-gray-300 text-sm">${day}</div>`;
    }
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
        const isToday = i === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        const hasTasks = tasks.some(task => false);
        calendarHTML += `
            <div class="h-8 flex items-center justify-center text-sm rounded-full
                        ${isToday ? 'bg-primary-500 text-white font-medium' : ''}
                        ${hasTasks ? 'bg-primary-100' : ''}">
                ${i}
            </div>
        `;
    }
    const totalCells = firstDay + daysInMonth;
    const remainingCells = totalCells > 35 ? 42 - totalCells : 35 - totalCells;
    for (let i = 1; i <= remainingCells; i++) {
        calendarHTML += `<div class="h-8 text-center text-gray-300 text-sm">${i}</div>`;
    }
    document.getElementById('calendarDays').innerHTML = calendarHTML;
}

// Helper function to escape HTML
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}