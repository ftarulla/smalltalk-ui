# SmalltalkUI &mdash; Cuis University Web IDE

A modern, fast, vanilla JavaScript Web UI and Class Browser for **Cuis-Smalltalk** and **[CUIS University](https://sites.google.com/view/cuis-university)**.

![SmalltalkUI](https://img.shields.io/badge/Smalltalk-Cuis%20University-6366f1)
![Tech Stack](https://img.shields.io/badge/Frontend-Vanilla%20JS%20%2F%20HTML5%20%2F%20CSS3-10b981)
![Backend](https://img.shields.io/badge/Backend-Cuis%20Smalltalk%20REST%20Server-f59e0b)

---

## Main goal
- Proof of Concept of a Smalltalk WebUI frontend using CUIS University as backend. 
- Implemented using vanilla JS.
- The user should be able to open the classic `Class Browser` and later the user should be able to load an `.st` file.

## 🌟 Key Features

- **Classic 4-Pane Class Browser**:
  - **System Categories / Packages**, **Classes**, **Protocols (Method Categories)**, and **Methods (Selectors)**.
  - Quick search filters across all 4 panes.
  - **`[instance]`**, **`[?]` (Comment)**, and **`[class]`** side switching.
  - **`[hierarchy]`** class tree toggle.
  - Class and method creation (`+` buttons), editing, and saving (`Accept`).
- **Code Editor with Smalltalk Syntax Highlighting**:
  - Full syntax token coloring (keywords, binary selectors, symbols `#symbol`, numbers, strings, comments `"..."`, temporaries `| a b |`, assignments `:=` / `_`, returns `^`, block closures `[...]`, and pseudo-variables `self`, `super`, `nil`, `true`, `false`).
  - Line numbers gutter with synchronized scrolling.
  - Smalltalk keyboard shortcuts:
    - `Ctrl+S` / `Cmd+S`: **Accept** (Compile & save method or class definition)
    - `Ctrl+D` / `Cmd+D`: **Do It** (Evaluate expression)
    - `Ctrl+P` / `Cmd+P`: **Print It** (Evaluate and print result inline)
    - `Ctrl+I` / `Cmd+I`: **Inspect** (Inspect evaluated object)
    - `Tab` / `Shift+Tab`: Indent & Outdent
- **Load & File In `.st` Files**:
  - Drag-and-drop `.st` files directly onto the browser window.
  - Interactive `.st` chunk format parser showing class, method, and protocol breakdown.
  - File in directly to the live Cuis image and auto-open in the Class Browser.
  - Export any class back to standard `.st` chunk fileout format.
- **Morphic Desktop Window Manager**:
  - Draggable, resizable, stackable, minimizable, and maximizable windows.
  - Bottom taskbar with active window switcher.
  - Dark and Light theme toggle.
- **Smalltalk Workspace & Transcript**:
  - Interactive Playground for executing expressions.
  - System Transcript logging live events and evaluations.
- **Seamless Live Cuis Connection + Offline Mock Fallback**:
  - Connects to a running Cuis University image over HTTP/REST (`http://localhost:8080`).
  - Pre-populated with core Cuis Kernel classes (`Object`, `Magnitude`, `Number`, `Collection`, `Morph`, `Point`, `Counter`, etc.) so it works completely offline and standalone out-of-the-box.

---

## 🚀 Getting Started

### 1. Run the WebUI
Since SmalltalkUI is built with vanilla JavaScript, you can open `index.html` directly in any modern web browser or serve it using any static server:

```bash
# Python 3
python3 -m http.server 3000

# or Node.js npx serve / http-server
npx serve .
```

Then visit **`http://localhost:3000`**.

---

### 2. Connect to Cuis University (Live Smalltalk VM)

#### Option A: Inside Cuis GUI
1. Open your Cuis University image.
2. In the **File List**, select `backend/CuisWebServer.st` and click **filein**.
3. In a **Workspace**, evaluate:
   ```smalltalk
   SmalltalkUIWebServer startOn: 8080.
   ```
4. The WebUI will automatically detect the server and show the green **Cuis Live** connection badge!

To stop the server at any time:
```smalltalk
SmalltalkUIWebServer stop.
```

#### Option B: Headless Cuis Server
(⚠️ not tested yet!)
Run the headless script:
```bash
./backend/start-headless.sh
```

---

## 📁 Project Architecture

```
smalltalkui/
├── index.html                  # Main Web Application entry point
├── css/
│   ├── main.css                # Base theme variables, desktop background, taskbar
│   ├── window.css              # Morphic window styling & resize handles
│   ├── browser.css             # 4-pane System Browser layout
│   ├── editor.css              # Code editor with line numbers & syntax colors
│   └── components.css          # Modals, dropzones, forms, workspace, transcript
├── js/
│   ├── api/
│   │   ├── smalltalk-client.js # Bridge connecting to Cuis REST API
│   │   └── mock-backend.js     # Pre-populated Cuis kernel environment for offline mode
│   ├── parser/
│   │   └── st-chunk-parser.js  # Smalltalk Chunk format (.st fileout) parser & exporter
│   ├── editor/
│   │   ├── syntax-highlighter.js # Smalltalk token lexer & highlighter
│   │   └── code-editor.js      # Line-numbered editor with hotkeys
│   ├── ui/
│   │   ├── window-manager.js   # Draggable/resizable window manager
│   │   ├── system-browser.js   # Classic 4-pane Class Browser component
│   │   ├── workspace-window.js # Smalltalk Workspace (Playground) window
│   │   ├── transcript-window.js# Smalltalk Transcript window
│   │   ├── filein-dialog.js    # .st file upload & preview dialog
│   │   └── world-menu.js       # Top menu bar / Smalltalk World menu
│   └── app.js                  # Main app bootstrap
├── backend/
│   ├── CuisWebServer.st        # Smalltalk fileout to load into Cuis image
│   ├── start-headless.sh       # Script to launch Cuis in headless mode
│   └── README.md               # Backend documentation
└── samples/
    └── Counter.st              # Sample .st Smalltalk class file
```
