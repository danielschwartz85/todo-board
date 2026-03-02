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

## 🗄️ Database Persistence (AirTable)

To enable cloud persistence via AirTable, pass the following URL parameters when opening the app:

| Parameter | Description |
|-----------|-------------|
| `token`   | Your AirTable API key |
| `baseId`  | Your AirTable Base ID |

**Example URL:**
```
index.html?token=YOUR_AIRTABLE_API_KEY&baseId=YOUR_BASE_ID
```

### AirTable Schema

The app expects the following table structure in your AirTable base:

| Property   | Value      |
|------------|------------|
| Table name | `todo-app` |
| Field name | `taskData` |
| Field type | Long text  |

The `taskData` field stores the entire task list as a serialized JSON string. The app reads the first record in the table and creates one automatically if none exists.

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

Visit the live application at [TODO](https://daniel-schwartz-k.github.io/todo/)