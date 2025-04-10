class TaskList {
    constructor(type) {
        this.type = type; // 'on-it', 'next-up', or 'back-log'
        this.tasks = [];
    }

    addTask(task) {
        this.tasks.push(task);
    }

    removeTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
    }

    getTask(taskId) {
        return this.tasks.find(task => task.id === taskId);
    }

    toJSON() {
        return {
            type: this.type,
            tasks: this.tasks.map(task => task.toJSON())

        };
    }

    static fromJSON(data) {
        const taskList = new TaskList(data.type);
        taskList.tasks = data.tasks.map(taskData => Task.fromJSON(taskData));
        return taskList;
    }
}