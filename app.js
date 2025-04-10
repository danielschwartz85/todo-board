class TaskManager {
    constructor() {
        this.lists = {
            'on-it': new TaskList('on-it'),
            'next-up': new TaskList('next-up'),
            'back-log': new TaskList('back-log')
        };
        this.deletedTasks = [];
        this.loadFromLocalStorage();
        this.setupEventListeners();
        this.currentlyEditingTask = null;
        this.currentlyEditingParentTask = null;
    }

    setupEventListeners() {
        // Add task buttons
        document.querySelectorAll('.add-task-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const columnId = e.target.closest('.task-column').id;
                this.openTaskPanel(null, columnId);
            });
        });

        // Task panel events
        document.querySelector('.close-panel').addEventListener('click', () => {
            document.getElementById('task-panel').classList.remove('active');
        });

        document.querySelector('.save-task').addEventListener('click', () => this.saveTaskFromPanel());

        // Deleted tasks panel events
        document.getElementById('show-deleted-tasks').addEventListener('click', () => this.showDeletedTasksPanel());
        document.querySelector('#deleted-tasks-panel .close-panel').addEventListener('click', () => {
            document.getElementById('deleted-tasks-panel').classList.remove('active');
        });

        // Add subtask panel events
        document.querySelector('#subtask-panel .close-panel').addEventListener('click', () => {
            this.closeSubtaskPanel();
        });

        document.querySelector('.save-subtask').addEventListener('click', () => this.saveSubtaskFromPanel());

        // Setup drag and drop
        this.setupDragAndDrop();

        // Add click outside handlers for panels
        document.getElementById('task-panel').addEventListener('click', (e) => {
            if (e.target.id === 'task-panel') {
                this.closeTaskPanel();
            }
        });

        document.getElementById('deleted-tasks-panel').addEventListener('click', (e) => {
            if (e.target.id === 'deleted-tasks-panel') {
                this.closeDeletedTasksPanel();
            }
        });

        document.getElementById('subtask-panel').addEventListener('click', (e) => {
            if (e.target.id === 'subtask-panel') {
                this.closeSubtaskPanel();
            }
        });

        // Update close button handlers to use the new close methods
        document.querySelector('#task-panel .close-panel').addEventListener('click', () => {
            this.closeTaskPanel();
        });

        document.querySelector('#deleted-tasks-panel .close-panel').addEventListener('click', () => {
            this.closeDeletedTasksPanel();
        });

        // Add keyboard event listeners
        document.addEventListener('keydown', (e) => {
            // Handle Escape key
            if (e.key === 'Escape') {
                this.closeTaskPanel();
                this.closeSubtaskPanel();
                this.closeDeletedTasksPanel();
                return;
            }
            
            // Handle Ctrl + N for new task/subtask
            if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                
                const taskPanel = document.getElementById('task-panel');
                if (taskPanel.classList.contains('active')) {
                    // If we're viewing a task's details (new or existing), try to save it and open subtask panel
                    const savedTask = this.ensureTaskIsSaved();
                    if (savedTask) {
                        this.openSubtaskPanel(savedTask);
                    }
                } else {
                    // Otherwise create a new task in "On it"
                    this.openTaskPanel(null, 'on-it');
                }
                return;
            }

            // Handle Ctrl + Enter
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                
                // Find the topmost visible panel
                const subtaskPanel = document.getElementById('subtask-panel');
                const taskPanel = document.getElementById('task-panel');
                
                if (subtaskPanel.classList.contains('active')) {
                    this.saveSubtaskFromPanel();
                } else if (taskPanel.classList.contains('active')) {
                    this.saveTaskFromPanel();
                }
            }
        });
    }

    setupDragAndDrop() {
        const taskLists = document.querySelectorAll('.task-list');

        // Setup list event listeners
        taskLists.forEach(list => {
            list.addEventListener('dragenter', e => {
                e.preventDefault();
            });

            list.addEventListener('dragover', e => {
                e.preventDefault();
                const draggable = document.querySelector('.dragging');
                if (draggable) {
                    const afterElement = this.getDragAfterElement(list, e.clientY);
                    if (afterElement) {
                        list.insertBefore(draggable, afterElement);
                    } else {
                        list.appendChild(draggable);
                    }
                }
            });

            list.addEventListener('drop', e => {
                e.preventDefault();
                const draggable = document.querySelector('.dragging');
                if (draggable) {
                    const fromColumnId = draggable.dataset.sourceColumn;
                    const toColumnId = list.closest('.task-column').id;
                    const taskId = draggable.dataset.taskId;
                    
                    if (fromColumnId && toColumnId && fromColumnId !== toColumnId) {
                        this.moveTask(taskId, fromColumnId, toColumnId);
                    }
                }
            });
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    openTaskPanel(task = null, columnId = null, parentTask = null) {
        const panel = document.getElementById('task-panel');
        const nameInput = document.getElementById('task-name');
        const descriptionInput = document.getElementById('task-description');
        const urlInput = document.getElementById('task-url');
        const subtaskList = document.querySelector('.subtask-list');

        if (task) {
            this.currentlyEditingTask = task;
            nameInput.value = task.name;
            descriptionInput.value = task.description;
            urlInput.value = task.url;
            
            // Display subtasks
            subtaskList.innerHTML = '';
            task.subtasks.forEach(subtask => {
                const subtaskElement = document.createElement('div');
                subtaskElement.className = 'task-item';
                subtaskElement.innerHTML = `
                    <input type="checkbox" class="task-checkbox" data-id="${subtask.id}">
                    <span class="task-name">${subtask.name}</span>
                `;
                
                // Add checkbox event listener
                subtaskElement.querySelector('.task-checkbox').addEventListener('change', (e) => {
                    if (e.target.checked) {
                        this.deleteSubtask(task, subtask);
                    }
                });

                // Add click handler for the subtask name
                subtaskElement.querySelector('.task-name').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openSubtaskDetailsPanel(subtask);
                });

                subtaskList.appendChild(subtaskElement);
            });

            // Add event listener for the Add Subtask button in the panel
            document.querySelector('.add-subtask-btn').addEventListener('click', () => {
                // Try to save the task first if it's new
                const savedTask = this.ensureTaskIsSaved();
                if (savedTask) {
                    this.openSubtaskPanel(savedTask);
                }
            });
        } else {
            this.currentlyEditingTask = { columnId, parentTask };
            nameInput.value = '';
            descriptionInput.value = '';
            urlInput.value = '';
            subtaskList.innerHTML = '';
        }

        panel.classList.add('active');
        
        // Focus on the task name input after the panel is shown
        // Use setTimeout to ensure the focus happens after the panel is visible
        setTimeout(() => nameInput.focus(), 0);
    }

    saveTaskFromPanel() {
        const nameInput = document.getElementById('task-name');
        const descriptionInput = document.getElementById('task-description');
        const urlInput = document.getElementById('task-url');

        if (!nameInput.value.trim()) {
            alert('Task name is required!');
            return;
        }

        if (this.currentlyEditingTask.id) {
            // Editing existing task
            this.currentlyEditingTask.name = nameInput.value;
            this.currentlyEditingTask.description = descriptionInput.value;
            this.currentlyEditingTask.url = urlInput.value;
            this.updateTaskElement(this.currentlyEditingTask);
        } else {
            // Creating new task
            const newTask = new Task(
                Date.now().toString(),
                nameInput.value,
                descriptionInput.value,
                urlInput.value
            );

            if (this.currentlyEditingTask.parentTask) {
                // Adding as a subtask
                this.currentlyEditingTask.parentTask.addSubtask(newTask);
                this.updateTaskElement(this.currentlyEditingTask.parentTask);
            } else {
                // Adding as a main task
                this.lists[this.currentlyEditingTask.columnId].addTask(newTask);
                this.createTaskElement(newTask, this.currentlyEditingTask.columnId);
            }
        }

        this.saveToLocalStorage();
        document.getElementById('task-panel').classList.remove('active');
    }

    createTaskElement(task, columnId) {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        taskElement.draggable = true;
        taskElement.dataset.taskId = task.id;
        taskElement.dataset.sourceColumn = columnId;
        
        // Add a badge showing number of subtasks if any exist
        const subtasksBadge = task.subtasks.length ? `<span class="subtask-badge">${task.subtasks.length}</span>` : '';
        
        taskElement.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <span class="task-name">${task.name}</span>
            ${subtasksBadge}
            <button class="add-subtask-button" title="Add Subtask">+</button>
        `;

        taskElement.addEventListener('dragstart', () => {
            taskElement.classList.add('dragging');
        });

        taskElement.addEventListener('drag', () => {
            taskElement.style.opacity = '0.5';
        });

        taskElement.addEventListener('dragend', () => {
            taskElement.classList.remove('dragging');
            taskElement.style.opacity = '1';
        });

        // Prevent drag initialization on interactive elements
        taskElement.querySelector('.task-checkbox').addEventListener('mousedown', e => e.stopPropagation());
        taskElement.querySelector('.add-subtask-button').addEventListener('mousedown', e => e.stopPropagation());
        taskElement.querySelector('.task-name').addEventListener('mousedown', e => e.stopPropagation());

        taskElement.querySelector('.task-checkbox').addEventListener('change', (e) => {
            task.completed = e.target.checked;
            if (task.completed) {
                this.deleteTask(task, columnId);
            }
            this.saveToLocalStorage();
        });

        taskElement.querySelector('.task-name').addEventListener('click', () => {
            this.openTaskPanel(task);
        });

        taskElement.querySelector('.add-subtask-button').addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent task panel from opening
            this.openSubtaskPanel(task);
        });

        document.querySelector(`#${columnId} .task-list`).appendChild(taskElement);
    }

    deleteTask(task, columnId) {
        this.lists[columnId].removeTask(task.id);
        // Create a new Task instance when adding to deletedTasks
        const deletedTask = new Task(
            task.id,
            task.name,
            task.description,
            task.url,
            task.completed
        );
        deletedTask.subtasks = task.subtasks;
        this.deletedTasks.push({...deletedTask, deletedFrom: columnId});
        const taskElement = document.querySelector(`[data-task-id="${task.id}"]`);
        if (taskElement) {
            taskElement.remove();
        }
        this.saveToLocalStorage();
    }

    deleteSubtask(parentTask, subtask) {
        // Remove from parent's subtasks
        parentTask.removeSubtask(subtask.id);
        
        // Add to deleted tasks with parent reference
        const deletedTask = new Task(
            subtask.id,
            subtask.name,
            subtask.description,
            subtask.url,
            true
        );
        deletedTask.subtasks = subtask.subtasks;
        this.deletedTasks.push({
            ...deletedTask, 
            deletedFrom: 'subtask',
            parentTaskId: parentTask.id
        });

        // Update the UI and save
        this.updateTaskElement(parentTask);
        
        // Refresh the subtasks list in the task panel if it's open
        if (document.getElementById('task-panel').classList.contains('active')) {
            const subtaskList = document.querySelector('.subtask-list');
            subtaskList.innerHTML = '';
            parentTask.subtasks.forEach(subtask => {
                const subtaskElement = document.createElement('div');
                subtaskElement.className = 'task-item';
                subtaskElement.innerHTML = `
                    <input type="checkbox" class="task-checkbox" data-id="${subtask.id}">
                    <span class="task-name">${subtask.name}</span>
                `;
                
                // Add checkbox event listener
                subtaskElement.querySelector('.task-checkbox').addEventListener('change', (e) => {
                    if (e.target.checked) {
                        this.deleteSubtask(parentTask, subtask);
                    }
                });

                // Add click handler for the subtask name
                subtaskElement.querySelector('.task-name').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openSubtaskDetailsPanel(subtask);
                });

                subtaskList.appendChild(subtaskElement);
            });
        }
        
        this.saveToLocalStorage();
    }

    showDeletedTasksPanel() {
        const panel = document.getElementById('deleted-tasks-panel');
        const taskList = panel.querySelector('.deleted-task-list');
        taskList.innerHTML = '';

        this.deletedTasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = 'deleted-task-item';
            taskElement.innerHTML = `
                <span class="task-name">${task.name}</span>
                <button class="restore-task-btn" data-task-id="${task.id}">Restore</button>
            `;

            taskElement.querySelector('.restore-task-btn').addEventListener('click', () => {
                this.restoreTask(task);
            });

            taskList.appendChild(taskElement);
        });

        panel.classList.add('active');
    }

    restoreTask(task) {
        this.deletedTasks = this.deletedTasks.filter(t => t.id !== task.id);
        
        if (task.deletedFrom === 'subtask' && task.parentTaskId) {
            // Find the parent task in any list
            let parentTask = null;
            for (const list of Object.values(this.lists)) {
                parentTask = list.tasks.find(t => t.id === task.parentTaskId);
                if (parentTask) break;
            }
            
            if (parentTask) {
                // Create a proper Task instance for the subtask
                const restoredSubtask = new Task(
                    task.id,
                    task.name,
                    task.description,
                    task.url,
                    false
                );
                
                // Add back to parent's subtasks
                parentTask.addSubtask(restoredSubtask);
                this.updateTaskElement(parentTask);
            }
        } else {
            // Regular task restoration
            const columnId = task.deletedFrom || 'back-log';
            const restoredTask = new Task(
                task.id,
                task.name,
                task.description,
                task.url,
                false
            );
            
            restoredTask.subtasks = (task.subtasks || []).map(subtask => 
                new Task(
                    subtask.id,
                    subtask.name,
                    subtask.description,
                    subtask.url,
                    subtask.completed
                )
            );
            
            this.lists[columnId].addTask(restoredTask);
            this.createTaskElement(restoredTask, columnId);
        }
        
        this.saveToLocalStorage();
        this.showDeletedTasksPanel();
    }

    updateTaskElement(task) {
        const taskElement = document.querySelector(`[data-task-id="${task.id}"]`);
        if (taskElement) {
            taskElement.querySelector('.task-name').textContent = task.name;
            
            // Update or add the subtask badge
            let subtaskBadge = taskElement.querySelector('.subtask-badge');
            if (task.subtasks.length > 0) {
                if (!subtaskBadge) {
                    subtaskBadge = document.createElement('span');
                    subtaskBadge.className = 'subtask-badge';
                    // Insert badge after task name
                    taskElement.querySelector('.task-name').after(subtaskBadge);
                }
                subtaskBadge.textContent = task.subtasks.length;
            } else if (subtaskBadge) {
                // Remove badge if no subtasks
                subtaskBadge.remove();
            }
        }
        this.saveToLocalStorage();
    }

    moveTask(taskId, fromColumnId, toColumnId) {
        const task = this.lists[fromColumnId].getTask(taskId);
        if (task) {
            this.lists[fromColumnId].removeTask(taskId);
            this.lists[toColumnId].addTask(task);
            this.saveToLocalStorage();
        }
    }

    saveToLocalStorage() {
        const data = {
            lists: Object.entries(this.lists).reduce((acc, [key, list]) => {
                acc[key] = list.toJSON();
                return acc;
            }, {}),
            deletedTasks: this.deletedTasks
        };
        localStorage.setItem('taskManager', JSON.stringify(data));
    }

    loadFromLocalStorage() {
        const data = localStorage.getItem('taskManager');
        if (data) {
            const parsed = JSON.parse(data);
            Object.entries(parsed.lists || {}).forEach(([key, listData]) => {
                this.lists[key] = TaskList.fromJSON(listData);
                this.lists[key].tasks.forEach(task => {
                    this.createTaskElement(task, key);
                });
            });
            // Convert deleted tasks back to Task instances
            this.deletedTasks = (parsed.deletedTasks || []).map(taskData => {
                const task = new Task(
                    taskData.id,
                    taskData.name,
                    taskData.description,
                    taskData.url,
                    taskData.completed
                );
                task.subtasks = (taskData.subtasks || []).map(subtask => Task.fromJSON(subtask));
                return {...task, deletedFrom: taskData.deletedFrom};
            });
        }
    }

    closeTaskPanel() {
        document.getElementById('task-panel').classList.remove('active');
    }

    closeDeletedTasksPanel() {
        document.getElementById('deleted-tasks-panel').classList.remove('active');
    }

    openSubtaskPanel(parentTask) {
        const panel = document.getElementById('subtask-panel');
        const nameInput = document.getElementById('subtask-name');
        const descriptionInput = document.getElementById('subtask-description');
        const urlInput = document.getElementById('subtask-url');

        this.currentlyEditingParentTask = parentTask;
        nameInput.value = '';
        descriptionInput.value = '';
        urlInput.value = '';

        panel.classList.add('active');
        
        // Focus on the subtask name input after the panel is shown
        setTimeout(() => nameInput.focus(), 0);
    }

    openSubtaskDetailsPanel(subtask) {
        const panel = document.getElementById('subtask-panel');
        const nameInput = document.getElementById('subtask-name');
        const descriptionInput = document.getElementById('subtask-description');
        const urlInput = document.getElementById('subtask-url');

        // Fill in the subtask details
        nameInput.value = subtask.name;
        descriptionInput.value = subtask.description;
        urlInput.value = subtask.url;

        // Store the subtask being edited and maintain reference to parent task
        this.currentlyEditingSubtask = subtask;
        // The parent task is already stored in currentlyEditingTask when viewing task details
        this.currentlyEditingParentTask = this.currentlyEditingTask;

        panel.classList.add('active');
        
        // Focus on the subtask name input after the panel is shown
        setTimeout(() => nameInput.focus(), 0);
    }

    saveSubtaskFromPanel() {
        const nameInput = document.getElementById('subtask-name');
        const descriptionInput = document.getElementById('subtask-description');
        const urlInput = document.getElementById('subtask-url');

        if (!nameInput.value.trim()) {
            alert('Subtask name is required!');
            return;
        }

        if (this.currentlyEditingSubtask) {
            // Editing existing subtask
            this.currentlyEditingSubtask.name = nameInput.value;
            this.currentlyEditingSubtask.description = descriptionInput.value;
            this.currentlyEditingSubtask.url = urlInput.value;
            this.updateTaskElement(this.currentlyEditingParentTask);
            
            // Refresh the subtasks list in the task panel
            this.refreshSubtasksList(this.currentlyEditingParentTask);
            
            this.saveToLocalStorage();
            this.closeSubtaskPanel();
        } else if (this.currentlyEditingParentTask) {
            // Creating new subtask
            const newSubtask = new Task(
                Date.now().toString(),
                nameInput.value,
                descriptionInput.value,
                urlInput.value
            );

            this.currentlyEditingParentTask.addSubtask(newSubtask);
            this.updateTaskElement(this.currentlyEditingParentTask);
            
            // Refresh the subtasks list in the task panel
            this.refreshSubtasksList(this.currentlyEditingParentTask);
            
            this.saveToLocalStorage();
            this.closeSubtaskPanel();
        }
        
        // Reset the editing state
        this.currentlyEditingSubtask = null;
    }

    // Helper method to refresh the subtasks list
    refreshSubtasksList(parentTask) {
        if (document.getElementById('task-panel').classList.contains('active')) {
            const subtaskList = document.querySelector('.subtask-list');
            subtaskList.innerHTML = '';
            parentTask.subtasks.forEach(subtask => {
                const subtaskElement = document.createElement('div');
                subtaskElement.className = 'task-item';
                subtaskElement.innerHTML = `
                    <input type="checkbox" class="task-checkbox" data-id="${subtask.id}">
                    <span class="task-name">${subtask.name}</span>
                `;
                
                // Add checkbox event listener
                subtaskElement.querySelector('.task-checkbox').addEventListener('change', (e) => {
                    if (e.target.checked) {
                        this.deleteSubtask(parentTask, subtask);
                    }
                });

                // Add click handler for the subtask name
                subtaskElement.querySelector('.task-name').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openSubtaskDetailsPanel(subtask);
                });

                subtaskList.appendChild(subtaskElement);
            });
        }
    }

    closeSubtaskPanel() {
        document.getElementById('subtask-panel').classList.remove('active');
        this.currentlyEditingParentTask = null;
        this.currentlyEditingSubtask = null;
    }

    // Helper method to ensure a task is saved before adding subtasks
    ensureTaskIsSaved() {
        if (!this.currentlyEditingTask.id) {
            // Task is new/unsaved
            const nameInput = document.getElementById('task-name');
            const descriptionInput = document.getElementById('task-description');
            const urlInput = document.getElementById('task-url');

            if (!nameInput.value.trim()) {
                alert('Please enter a task name before adding subtasks');
                return null;
            }

            // Create and save the new task
            const newTask = new Task(
                Date.now().toString(),
                nameInput.value,
                descriptionInput.value,
                urlInput.value
            );

            // Add to appropriate list
            this.lists[this.currentlyEditingTask.columnId].addTask(newTask);
            this.createTaskElement(newTask, this.currentlyEditingTask.columnId);
            
            // Update current editing task reference
            this.currentlyEditingTask = newTask;
            
            this.saveToLocalStorage();
            return newTask;
        }
        
        return this.currentlyEditingTask;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
});