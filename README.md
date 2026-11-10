# 🎫 Rooh Helpdesk – Employee Helpdesk & Ticket Management System

A modern, interactive **employee helpdesk** built with **HTML, CSS and vanilla JavaScript**. It needs no backend, no build step, no frameworks and no paid services. All data is stored in the browser's **localStorage**. The app ships with **12 sample employees, 6 support agents and 22 realistic tickets**, so you can demonstrate it straight away.

Employees raise tickets for **IT issues, HR queries, payroll, software access and workplace facilities**. The support team assigns, tracks and resolves those tickets from an admin dashboard.

---

## ✨ Features

### 👤 Employee dashboard
- **Raise tickets** with a title, description, category and priority.
- **Unique ticket IDs** are generated automatically (`HD-1023`, `HD-1024`, …).
- **My Tickets** shows every ticket you raised with its status: *Open*, *In Progress*, *Resolved* or *Closed*.
- **Search and filter** your tickets by keyword, category, priority and status.
- **Ticket details** include a full history timeline, the assigned agent, the SLA due time and the **resolution details**.
- **Comment** on a ticket, **confirm and close** it once it is resolved, or **reopen** it if the issue persists.
- **Latest updates** and a notification bell 🔔 show status changes made by the support team.

### 🛠️ Admin / support dashboard
- **Summary cards** for total, pending, resolved, high-priority, overdue and unassigned tickets. Click a card to filter the ticket list.
- **Interactive charts** (pure SVG/CSS, no libraries):
  - a donut chart of tickets **by category** (hover to highlight, click to filter)
  - bar charts of tickets **by status** and active tickets **by priority** (click to filter)
  - an **agent workload** chart
- A **Needs attention** panel lists overdue and high-priority tickets.
- **All Tickets** table with search and filters for category, priority, status, assignee and *overdue only*.
- **Assign tickets** inline from the table, or from the ticket detail panel. ★ marks agents from the suggested department.
- **Update status and priority** and add **comments or resolution notes**. Resolving a ticket requires resolution details.
- **Team & Employees** page with agent cards (active, resolved and overdue counts) and the employee directory.

### 🧠 Smart features (rule-based JavaScript, no AI service needed)
| Feature | How it works |
|---|---|
| **Priority suggestion** | The title and description are scanned for keywords as you type. For example, *outage, virus, phishing, cannot work* → **Critical**; *urgent, not working, locked out, deadline* → **High**; *question, how to, request for* → **Low**; otherwise **Medium**. The priority field updates automatically until you change it yourself, after which a *Use suggested* button appears. |
| **Category hint** | Detects likely categories, e.g. "salary / payslip" → Payroll, "GitHub access" → Software Access. |
| **Department routing** | Each category maps to a support department, shown with its email, working hours and team members. |
| **SLA and overdue detection** | Each priority has a target resolution time. Overdue tickets get a red highlight, an `OVERDUE` flag and a pulse effect. High and Critical tickets get an orange highlight. |
| **Notifications** | A toast appears when a status changes. The employee also receives a bell notification, and admins are notified of new tickets, comments, closures and reopens. |
| **Dark / light mode** | 🌙/☀️ toggle. Your choice is remembered. |

### SLA targets
| Priority | Target resolution |
|---|---|
| Critical | 4 hours |
| High | 24 hours |
| Medium | 72 hours (3 days) |
| Low | 168 hours (7 days) |

### Category → department routing
| Category | Department |
|---|---|
| 💻 IT Support | IT Service Desk |
| 🧑‍💼 HR Query | Human Resources |
| 💰 Payroll | Payroll & Finance |
| 🔑 Software Access | Identity & Access Management |
| 🏢 Workplace Facilities | Facilities Management |

---

## 🗂️ Folder structure

```
rooh-employee-helpdesk/
├── index.html          # App shell: sidebar, top bar, all pages, ticket modal
├── css/
│   └── styles.css      # Corporate dashboard theme, light/dark variables, animations, responsive layout
├── js/
│   ├── data.js         # Categories, departments, priorities/SLA, 12 employees, 6 agents, 22 sample tickets
│   ├── smart.js        # Priority suggestion, category hint, department routing
│   ├── storage.js      # localStorage layer: tickets, employees, agents, notifications, settings, ID generator
│   ├── charts.js       # Dependency-free interactive SVG donut and bar charts
│   └── app.js          # UI controller: navigation, dashboards, forms, filters, modal, notifications, theme
└── README.md
```

---

## 🚀 Running locally

No installation is required. You only need a modern browser (Edge, Chrome, Firefox or Safari).

```bash
git clone https://github.com/techbliss1/rooh-employee-helpdesk.git
cd rooh-employee-helpdesk
```

Then choose one option:

| Option | Command |
|---|---|
| Open directly | Double-click `index.html` |
| Python | `python -m http.server 8080`, then open http://localhost:8080 |
| Node.js | `npx serve .` |
| VS Code | Right-click `index.html` → **Open with Live Server** |

You can also host it for free on **GitHub Pages**: *Settings → Pages → Deploy from branch → `main` / root*.

---

## 🎬 Demo walkthrough

### Employee workflow
1. The app opens in **👤 Employee** mode, signed in as **Aarav Sharma**. Use the selector in the top bar to switch to any of the 12 employees.
2. Review the **dashboard** summary cards, recent tickets and latest updates.
3. Open **Raise a Ticket** and type, for example:
   *Title:* `VPN not working` · *Description:* `Urgent – I cannot access client files and have a deadline today.`
   The assistant suggests **High** priority, hints **IT Support** and shows routing to **IT Service Desk** with a 24-hour SLA.
4. Click **Submit ticket**. A unique ID (e.g. `HD-1023`) is generated and the ticket details open.
5. In **My Tickets**, search and filter by category, priority or status.

### Admin workflow
1. Switch to **🛠️ Admin** in the sidebar. The bell shows the new-ticket notification.
2. On the **Overview** page, review the stat cards and charts. Click a chart segment or card to jump to filtered tickets.
3. Go to **All Tickets**. Overdue rows are red and high-priority rows are orange. Tick **Overdue only** to focus on SLA breaches.
4. Assign the new ticket from the **Assignee** dropdown (★ = suggested department).
5. Click **Manage**, set the status to **In Progress**, then to **Resolved** with a resolution note. A toast confirms the change and the employee is notified.

### Close the loop
1. Switch back to **👤 Employee**. The 🔔 badge shows the updates.
2. Open the ticket to read the resolution and history, then click **Yes, close ticket** (or **Reopen**).
3. Toggle 🌙 **dark mode**, and click **↺ Reset demo data** in the sidebar to start over.

---

## 💾 Data and privacy
- Data is saved in your browser under keys prefixed `rooh.helpdesk.v1.`. It never leaves your device.
- Sample timestamps are relative to the current time, so the demo always includes fresh, overdue and resolved tickets.
- **Reset demo data** restores all sample data and keeps your theme preference.

## 🔧 Customization
- Add employees or agents: edit `SAMPLE_EMPLOYEES` / `SAMPLE_AGENTS` in `js/data.js`, then reset the demo data.
- Change SLAs: edit `PRIORITIES` in `js/data.js`.
- Tune the smart suggestions: edit the keyword lists in `js/smart.js`.
- Re-brand: change the CSS variables at the top of `css/styles.css`.

## 📄 License
MIT. Free to use and adapt.
