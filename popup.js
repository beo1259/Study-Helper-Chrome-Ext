document.addEventListener('DOMContentLoaded', function () {
    loadTasks();
    checkSessionState();


    document.getElementById('startSessionButton').addEventListener('click', startSession);

    document.getElementById('addTaskButton').addEventListener('click', function () {
        const taskNameInput = document.getElementById('task-name');
        const taskTimeInput = document.getElementById('task-time');
        addTask(taskNameInput.value, taskTimeInput.value);
        taskNameInput.value = '';
        taskTimeInput.value = '';
    });

    document.getElementById('cancelTaskButton').addEventListener('click', function () {
        document.getElementById('task-form').style.display = 'none';
    });

    let timerInterval;

    document.getElementById('stopSessionButton').addEventListener('click', stopSession);

    document.getElementById('savePhoneNumberButton').addEventListener('click', function () {
        const phoneNumber = document.getElementById('user-phone-number').value;
        localStorage.setItem('userPhoneNumber', phoneNumber);
    });

    const savedPhoneNumber = localStorage.getItem('userPhoneNumber');
    if (savedPhoneNumber) {
        document.getElementById('user-phone-number').value = savedPhoneNumber;
        phoneNumber = savedPhoneNumber;
    }

    stopSessionButton.addEventListener('click', function () {
        if (confirm("Are you sure you want to stop the session?")) {
            clearInterval(timerInterval);
            countdownEl.innerHTML = "Session Stopped";
            document.getElementById('stopSessionButton').style.display = 'none';


        }
    });

});

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
        updateTaskList();
    }
    loadCurrentTaskState();
}

function startTask(taskIndex, remainingTime = null) {
    if (taskIndex < tasks.length) {
        const task = tasks[taskIndex];
        const taskTimeMillis = remainingTime !== null ? remainingTime : minutesToMillis(task.time);
        updateCountdownDisplay(task.name, taskTimeMillis);

        saveCurrentTaskState(taskIndex, Date.now(), taskTimeMillis);

        notifyServerStartTask(task.name, taskTimeMillis);

        beginTimer(task.name, taskTimeMillis, function () {
            startTask(taskIndex + 1); 
        });
    } else {
        updateSessionState(false); 
        checkSessionState(); 
        clearCurrentTaskState();
        document.getElementById('countdown').innerHTML = "All tasks completed!";
        document.getElementById('stopSessionButton').style.display = 'none'; 
        document.getElementById('startSessionButton').style.display = 'block'; 
    }
}

function notifyServerStartTask(taskName, duration) {
    const userPhoneNumber = localStorage.getItem('userPhoneNumber');
    if (!userPhoneNumber) {
        console.error('User phone number is not set.');
        return;
    }

    fetch('http://localhost:3000/start-task', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ to: userPhoneNumber, taskName: taskName, duration: duration })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log(`Server started task "${taskName}"`);
            } else {
                console.error('Server failed to start task: ', data.errorMessage);
            }
        })
        .catch((error) => {
            console.error('Error notifying server to start task: ', error);
        });
}


function loadCurrentTaskState() {
    const savedTaskState = localStorage.getItem('currentTaskState');
    if (savedTaskState) {
        const { taskIndex, startTime, duration } = JSON.parse(savedTaskState);
        const timePassed = Date.now() - startTime;
        if (timePassed < duration) {
            const remainingTime = duration - timePassed;
            startTask(taskIndex, remainingTime);
        } else {
            startTask(taskIndex + 1);
        }
    }
}

function checkSessionState() {
    var isSessionActive = localStorage.getItem('isSessionActive') === 'true';

    document.getElementById('startSessionButton').style.display = isSessionActive ? 'none' : 'block';
    document.getElementById('stopSessionButton').style.display = isSessionActive ? 'block' : 'none';
}

let tasks = [];
let intervalId;


function createInputFields() {
    if (document.getElementById('task-form')) return;

    const taskForm = document.createElement('div');
    taskForm.id = 'task-form';

    const taskNameInput = document.createElement('input');
    taskNameInput.type = 'text';
    taskNameInput.id = 'task-name';
    taskNameInput.placeholder = 'Enter Task Name';
    taskForm.appendChild(taskNameInput);

    const taskTimeInput = document.createElement('input');
    taskTimeInput.type = 'number';
    taskTimeInput.id = 'task-time';
    taskTimeInput.placeholder = 'Time Required (minutes)';
    taskForm.appendChild(taskTimeInput);

    const addTaskButton = document.createElement('button');
    addTaskButton.textContent = 'Add Task';
    addTaskButton.addEventListener('click', function () {
        document.getElementById('task-form').style.display = 'block';
        addTask(taskNameInput.value, taskTimeInput.value);
        taskNameInput.value = '';
        taskTimeInput.value = '';
    });
    taskForm.appendChild(addTaskButton)

    const cancelTaskButton = document.createElement('button');
    cancelTaskButton.textContent = 'Cancel';
    cancelTaskButton.addEventListener('click', function () {
        taskForm.remove();
    });
    taskForm.appendChild(cancelTaskButton);

    document.body.appendChild(taskForm);

    console.log(tasks)

    formDisplayed = true;
}

function updateSessionState(isActive) {
    localStorage.setItem('isSessionActive', isActive.toString());
}

function addTask(taskName, taskTime) {
    taskName = taskName.trim();
    taskTime = parseFloat(taskTime.trim(), 10);

    if (taskName && !isNaN(taskTime) && taskTime > 0) {
        tasks.push({ name: taskName, time: taskTime });
        updateTaskList();
    } else {
        console.error("Please enter a valid task name and time.");
    }
    saveTasks();
}

function updateTaskList() {
    const taskListElement = document.getElementById('task-list') || createTaskList();
    taskListElement.innerHTML = '';

    tasks.forEach((task, index) => {
        const taskItem = document.createElement('li');
        taskItem.className = 'task-item';

        const taskNameContainer = document.createElement('span');
        taskNameContainer.className = 'task-name';
        taskNameContainer.textContent = task.name;

        const timeContainer = document.createElement('span');
        timeContainer.textContent = `${task.time} min`;

        const deleteButton = document.createElement('button');
        deleteButton.className = 'button delete';
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', function () {
            deleteTask(index);
            return tasks;
        });

        const moveDownButton = document.createElement('button');
        moveDownButton.className = 'button move';
        moveDownButton.textContent = '↓';
        moveDownButton.addEventListener('click', function () {
            moveTask(index, 1);
            return tasks;
        });

        const moveUpButton = document.createElement('button');
        moveUpButton.className = 'button move';
        moveUpButton.textContent = '↑';
        moveUpButton.addEventListener('click', function () {
            moveTask(index, -1);

            return tasks;
        });

        taskItem.appendChild(taskNameContainer);
        taskItem.appendChild(timeContainer);
        taskItem.appendChild(deleteButton);
        taskItem.appendChild(moveUpButton);
        taskItem.appendChild(moveDownButton);

        taskListElement.appendChild(taskItem);
    });
}


function createTaskList() {
    const taskList = document.createElement('ul');
    taskList.id = 'task-list';
    document.body.appendChild(taskList);
    console.log(tasks);
    saveTasks();
    return taskList;
}


function deleteTask(index) {
    tasks.splice(index, 1);
    updateTaskList();
    saveTasks();
    return tasks;
}

function moveTask(index, direction) {
    if (direction === -1 && index > 0) {
        [tasks[index], tasks[index - 1]] = [tasks[index - 1], tasks[index]];
        updateTaskList();
        saveTasks();
    }
    else if (direction === 1 && index < tasks.length - 1) {
        [tasks[index], tasks[index + 1]] = [tasks[index + 1], tasks[index]];
        updateTaskList();
        saveTasks();
    }
}

function switchTask() {

}

function minutesToMillis(minutes) { // helper
    return milliseconds = minutes * 60000;
}

function startSession() {
    localStorage.setItem('isSessionActive', 'true');
    checkSessionState();

    if (tasks.length < 1) {
        alert("Please input at least one task before starting a study session");
        return;
    }
    document.getElementById('startSessionButton').style.display = 'none';
    document.getElementById('stopSessionButton').style.display = 'block'; 
    startTask(0); 
}

function stopSession() {
    localStorage.setItem('isSessionActive', 'false');
    checkSessionState();
    clearInterval(intervalId); 
    const countdownEl = document.getElementById('countdown');
    countdownEl.innerHTML = "Session Stopped";
    document.getElementById('stopSessionButton').style.display = 'none'; 
    clearCurrentTaskState();
}



function updateCountdownDisplay(currentTask, remainingMillis) {
    const countdownEl = document.getElementById('countdown');
    const minutes = Math.floor(remainingMillis / 60000);
    const seconds = Math.floor((remainingMillis % 60000) / 1000);

    countdownEl.innerHTML = `Current Task: ${currentTask}, Time remaining ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function saveCurrentTaskState(taskIndex, startTime, duration) {
    const taskState = {
        taskIndex: taskIndex,
        startTime: startTime,
        duration: duration
    };
    localStorage.setItem('currentTaskState', JSON.stringify(taskState));
}

function clearCurrentTaskState() {
    localStorage.removeItem('currentTaskState');
}

function beginTimer(currentTask, totalMilliseconds, callback, remainingTime = null) {
    const countdownEl = document.getElementById('countdown');
    let timeRemaining = remainingTime !== null ? remainingTime : totalMilliseconds;

    intervalId = setInterval(function () {
        const minutes = Math.floor(timeRemaining / 60000);
        const seconds = Math.floor((timeRemaining % 60000) / 1000);

        countdownEl.innerHTML = `Current Task: ${currentTask}, Time remaining ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        timeRemaining -= 1000;

        if (timeRemaining < 0) {
            clearInterval(intervalId);
            countdownEl.innerHTML = "Task Complete!";
            const nextTaskButton = document.createElement('button');
            nextTaskButton.textContent = 'Begin Next';
            nextTaskButton.addEventListener('click', function () {
                callback();
            });
            countdownEl.appendChild(nextTaskButton);

            callback();
            
        }
    }, 1000);

    
}
