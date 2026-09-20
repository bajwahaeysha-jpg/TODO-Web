/* =========================================================
   TaskFlow — simple to-do dashboard
   Everything is saved in the browser's localStorage.
   No server, no database — just plain JavaScript.
   ========================================================= */

/* ---------- small helpers to read/write localStorage ---------- */

function getUsers() {
  const raw = localStorage.getItem("tf_users");
  return raw ? JSON.parse(raw) : [];
}

function saveUsers(users) {
  localStorage.setItem("tf_users", JSON.stringify(users));
}

function getCurrentUsername() {
  return localStorage.getItem("tf_current_user");
}

function setCurrentUsername(username) {
  localStorage.setItem("tf_current_user", username);
}

function clearCurrentUsername() {
  localStorage.removeItem("tf_current_user");
}

function getTasks(username) {
  const raw = localStorage.getItem("tf_tasks_" + username);
  return raw ? JSON.parse(raw) : [];
}

function saveTasks(username, tasks) {
  localStorage.setItem("tf_tasks_" + username, JSON.stringify(tasks));
}

function todayStr() {
  const d = new Date();
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

function pad(n) { return n.toString().padStart(2, "0"); }

/* ---------- toast notifications ---------- */

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 2200);
}

/* =========================================================
   AUTH: sign up, log in, log out
   ========================================================= */

function initAuth() {
  const users = getUsers();
  const authScreen = document.getElementById("authScreen");
  const signupForm = document.getElementById("signupForm");
  const loginForm = document.getElementById("loginForm");

  // If someone is already logged in, skip straight to the app.
  const current = getCurrentUsername();
  if (current && users.some(u => u.username === current)) {
    showApp();
    return;
  }

  authScreen.classList.remove("hidden");
  document.getElementById("mainApp").classList.add("hidden");

  // First time ever (no accounts yet) -> show the "create account" form.
  // Otherwise -> show the login form by default.
  if (users.length === 0) {
    signupForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
  } else {
    signupForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
  }
}

document.getElementById("toLogin").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("signupForm").classList.add("hidden");
  document.getElementById("loginForm").classList.remove("hidden");
});

document.getElementById("toSignup").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("loginForm").classList.add("hidden");
  document.getElementById("signupForm").classList.remove("hidden");
});

document.getElementById("signupForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("suName").value.trim();
  const username = document.getElementById("suUsername").value.trim();
  const email = document.getElementById("suEmail").value.trim();
  const password = document.getElementById("suPassword").value;
  const errorEl = document.getElementById("suError");

  if (!name || !username || !password) {
    errorEl.textContent = "Please fill in your name, username and password.";
    return;
  }

  const users = getUsers();
  if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    errorEl.textContent = "That username is already taken. Try another.";
    return;
  }

  users.push({ name, username, email, password });
  saveUsers(users);
  saveTasks(username, []); // start with an empty task list
  setCurrentUsername(username);

  errorEl.textContent = "";
  showToast("Welcome, " + name + "! Your account is ready.");
  showApp();
});

document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const username = document.getElementById("liUsername").value.trim();
  const password = document.getElementById("liPassword").value;
  const errorEl = document.getElementById("liError");

  const users = getUsers();
  const match = users.find(u => u.username === username && u.password === password);

  if (!match) {
    errorEl.textContent = "Username or password is incorrect.";
    return;
  }

  errorEl.textContent = "";
  setCurrentUsername(username);
  showToast("Welcome back, " + match.name + "!");
  showApp();
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  clearCurrentUsername();
  document.getElementById("liUsername").value = "";
  document.getElementById("liPassword").value = "";
  initAuth();
});

/* =========================================================
   APP STATE
   ========================================================= */

let currentTab = "today";           // home page tab: today / upcoming / completed
let calendarViewDate = new Date();  // month currently shown on the calendar
let selectedCalendarDate = todayStr();

function currentUser() {
  const username = getCurrentUsername();
  return getUsers().find(u => u.username === username);
}

function showApp() {
  document.getElementById("authScreen").classList.add("hidden");
  document.getElementById("mainApp").classList.remove("hidden");

  const user = currentUser();
  if (!user) { initAuth(); return; }

  fillGreeting(user);
  fillProfileForm(user);
  renderHome();
  renderCalendar();
  renderStats();
}

/* =========================================================
   NAVIGATION between pages (Home / Calendar / Stats / Profile)
   ========================================================= */

document.querySelectorAll(".nav-btn, .quick-btn").forEach(btn => {
  btn.addEventListener("click", () => goToPage(btn.dataset.page));
});

function goToPage(pageName) {
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  document.getElementById("page-" + pageName).classList.remove("hidden");

  document.querySelectorAll(".nav-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.page === pageName);
  });

  if (pageName === "calendar") renderCalendar();
  if (pageName === "stats") renderStats();
}

/* =========================================================
   HOME PAGE — greeting + task list
   ========================================================= */

function fillGreeting(user) {
  const hour = new Date().getHours();
  const label = hour < 12 ? "Good Morning," : hour < 18 ? "Good Afternoon," : "Good Evening,";
  document.getElementById("greetingLabel").textContent = label;
  document.getElementById("greetingName").textContent = user.name.split(" ")[0];
}

document.getElementById("addTaskBtn").addEventListener("click", addTask);
document.getElementById("newTaskText").addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTask();
});

function addTask() {
  const textInput = document.getElementById("newTaskText");
  const text = textInput.value.trim();
  if (!text) return;

  const category = document.getElementById("newTaskCategory").value;
  const priority = document.getElementById("newTaskPriority").value;
  const time = document.getElementById("newTaskTime").value;

  const username = getCurrentUsername();
  const tasks = getTasks(username);

  tasks.push({
    id: Date.now(),
    text,
    category,
    priority,
    time,
    date: selectedCalendarDate || todayStr(),
    done: false,
    createdAt: todayStr()
  });

  saveTasks(username, tasks);
  textInput.value = "";
  document.getElementById("newTaskTime").value = "";

  renderHome();
  renderStats();
  showToast("Task added!");
}

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    currentTab = btn.dataset.tab;
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderHome();
  });
});

function renderHome() {
  const username = getCurrentUsername();
  const tasks = getTasks(username);
  const today = todayStr();

  let visible;
  if (currentTab === "today") {
    visible = tasks.filter(t => t.date === today);
  } else if (currentTab === "upcoming") {
    visible = tasks.filter(t => t.date > today);
  } else {
    visible = tasks.filter(t => t.done);
  }

  renderTaskList(document.getElementById("taskList"), visible);
  document.getElementById("emptyState").classList.toggle("hidden", visible.length > 0);

  // side panel: based on TODAY's tasks only, like the reference dashboard
  const todays = tasks.filter(t => t.date === today);
  const completedToday = todays.filter(t => t.done).length;
  const totalToday = todays.length;
  const percent = totalToday === 0 ? 0 : Math.round((completedToday / totalToday) * 100);

  document.getElementById("progressFraction").textContent = completedToday + " of " + totalToday + " tasks";
  document.getElementById("progressBarFill").style.width = percent + "%";
  document.getElementById("progressPercent").textContent = percent + "%";

  document.getElementById("miniCompleted").textContent = completedToday;
  document.getElementById("miniPending").textContent = totalToday - completedToday;
  document.getElementById("miniTotal").textContent = totalToday;
  document.getElementById("miniHigh").textContent = todays.filter(t => t.priority === "High").length;
}

function renderTaskList(listEl, tasks) {
  listEl.innerHTML = "";
  tasks
    .slice()
    .sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"))
    .forEach(task => {
      const li = document.createElement("li");
      li.className = "task-item" + (task.done ? " done" : "");

      const clockIcon = '<svg class="icon icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>';
      const starIcon = '<svg class="icon icon-inline" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15 9 22 9.5 16.5 14 18.5 21 12 17 5.5 21 7.5 14 2 9.5 9 9"/></svg>';

      li.innerHTML = `
        <button class="task-checkbox" title="Mark done">${task.done ? "✓" : ""}</button>
        <div class="task-body">
          <p class="task-text"></p>
          <div class="task-meta">
            ${task.time ? `<span class="meta-time">${clockIcon} ${task.time}</span>` : ""}
            <span class="tag ${task.category}">${task.category}</span>
            ${task.priority === "High" ? `<span class="priority-flag">${starIcon} High</span>` : ""}
          </div>
        </div>
        <button class="task-delete" title="Delete">✕</button>
      `;

      // set text safely (avoids issues if the task text contains special characters)
      li.querySelector(".task-text").textContent = task.text;

      li.querySelector(".task-checkbox").addEventListener("click", () => toggleTask(task.id));
      li.querySelector(".task-delete").addEventListener("click", () => deleteTask(task.id));

      listEl.appendChild(li);
    });
}

function toggleTask(id) {
  const username = getCurrentUsername();
  const tasks = getTasks(username);
  const task = tasks.find(t => t.id === id);
  if (task) task.done = !task.done;
  saveTasks(username, tasks);
  renderHome();
  renderStats();
  renderCalendar();
}

function deleteTask(id) {
  const username = getCurrentUsername();
  let tasks = getTasks(username);
  tasks = tasks.filter(t => t.id !== id);
  saveTasks(username, tasks);
  renderHome();
  renderStats();
  renderCalendar();
  showToast("Task deleted");
}

/* =========================================================
   CALENDAR PAGE
   ========================================================= */

document.getElementById("prevMonth").addEventListener("click", () => {
  calendarViewDate.setMonth(calendarViewDate.getMonth() - 1);
  renderCalendar();
});

document.getElementById("nextMonth").addEventListener("click", () => {
  calendarViewDate.setMonth(calendarViewDate.getMonth() + 1);
  renderCalendar();
});

function renderCalendar() {
  const grid = document.getElementById("calendarGrid");
  grid.innerHTML = "";

  const year = calendarViewDate.getFullYear();
  const month = calendarViewDate.getMonth();

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  document.getElementById("calendarMonthLabel").textContent = monthNames[month] + " " + year;

  const firstDay = new Date(year, month, 1);
  // Convert Sunday(0)-Saturday(6) into a Monday-first index (0-6)
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const username = getCurrentUsername();
  const tasks = getTasks(username);
  const today = todayStr();

  for (let i = 0; i < startOffset; i++) {
    const filler = document.createElement("div");
    filler.className = "calendar-day empty";
    grid.appendChild(filler);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = year + "-" + pad(month + 1) + "-" + pad(day);
    const hasTasks = tasks.some(t => t.date === dateStr);

    const cell = document.createElement("button");
    cell.className = "calendar-day";
    if (dateStr === today) cell.classList.add("today");
    if (dateStr === selectedCalendarDate) cell.classList.add("selected");

    cell.innerHTML = `<span>${day}</span>` + (hasTasks ? '<span class="dot"></span>' : "");
    cell.addEventListener("click", () => {
      selectedCalendarDate = dateStr;
      renderCalendar();
      renderSelectedDayTasks();
    });

    grid.appendChild(cell);
  }

  renderSelectedDayTasks();
}

function renderSelectedDayTasks() {
  const username = getCurrentUsername();
  const tasks = getTasks(username).filter(t => t.date === selectedCalendarDate);

  const d = new Date(selectedCalendarDate + "T00:00:00");
  document.getElementById("selectedDayLabel").textContent =
    "Tasks for " + d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  renderTaskList(document.getElementById("selectedDayTasks"), tasks);
  document.getElementById("selectedDayEmpty").classList.toggle("hidden", tasks.length > 0);
}

/* =========================================================
   STATS PAGE
   ========================================================= */

function renderStats() {
  const username = getCurrentUsername();
  const tasks = getTasks(username);
  const today = todayStr();

  const completed = tasks.filter(t => t.done).length;
  const created = tasks.length;
  const rate = created === 0 ? 0 : Math.round((completed / created) * 100);
  const pending = tasks.filter(t => !t.done && t.date >= today).length;
  const overdue = tasks.filter(t => !t.done && t.date < today).length;

  document.getElementById("statCompleted").textContent = completed;
  document.getElementById("statCreated").textContent = created;
  document.getElementById("statRate").textContent = rate + "%";
  document.getElementById("statStreak").textContent = calculateStreak(tasks);

  document.getElementById("legendCompleted").textContent = completed;
  document.getElementById("legendPending").textContent = pending;
  document.getElementById("legendOverdue").textContent = overdue;

  drawDonut(completed, pending, overdue);
  drawBarChart(tasks);
}

// Streak = number of consecutive days (counting back from today) that have at least one completed task.
function calculateStreak(tasks) {
  const doneDates = new Set(tasks.filter(t => t.done).map(t => t.date));
  let streak = 0;
  let cursor = new Date();

  while (true) {
    const dateStr = cursor.getFullYear() + "-" + pad(cursor.getMonth() + 1) + "-" + pad(cursor.getDate());
    if (doneDates.has(dateStr)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function drawDonut(completed, pending, overdue) {
  const total = completed + pending + overdue;
  const donut = document.getElementById("donutChart");

  if (total === 0) {
    donut.style.background = "conic-gradient(var(--bg) 0 100%)";
    return;
  }

  const completedPct = (completed / total) * 100;
  const pendingPct = (pending / total) * 100;

  donut.style.background = `conic-gradient(
    var(--green) 0% ${completedPct}%,
    var(--yellow) ${completedPct}% ${completedPct + pendingPct}%,
    var(--red) ${completedPct + pendingPct}% 100%
  )`;
}

function drawBarChart(tasks) {
  const dayNames = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const counts = [0,0,0,0,0,0,0];

  tasks.filter(t => t.done).forEach(t => {
    const d = new Date(t.date + "T00:00:00");
    const index = (d.getDay() + 6) % 7; // Monday-first
    counts[index]++;
  });

  const max = Math.max(1, ...counts);
  const barChart = document.getElementById("barChart");
  barChart.innerHTML = "";

  counts.forEach((count, i) => {
    const col = document.createElement("div");
    col.className = "bar-col";
    const heightPct = (count / max) * 100;
    col.innerHTML = `
      <span class="bar-count">${count}</span>
      <div class="bar-fill ${count === max && count > 0 ? "max" : ""}" style="height:${Math.max(heightPct, 4)}%"></div>
      <span class="bar-label">${dayNames[i]}</span>
    `;
    barChart.appendChild(col);
  });
}

/* =========================================================
   PROFILE PAGE
   ========================================================= */

function fillProfileForm(user) {
  document.getElementById("profileAvatar").textContent = user.name.charAt(0).toUpperCase();
  document.getElementById("pfName").value = user.name;
  document.getElementById("pfUsername").value = user.username;
  document.getElementById("pfEmail").value = user.email || "";
  document.getElementById("pfPassword").value = "";
}

document.getElementById("profileForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const users = getUsers();
  const username = getCurrentUsername();
  const user = users.find(u => u.username === username);
  if (!user) return;

  user.name = document.getElementById("pfName").value.trim() || user.name;
  user.email = document.getElementById("pfEmail").value.trim();

  const newPassword = document.getElementById("pfPassword").value;
  if (newPassword) user.password = newPassword;

  saveUsers(users);
  fillGreeting(user);
  fillProfileForm(user);

  const msg = document.getElementById("pfMessage");
  msg.classList.remove("hidden");
  setTimeout(() => msg.classList.add("hidden"), 2000);
  showToast("Profile updated!");
});

/* =========================================================
   START
   ========================================================= */

initAuth();
