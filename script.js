const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const taskDate = document.getElementById("taskDate");
// const taskDateInput = document.getElementById("taskDateInput");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentFilter = "all"; // Default filter

renderTaskList();

function renderTaskList(){
    taskList.innerHTML = ""; // Clear the list before re-rendering  

    const filteredTasks = tasks.filter(task => {
        // Filter tasks based on the current filter
        return(
            currentFilter === "all" ||
            (currentFilter === "completed" && task.done) ||
            (currentFilter === "pending" && !task.done)
        );
    });

    // Sorting filtered tasks by due date (nulls go last)
    const sortedTasks = filteredTasks.sort((a, b) => {
        if(!a.due && !b.due) return 0; // Both are null
        if(!a.due) return 1; // a is null, b is not
        if(!b.due) return -1; // b is null, a is not
        return a.due.localeCompare(b.due); // Compare dates
    });

    // Render each sorted + filtered task
    sortedTasks.forEach(task => {
        renderTask(task); // Call the renderTask function for each task
    });
}

// Render saved tasks
// tasks.forEach(renderTask);

taskForm.addEventListener("submit", function(e) {
    e.preventDefault();
    const taskText = taskInput.value.trim();
    if(taskText !== ""){
        const task = {
            text: taskInput.value.trim(), // Get the trimmed value from the input field 
            done:false, 
            due: document.getElementById("taskDate").value || null // Get the due date from the input field
        };
        tasks.push(task);
        saveTasks();
        renderTaskList(); // Re-render the task list
        // renderTask(task);
        taskInput.value = ""; // Clear input field
        taskDate.value = ""; // Clear date field
        console.log("Task created", task); // Log the task object for debugging
    }
});

function renderTask(task){
    const li = document.createElement("li");
    li.className = task.done ? "completed" : "";

    const span = document.createElement("span");
    span.innerText = task.text;

    if(task.due){
        const dateSpan = document.createElement("span");
        dateSpan.innerText = `(Due: ${task.due})`;
        dateSpan.style.marginLeft = "10px"; // Add some space between text and date

        const today = new Date().toISOString().split("T")[0]; // Get YYYY-MM-DD format
        if(task.due < today && !task.done){
            // Overdue task
            dateSpan.style.color = "red"; // Change color to red for overdue tasks
            dateSpan.style.fontWeight = "bold"; // Make it bold
            // dateSpan.style.textDecoration = "underline"; // Underline the overdue date
        }

        span.appendChild(dateSpan); // Append date span to the task text span
    }

    span.style.flex = "1"; // Allow span to grow and take available space
    span.addEventListener("click", function(){
        task.done = !task.done; // Toggle done status
        li.classList.toggle("completed");
        saveTasks(); // Save updated tasks to local storage
        renderTaskList(); // Re-render the task list
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.innerText = "❌";
    deleteBtn.addEventListener("click", function(){
        tasks = tasks.filter(t => t !== task);
        // li.remove();
        saveTasks();
        renderTaskList(); // Re-render the task list
    });

    const editBtn = document.createElement("button");
    editBtn.innerText = "✏️";
    editBtn.addEventListener("click", function(){
        const input = document.createElement("input");
        input.type = "text";
        input.value = task.text;
        input.style.flex = "1"; // Allow input to grow and take available space
        li.replaceChild(input, span); // Replace span with input
        input.focus(); // Focus on the input field

        // Save when user presses Enter or clicks away
        input.addEventListener("blur", saveEdit);
        input.addEventListener("keydown", function(e){
            if(e.key === "Enter"){
                input.blur(); // Trigger blur event to save
            }
        });

        function saveEdit(){
            const newText = input.value.trim();
            if (newText){
                task.text = newText; // Update task text
                saveTasks(); // Save updated tasks to local storage
                renderTaskList(); // Re-render the task list
            }else{
                // If input is empty, don't chnage it
                renderTaskList();
            }
        }
    });

    li.appendChild(span);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);
    taskList.appendChild(li);
}

function saveTasks(){
    localStorage.setItem("tasks", JSON.stringify(tasks));
    // taskList.innerHTML = ""; // Clear the list before re-rendering
}

document.getElementById("clearAllBtn").addEventListener("click", function(){
    if(confirm("Are you sure you want to clear all tasks?")){
        tasks = []; // Clear the tasks array
        saveTasks(); // Save to local storage
        taskList.innerHTML = ""; // Clear the displayed list
    }
});

document.querySelectorAll("#filters button").forEach(button =>{
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter; // Get the filter from the button's data attribute
        renderTaskList(); // Re-render the task list based on the selected filter
    });
});

const themeToggle = document.getElementById("themeToggle");

// Load saved theme from local storage
if(localStorage.getItem("theme") === "dark"){
    document.body.classList.add("dark");
    themeToggle.innetText = "☀️ Light Mode";
}

themeToggle.addEventListener("click", ()=>{
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    themeToggle.innerText = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
});


const countdownContainer = document.getElementById("countdownContainer");
function updateCountdown(){
    const now = new Date();
    const upcomingTasks = tasks
    .filter(task => task.due && !task.done)
    .sort((a, b) => a.due.localeCompare(b.due));

    if(upcomingTasks.length === 0){
        countdownContainer.innerText = "🎉 No upcoming tasks. You're all caught up!";
        countdownContainer.classList.remove("blink"); // Remove blinking class if no tasks are due
        return;
    }

    const nextDue = new Date(upcomingTasks[0].due);
    const diffMs = nextDue - now;

    if(diffMs <= 0){
        countdownContainer.innerText = `⚠️ "${upcomingTasks[0].text}" is overdue!`;
        countdownContainer.classList.add("blink"); // Add blinking class for overdue tasks
        return;
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    countdownContainer.innerText = `⏳ Next: "${upcomingTasks[0].text}" due in ${hours}h ${minutes}m ${seconds}s`; 

    // Blink if due within 10 minutes
    if(diffMs < 10 * 60 * 1000){
        countdownContainer.classList.add("blink"); // Add blinking class for tasks due within 10 minutes
    }else{
        countdownContainer.classList.remove("blink"); // Remove blinking class if not due soon

    }

    console.log("⏳ Countdown running..."); // Log the countdown message for debugging
    if(!Array.isArray(tasks)){
        console.warn("Task is not an array or not yet loaded"); // Log a warning if tasks is not an array
    }

}

setInterval(updateCountdown, 1000); // Update countdown every second
updateCountdown(); // Initial call to set the countdown immediately

console.log("Due date:", tasks.map(t => t.due)); // Log the due date of the tasks for debugging