# Beef Choice Study App

A Next.js research data-collection app for a beef choice experiment involving meat cuts, certification seals, label descriptions, and price sensitivity.

The app is designed for use on desktop, tablet, and mobile browsers. It is especially suitable for running on a research laptop while participants complete the survey on a tablet connected to the same local network.

---

## Table of Contents

1. Project Overview
2. Study Flow
3. Features
4. Technology Stack
5. Folder Structure
6. Requirements
7. Installation
8. Running the App
9. Tablet / Mobile Use
10. Image Setup
11. Data Output
12. Privacy Notes
13. Troubleshooting
14. Developer Notes

---

## 1. Project Overview

This app collects participant responses for a three-session beef choice study.

The study includes:

- Choice experiment / Best-Worst Scaling ranking
- Seal description reading and confirmation
- Price experiment using each participant’s preferred seals
- Demographic questionnaire
- Export of research data to Excel and JSON files

The app supports one unique participant ID across all three sessions.

---

## 2. Study Flow

### Recommended Full Survey Flow

Use **Start New Survey** for real participants.

Flow:

Start New Survey  
Create one participant ID  
Session 1  
Session 2  
Session 3  
Final questionnaire  
Survey complete  

The same participant ID is used across all three sessions.

### Individual Session Links

The home page also includes individual session links:

- Start Session 1 only
- Start Session 2 only
- Start Session 3 only

These are mainly for testing, troubleshooting, or running a single session.

---

## 3. Features

### General Features

- Unique participant ID generation
- One participant ID across the full survey
- Option to use an existing participant ID
- Randomized display order for each participant
- Tablet/mobile/desktop responsive interface
- Local Excel and JSON data saving
- Session-wise data files
- Combined full-survey data file

### Session 1

Session 1 applies a choice experiment / Best-Worst Scaling style ranking.

Flow:

Show five beef cut/seal options  
Participant selects one option  
Confirmation modal appears  
If Yes, selected option disappears  
Remaining options stay available  
Repeat until all five options are ranked  
Final confirmation  
Save Session 1 data  

In full-survey mode, the demographic questionnaire is skipped in Session 1 and collected at the end of Session 3.

### Session 2

Session 2 includes seal descriptions before the choice task.

Flow:

Show all representative seals  
Participant clicks each seal  
Description modal appears  
A check mark appears after reading  
Continue unlocks after all seals are read  
Participant confirms whether they agree with descriptions  
If No, return to description screen  
If Yes, proceed to ranking task  
Participant ranks beef cut/seal options  
Final confirmation  
Save Session 2 data  

During the Session 2 ranking task, participants can click a seal again to read its description.

In full-survey mode, the demographic questionnaire is skipped in Session 2 and collected at the end of Session 3.

### Session 3

Session 3 includes price information.

Flow:

Search saved Session 1 and Session 2 data  
Find participant’s top three seals  
Create three price conditions: +5%, +10%, +20%  
Randomize display order  
Participant ranks priced options  
Final confirmation  
Final demographic questionnaire  
Save Session 3 data  
Save combined full-survey data  

Session 3 uses saved JSON records from:

- data/session-1-results.json
- data/session-2-results.json

If saved data is not found, the app can fall back to browser localStorage or default testing seals.

---

## 4. Technology Stack

- Next.js
- React
- TypeScript
- Next.js App Router
- Next.js Route Handlers / API routes
- SheetJS xlsx for Excel file generation
- Local JSON files as persistent source files
- CSS in app/globals.css

---

## 5. Folder Structure

Typical project structure:

beef-choice-app/  
app/  
app/api/session-1/save/route.ts  
app/api/session-2/save/route.ts  
app/api/session-3/save/route.ts  
app/api/session-3/top-seals/route.ts  
app/api/full-survey/save/route.ts  
app/participant/start/page.tsx  
app/session-1/page.tsx  
app/session-2/descriptions/page.tsx  
app/session-3/page.tsx  
app/globals.css  
app/layout.tsx  
app/page.tsx  

components/  
components/ConfirmModal.tsx  
components/DemographicsForm.tsx  
components/ProductCard.tsx  
components/RankingScreen.tsx  

lib/  
lib/pricing.ts  
lib/randomization.ts  

public/images/cuts/  
public/images/seals/red/  
public/images/seals/green/  

data/  

package.json  
package-lock.json  
tsconfig.json  
next.config.ts  
README.md  
.gitignore  

---

## 6. Requirements

Install Node.js and npm.

Check whether Node.js and npm are installed:

node -v  
npm -v  

If Node.js is not installed on macOS, install it with Homebrew:

brew install node

---

## 7. Installation

From the project folder, run:

npm install

The app uses xlsx to create Excel files. If needed, install it manually:

npm install xlsx

---

## 8. Running the App

### Development Mode

Use this while editing the app:

npm run dev

Open:

http://localhost:3000

If port 3000 is already in use, Next.js may use another port such as:

http://localhost:3001

### Production Mode

Stop the development server first with Control + C.

Then build the app:

npm run build

Start production mode:

npm run start

Open:

http://localhost:3000

---

## 9. Tablet / Mobile Use

Recommended setup for data collection:

MacBook or research laptop runs the app.  
Tablet opens the app using the laptop’s network IP.  
Participant completes survey on tablet.  
Data files are saved on the laptop.  

When the app starts, Next.js shows a Network URL, for example:

http://172.24.14.241:3000

Open that URL on the tablet browser.

The laptop and tablet must be connected to the same Wi-Fi network.

For production use:

npm run build  
npm run start  

Then open the Network URL on the tablet.

---

## 10. Image Setup

Images are stored in the public/images/ folder.

### Meat Cut Images

Place meat cut images here:

public/images/cuts/

Expected filenames:

public/images/cuts/1.png  
public/images/cuts/2.png  
public/images/cuts/3.png  
public/images/cuts/4.png  
public/images/cuts/5.png  

### Seal Images

Place red seal images here:

public/images/seals/red/

Example:

public/images/seals/red/1.png  
public/images/seals/red/2.png  

Place green seal images here:

public/images/seals/green/

Example:

public/images/seals/green/1.png  
public/images/seals/green/2.png  
public/images/seals/green/3.png  

### Referencing Images in Code

Files inside public/ are referenced starting from /.

Example:

public/images/cuts/1.png

is used in code as:

/images/cuts/1.png

---

## 11. Data Output

The app saves data into the data/ folder.

### Session-Wise Files

Session 1:

data/session-1-results.xlsx  
data/session-1-results.json  

Session 2:

data/session-2-results.xlsx  
data/session-2-results.json  

Session 3:

data/session-3-results.xlsx  
data/session-3-results.json  

### Combined Full-Survey Files

After Session 3 is completed, the app also saves:

data/full-survey-results.xlsx  
data/full-survey-results.json  

The combined full-survey file is intended for analysis.

It has one row per participant and includes:

- participant ID
- location
- demographics
- Session 1 rankings
- Session 2 readings and rankings
- Session 3 price rankings

### Excel Sheet Structure

Session-wise files usually include:

- Participant Data
- Long Format

Session 2 also includes:

- Seal Readings

The combined file includes:

- Full Survey Data

---

## 12. Privacy Notes

Participant response data may be stored locally in:

data/

Before sharing or backing up the project, check this folder.

Delete participant data when needed:

rm -f data/*.xlsx  
rm -f data/*.json  

The app also uses browser localStorage for temporary participant/session state.

For a clean browser test, clear localStorage or use a private/incognito browser window.

---

## 13. Troubleshooting

### npm: command not found

Node.js is not installed or not available in PATH.

Install Node.js:

brew install node

Check:

node -v  
npm -v  

### Port 3000 is already in use

Check what is using port 3000:

lsof -i :3000

Kill the process:

kill -9 PID_NUMBER

Example:

kill -9 12738

Then restart:

npm run dev

### Do not use Control + Z to stop the server

Use Control + C.

Control + Z suspends the server instead of stopping it.

If you accidentally suspend the server:

jobs

Then kill the job:

kill %1

### WebSocket / HMR warnings in browser console

Development warnings such as WebSocket connection failed, React DevTools messages, or Fast Refresh rebuilding are usually harmless in development mode.

Use:

http://localhost:3000

on the main computer.

Use the Network URL only on the tablet.

### Excel file is not saving

Make sure the app is running locally or on a server that can write to the project folder.

The API writes files to:

data/

Make sure the folder exists:

mkdir -p data

### Session 3 does not find previous choices

Session 3 searches saved records in:

data/session-1-results.json  
data/session-2-results.json  

To get individualized Session 3 results, complete Session 1 and Session 2 first using the same participant ID.

---

## 14. Developer Notes

### Randomization

Randomization is based on participant ID and session number.

Example:

participantId-session-1  
participantId-session-2  
participantId-session-3  

This makes the display order auditable.

### Session 3 Top-Seal Selection

Session 3 reads saved JSON records from Session 1 and Session 2.

Scoring example:

Rank 1 = 5 points  
Rank 2 = 4 points  
Rank 3 = 3 points  
Rank 4 = 2 points  
Rank 5 = 1 point  

The three highest-scoring seals are used in Session 3.

### Local File Storage

The app writes Excel and JSON files from server-side API routes.

This is suitable for local data collection on a laptop.

For cloud deployment, use a database or persistent file storage because many serverless environments do not allow permanent file writes.

### Recommended Real Collection Setup

1. Run production mode on research laptop.
2. Connect tablet to same Wi-Fi.
3. Open laptop Network URL on tablet.
4. Use Start New Survey for each participant.
5. Back up the data folder regularly.