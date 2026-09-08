# SmalltalkUI - Cuis University Backend

This folder contains the Smalltalk HTTP/REST server that integrates Cuis University / Cuis-Smalltalk with the SmalltalkUI Web Client.

## Quick Start in Cuis University

### Option 1: File In via Cuis GUI
1. Open your Cuis University image.
2. In the **File List** browser, navigate to this `backend/` folder and select `CuisWebServer.st`.
3. Click **"filein"** (or right-click `CuisWebServer.st` -> *file in entire file*).
4. Open a **Workspace** in Cuis and evaluate (`Do It` / Ctrl+D):
   ```smalltalk
   SmalltalkUIWebServer startOn: 8080.
   ```
5. Your Cuis image is now listening for requests from SmalltalkUI at `http://localhost:8080`!

To stop the server at any time:
```smalltalk
SmalltalkUIWebServer stop.
```

---

### Option 2: Headless Mode via Command Line
(⚠️ Not tested yet!)

Run the provided script:
```bash
chmod +x start-headless.sh
./start-headless.sh
```

Or invoke the Squeak/Cuis VM directly:
```bash
squeak -headless CuisUniversity.image -e "
  'backend/CuisWebServer.st' asFileEntry fileIn.
  SmalltalkUIWebServer startOn: 8080.
"
```

---

## REST Endpoints Provided

| Endpoint | Method | Description |
|---|---|---|
| `/api/status` | GET | Check system health & Cuis version |
| `/api/categories` | GET | List all system categories (packages) |
| `/api/classes?category=...` | GET | List classes in category or all classes |
| `/api/class/:name` | GET | Get class definition, superclass, inst/class vars, comment |
| `/api/class/:name/protocols?side=instance\|class` | GET | Get method protocols for a class |
| `/api/class/:name/methods?protocol=...&side=instance\|class` | GET | Get method selectors in a protocol |
| `/api/class/:name/method/:selector?side=instance\|class` | GET | Get method source code and timestamp |
| `/api/compile` | POST | Compile a method into the class (`{class, side, protocol, source}`) |
| `/api/filein` | POST | File in a `.st` chunk format stream (`{content}`) |
| `/api/eval` | POST | Evaluate Smalltalk code expression (`{expression}`) |
| `/api/search?q=...` | GET | Search matching classes and method selectors |
