const API_URL = "https://task-backend-936t.onrender.com/tasks";

let currentFilter = "all";
let tasks = [];

// ✅ ADD TASK (BACKEND)
function addTask() {
  const title = document.getElementById("taskTitle").value;
  const createdDate = document.getElementById("startDate").value;
  const dueDate = document.getElementById("dueDate").value;
  const subTasks = document.getElementById("subTasks").value;
  const priority = document.getElementById("priority").value;

  if (!title || !createdDate || !dueDate) {
    alert("Please fill all required fields");
    return;
  }

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      createdDate,
      dueDate,
      subTasks,
      priority
    })
  })
    .then(res => res.json())
    .then(() => {
      clearForm();
      currentFilter = "all";   // 🔥 ensure visibility
      getTasks();              // 🔥 reload list
    })
    .catch(err => console.error("Add task error:", err));
}

// ✅ GET TASKS
function getTasks() {
  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      tasks = data;
      renderTasks();
      scrollToTasks();
    })
    .catch(err => console.error("Fetch error:", err));
}

// ✅ RENDER TASKS
function renderTasks() {
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = "";

  let filtered = tasks;
  if (currentFilter === "completed") filtered = tasks.filter(t => t.status === "completed");
  if (currentFilter === "pending") filtered = tasks.filter(t => t.status !== "completed");

  filtered.forEach(task => {
    const div = document.createElement("div");
    div.className = "card task-card";
    div.innerHTML = `
      <h3>${task.title}</h3>
      <p>Created: ${task.createdDate}</p>
      <p>Due: ${task.dueDate}</p>
      <p>Priority: ${task.priority}</p>
      <p>Status: ${task.status || "pending"}</p>
    `;
    taskList.appendChild(div);
  });
}

// ✅ FILTER
function setFilter(type) {
  currentFilter = type;
  renderTasks();
}

// ✅ CLEAR FORM
function clearForm() {
  document.getElementById("taskTitle").value = "";
  document.getElementById("startDate").value = "";
  document.getElementById("dueDate").value = "";
  document.getElementById("subTasks").value = "";
}

// ✅ SCROLL
function scrollToTasks() {
  document.getElementById("taskList")
    .scrollIntoView({ behavior: "smooth" });
}

function markCompleted(id) {
  fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "Completed" })
  })
  .then(() => getTasks());
}

function deleteTask(id) {
  if (!confirm("Delete this task?")) return;

  fetch(`${API_URL}/${id}`, {
    method: "DELETE"
  })
  .then(() => getTasks());
}


// 🔥 LOAD TASKS ON PAGE LOAD
getTasks();
