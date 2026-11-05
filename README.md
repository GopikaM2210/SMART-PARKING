# 🚗 Smart Parking System - Web Application

A clean, modern, and user-friendly web application for the **Smart Parking System**, converted from the provided C program with desktop and mobile responsive design.

---

## 📋 Features Aligned with the C Program

| C Code Logic | Web Application Feature |
| :--- | :--- |
| `#define MAX 5` | Exactly 5 parking slots (Slots 1 to 5) visualized as interactive parking bays. |
| `#define RATE 20` | Fixed rate of **₹20 / hour**, shown dynamically in the header and billing receipts. |
| `1. View Parking Slots` | Real-time status grid showing each slot's state (**Available** / **Occupied**), license plate, and entry time. |
| `2. Vehicle Entry` | Auto-detects the first free slot, handles input for vehicle number & 24h entry time, alerts if full (`Parking Full!`), and displays assigned slot. |
| `3. Vehicle Exit` | Validates slot occupancy, accepts 24h exit time, computes duration (`duration < 0 ? duration + 24`), calculates total charge (`duration * 20`), releases the slot, and prints a formatted bill. |
| `4. Exit Program` | Clean reset and state persistence via browser `localStorage`. |

---

## 🌟 Modern UI/UX Enhancements

- 📱 **Mobile & Desktop Responsive**:
  - Grid automatically rearranges for mobile phones (1 column + sticky bottom navigation bar), tablets (2 columns), and desktops (5 columns).
- 🧾 **Printable Thermal Parking Bill**:
  - Dedicated pop-up receipt matching the C console output with a "Print Receipt" button optimized for printer paper (`@media print`).
- ⚡ **Real-time 24-Hour Clock**:
  - Displays current 24h time and provides quick "Use Current Hour" buttons during entry and exit.
- 🔊 **Sound Feedback (Web Audio API)**:
  - Pleasant chimes on vehicle allocation and checkout (toggleable with the speaker button).
- 🔍 **Live Search Filter**:
  - Instantly search by vehicle plate or slot number.
- ⚡ **Demo Generator**:
  - "Demo Car" button to quickly test the workflow with 1 click.
- 🖥️ **Live C-Style Console Terminal**:
  - Live log display showing the exact `printf` terminal output.

---

## 🚀 How to Run the Application

### Option 1: Direct Browser Launch (Simplest)
Just double click on `index.html` inside `d:\smart-parking-web\index.html` in Windows Explorer, or open it in any browser (Chrome, Edge, Firefox, Safari).

### Option 2: Local HTTP Server (Python)
Run in PowerShell:
```powershell
cd d:\smart-parking-web
python -m http.server 3000
```
Then visit `http://localhost:3000` in your web browser.

### Option 3: Local HTTP Server (Node.js)
Run in PowerShell:
```powershell
cd d:\smart-parking-web
npx serve -l 3000
```
Then visit `http://localhost:3000`.

---

## 📁 File Structure

```
d:\smart-parking-web/
├── index.html        # Semantic HTML5 with responsive Tailwind layout and modals
├── style.css         # Custom animations, parking bay markings, and print receipt styles
├── app.js            # Core parking logic, 24h duration math, localStorage & audio
├── start.bat         # Windows batch script to launch the app instantly
└── README.md         # Documentation and guide
```
