# 🚀 Task Manager

A powerful and elegant task management application with a modern dark theme interface. Built with vanilla JavaScript and designed for productivity.

## ✨ Features

- 📱 **Modern Interface** - Clean, responsive dark theme design
- 🎯 **3-Column Workflow** - Organize tasks in "On It", "Next Up", and "Back Log" columns
- 📝 **Rich Text Editing** - Full formatting support for task descriptions using Quill editor
- 📑 **Subtasks Support** - Break down complex tasks into manageable subtasks
- 🔄 **Drag & Drop** - Intuitive drag-and-drop interface for task management
- 🡽 **URL Support** - Add relevant links to tasks and subtasks
- ⌨️ **Keyboard Shortcuts**:
  - `Ctrl + Alt + N` - Create new task/subtask
  - `Ctrl/Cmd + Enter` - Save current task/subtask
  - `Esc` - Close panels
- 💾 **Persistent Storage** - Data saved to AirTable (cloud)
- 🗑️ **Task Archive** - Completed tasks are archived and can be restored
- 📱 **Responsive Design** - Works great on both desktop and mobile devices

## 🚀 Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/task-manager.git
   ```
2. Open `index.html` in your web browser

That's it! No build process or dependencies to install. The application uses CDN-hosted Quill.js for rich text editing.

## 🗄️ Database Persistence

On first load, the app prompts you to choose a storage mode:

- **AirTable** — syncs tasks to an AirTable base. You will be prompted for your table name, Base ID, and API token. These are saved to `localStorage` so you won't be asked again.
- **LocalStorage** — tasks are stored only in your browser's `localStorage`. The sync button is disabled in this mode.

To reset your storage choice (e.g. to switch modes or update credentials), clear `localStorage` for the page and reload.

### AirTable Schema

The app expects a `data` field in the specified AirTable table:

| Property   | Value      |
|------------|------------|
| Field name | `data`     |
| Field type | Long text  |

The `data` field stores the entire task list as a serialized JSON string. The app reads the **first record** in the table and creates one automatically if none exists.

### Sync Merge Logic

When syncing, the app compares the `updatedAt` timestamp of the local and AirTable data and treats the newer one as the **stronger** version. If AirTable data has no timestamp (e.g. data written before the sync feature was added), local data is always considered stronger.

The merge then applies the following rules:

- All tasks from the stronger version are kept as-is.
- A task that exists only in the weaker version is added to the merged result **only if** its ID does not appear in the stronger version's `deletedTasks` list. If it does appear there, the task was intentionally deleted in the stronger version and is not re-added.
- Deleted tasks from the weaker version are similarly only carried over if they are not already tracked in the stronger version.

## 💻 Technologies

- Vanilla JavaScript (ES6+)
- HTML5
- CSS3
- [Quill.js](https://quilljs.com/) for rich text editing
- [AirTable](https://airtable.com/) for cloud data persistence

## 🔨 Development

The project structure is organized as follows:

```
├── index.html          # Main HTML file
├── app.js             # Main application logic
├── styles.css         # Stylesheet
└── models/            # Data models
    ├── task.js       # Task class definition
    └── taskList.js   # TaskList class definition
```

## 🎨 Customization

The application uses a carefully crafted dark theme with orange accents. Main colors can be customized in `styles.css`:

- Primary color: `#ff6b2b` (Orange)
- Background: `#1a1a1a` (Dark)
- Secondary background: `#2d2d2d`
- Text: `#e0e0e0` (Light gray)

## 📝 License

Copyright © 2025 Daniel Schwartz Inc. All Rights Are All Right!

## 🡽 Live Demo

Visit the live application at [TODO](https://danielschwartz85.github.io/todo-board)
