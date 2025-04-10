class Task {
    constructor(id, name, description = '', url = '', completed = false) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.url = url;
        this.completed = completed;
        this.subtasks = [];
    }

    addSubtask(task) {
        this.subtasks.push(task);
    }

    removeSubtask(taskId) {
        this.subtasks = this.subtasks.filter(task => task.id !== taskId);
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            url: this.url,
            completed: this.completed,
            subtasks: this.subtasks.map(task => task.toJSON())
        };
    }

    static fromJSON(data) {
        const task = new Task(data.id, data.name, data.description, data.url, data.completed);
        task.subtasks = data.subtasks.map(subtaskData => Task.fromJSON(subtaskData));
        return task;
    }
}