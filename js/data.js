/**
 * data.js – Reference data and sample demonstration data for Rooh Helpdesk.
 * Sample ticket timestamps are generated relative to "now" so the demo always
 * contains fresh, overdue and resolved tickets.
 */

const CATEGORIES = [
  { id: "IT Support", icon: "💻", color: "#3b82f6", department: "IT Service Desk" },
  { id: "HR Query", icon: "🧑‍💼", color: "#a855f7", department: "Human Resources" },
  { id: "Payroll", icon: "💰", color: "#10b981", department: "Payroll & Finance" },
  { id: "Software Access", icon: "🔑", color: "#f59e0b", department: "Identity & Access Management" },
  { id: "Workplace Facilities", icon: "🏢", color: "#ef4444", department: "Facilities Management" }
];
const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

const DEPARTMENTS = {
  "IT Service Desk": { icon: "🖥️", email: "itdesk@rooh.example", hours: "24×7", description: "Hardware, network, email, VPN and security incidents." },
  "Human Resources": { icon: "🤝", email: "hr@rooh.example", hours: "Mon–Fri, 9:00–18:00", description: "Policies, leave, benefits, onboarding and employee records." },
  "Payroll & Finance": { icon: "🧾", email: "payroll@rooh.example", hours: "Mon–Fri, 9:00–17:00", description: "Salary, payslips, tax deductions, bonuses and reimbursements." },
  "Identity & Access Management": { icon: "🛡️", email: "access@rooh.example", hours: "Mon–Sat, 8:00–20:00", description: "Accounts, passwords, licences and application permissions." },
  "Facilities Management": { icon: "🏗️", email: "facilities@rooh.example", hours: "Mon–Sat, 7:00–21:00", description: "Office space, furniture, AC, parking, access cards and maintenance." }
};

/** SLA = target resolution time in hours. */
const PRIORITIES = [
  { id: "Low", sla: 168, rank: 1, color: "#64748b" },
  { id: "Medium", sla: 72, rank: 2, color: "#3b82f6" },
  { id: "High", sla: 24, rank: 3, color: "#f97316" },
  { id: "Critical", sla: 4, rank: 4, color: "#ef4444" }
];
const PRIORITY_MAP = Object.fromEntries(PRIORITIES.map((p) => [p.id, p]));

const STATUSES = ["Open", "In Progress", "Resolved", "Closed"];
const STATUS_COLORS = { Open: "#3b82f6", "In Progress": "#f59e0b", Resolved: "#10b981", Closed: "#64748b" };

const SAMPLE_EMPLOYEES = [
  { id: "EMP001", name: "Aarav Sharma", department: "Sales", title: "Account Manager", location: "Mumbai", email: "aarav.sharma@rooh.example" },
  { id: "EMP002", name: "Priya Nair", department: "Sales", title: "Sales Executive", location: "Bengaluru", email: "priya.nair@rooh.example" },
  { id: "EMP003", name: "Rahul Verma", department: "Engineering", title: "Software Engineer", location: "Pune", email: "rahul.verma@rooh.example" },
  { id: "EMP004", name: "Sneha Iyer", department: "Marketing", title: "Content Strategist", location: "Chennai", email: "sneha.iyer@rooh.example" },
  { id: "EMP005", name: "Vikram Singh", department: "Operations", title: "Operations Lead", location: "Delhi", email: "vikram.singh@rooh.example" },
  { id: "EMP006", name: "Ananya Gupta", department: "Finance", title: "Financial Analyst", location: "Mumbai", email: "ananya.gupta@rooh.example" },
  { id: "EMP007", name: "Karan Patel", department: "Engineering", title: "Data Analyst", location: "Ahmedabad", email: "karan.patel@rooh.example" },
  { id: "EMP008", name: "Divya Menon", department: "Product", title: "Product Manager", location: "Bengaluru", email: "divya.menon@rooh.example" },
  { id: "EMP009", name: "Siddharth Rao", department: "Customer Success", title: "Support Specialist", location: "Hyderabad", email: "siddharth.rao@rooh.example" },
  { id: "EMP010", name: "Pooja Kulkarni", department: "Legal", title: "Legal Counsel", location: "Pune", email: "pooja.kulkarni@rooh.example" },
  { id: "EMP011", name: "Aditya Bose", department: "Design", title: "UX Designer", location: "Kolkata", email: "aditya.bose@rooh.example" },
  { id: "EMP012", name: "Fatima Sheikh", department: "Engineering", title: "DevOps Engineer", location: "Hyderabad", email: "fatima.sheikh@rooh.example" }
];

const SAMPLE_AGENTS = [
  { id: "AG01", name: "Neha Kapoor", department: "IT Service Desk", role: "Senior IT Support Engineer" },
  { id: "AG02", name: "Arjun Mehta", department: "IT Service Desk", role: "IT Support Engineer" },
  { id: "AG03", name: "Kavya Reddy", department: "Human Resources", role: "HR Business Partner" },
  { id: "AG04", name: "Rohan Das", department: "Payroll & Finance", role: "Payroll Specialist" },
  { id: "AG05", name: "Ishaan Malhotra", department: "Identity & Access Management", role: "Access Administrator" },
  { id: "AG06", name: "Meera Joshi", department: "Facilities Management", role: "Facilities Coordinator" }
];

const hoursAgo = (h) => new Date(Date.now() - h * 3600e3).toISOString();
const addHours = (iso, h) => new Date(new Date(iso).getTime() + h * 3600e3).toISOString();

/** Builds 22 realistic sample tickets with a full history trail. */
function buildSampleTickets() {
  // [employee, category, priority, status, assignee, hoursAgo, title, description, resolution, agentComment]
  const rows = [
    ["EMP001", "IT Support", "Critical", "Open", null, 6, "Email server down for entire sales floor",
      "Outlook shows 'Disconnected' for everyone on the 3rd floor since this morning. We cannot work and client emails are piling up.", "", ""],
    ["EMP002", "Software Access", "High", "In Progress", "AG05", 30, "Locked out of Salesforce account",
      "My Salesforce account is locked out after a password reset. Urgent – I have a client demo tomorrow morning.", "", "Unlock request raised with Salesforce admin; awaiting MFA re-enrolment."],
    ["EMP003", "Payroll", "High", "Open", "AG04", 10, "October salary not credited",
      "My October salary has not been credited to my bank account yet, while colleagues received theirs.", "", ""],
    ["EMP004", "HR Query", "Low", "Resolved", "AG03", 120, "Question about maternity leave policy",
      "Could you share the latest maternity leave policy and the documents needed to apply?", "Shared the 2026 Parental Leave Policy PDF and the application checklist. Leave can be applied via the HR portal under Leave > Parental.", ""],
    ["EMP005", "Workplace Facilities", "Medium", "In Progress", "AG06", 50, "Air conditioning not cooling in meeting room B2",
      "The AC in meeting room B2 blows warm air. Meetings in the afternoon are uncomfortable.", "", "Technician visit scheduled; compressor gas refill required."],
    ["EMP006", "IT Support", "Medium", "Resolved", "AG01", 90, "Laptop very slow after latest update",
      "Since the last Windows update my laptop takes 10 minutes to boot and Excel freezes often.", "Rolled back faulty driver, cleared temp files and upgraded RAM to 16 GB. Boot time now under 1 minute.", ""],
    ["EMP007", "Software Access", "Medium", "Open", null, 20, "Request Power BI Pro licence",
      "I need a Power BI Pro licence to publish dashboards to the analytics workspace for my team.", "", ""],
    ["EMP008", "Payroll", "Medium", "Closed", "AG04", 300, "Incorrect tax deduction on payslip",
      "My September payslip shows a higher TDS deduction than expected. My investment declaration was submitted.", "Investment declaration was not applied due to a sync issue. Corrected TDS and refunded excess deduction in October payroll.", ""],
    ["EMP009", "HR Query", "Medium", "Open", "AG03", 80, "Update emergency contact and address",
      "I recently moved. Please update my residential address and emergency contact in the HR records.", "", ""],
    ["EMP010", "IT Support", "High", "Resolved", "AG02", 60, "VPN keeps disconnecting",
      "The VPN disconnects every 5–10 minutes when working from home, making calls and file access fail.", "Updated VPN client to v5.2 and switched profile to the TCP gateway. Connection stable for 24h of monitoring.", ""],
    ["EMP011", "Workplace Facilities", "Low", "Open", null, 30, "Request for ergonomic chair",
      "Requesting an ergonomic chair with lumbar support for my workstation (4F-23).", "", ""],
    ["EMP012", "IT Support", "Critical", "In Progress", "AG01", 2, "Clicked a suspicious phishing link – possible malware",
      "I clicked a link in an email pretending to be from payroll. A file downloaded and my browser is behaving oddly. Possible virus.", "", "Laptop isolated from network; running full malware scan and resetting credentials."],
    ["EMP001", "HR Query", "Low", "Closed", "AG03", 400, "How to apply for an internal job posting",
      "How do I apply for the internal Product Manager opening? Do I need my manager's approval first?", "Shared internal mobility guidelines. Manager notification is required, approval is not. Apply through the Careers > Internal tab.", ""],
    ["EMP002", "Payroll", "Medium", "In Progress", "AG04", 40, "Travel reimbursement claim pending",
      "My travel expense claim for the Hyderabad client visit (₹18,450) has been pending approval for 3 weeks.", "", "Claim approved by manager; queued for next payout cycle."],
    ["EMP003", "Software Access", "Low", "Resolved", "AG05", 150, "Need Adobe Acrobat Pro installed",
      "Please install Adobe Acrobat Pro so I can edit and sign PDF contracts.", "Licence assigned and Acrobat Pro deployed via Intune. Please restart to complete activation.", ""],
    ["EMP004", "IT Support", "Medium", "Open", "AG02", 15, "Second monitor not detected",
      "My second monitor is not detected through the docking station since yesterday.", "", ""],
    ["EMP005", "Workplace Facilities", "High", "Open", "AG06", 28, "Water leakage near server room corridor",
      "There is water leaking from the ceiling near the server room corridor on the 2nd floor. The floor is slippery.", "", ""],
    ["EMP006", "HR Query", "Medium", "Resolved", "AG03", 100, "Clarification on performance review timeline",
      "When does the half-yearly performance review cycle start and when are self-assessments due?", "Self-assessments open on the 1st and are due on the 15th. Manager reviews close at month end. Calendar invite shared.", ""],
    ["EMP007", "IT Support", "Low", "Closed", "AG01", 500, "Request new wireless mouse",
      "My wireless mouse scroll wheel is broken. Requesting a replacement.", "Replacement mouse issued from IT store. Old device collected for e-waste.", ""],
    ["EMP008", "Software Access", "High", "Open", null, 5, "GitHub repository access needed for new project",
      "I need write access to the 'customer-portal' GitHub repository to start sprint work today. Deadline is this week.", "", ""],
    ["EMP009", "Payroll", "High", "In Progress", "AG04", 12, "Performance bonus missing from payslip",
      "The Q3 performance bonus communicated in my letter is missing from this month's payslip.", "", "Verified with Compensation team; bonus file update pending."],
    ["EMP010", "Workplace Facilities", "Medium", "Resolved", "AG06", 70, "Parking access card not working",
      "My parking access card stopped working at the basement gate.", "Card re-encoded at security desk and access rights renewed until March 2027.", ""]
  ];

  const nowMs = Date.now();
  const clamp = (iso) => new Date(Math.min(new Date(iso).getTime(), nowMs - 60e3)).toISOString();

  return rows.map((r, i) => {
    const [employeeId, category, priority, status, assigneeId, ago, title, description, resolution, comment] = r;
    const emp = SAMPLE_EMPLOYEES.find((e) => e.id === employeeId);
    const agent = SAMPLE_AGENTS.find((a) => a.id === assigneeId);
    const createdAt = hoursAgo(ago);
    let cursor = createdAt;
    const step = (h) => (cursor = clamp(addHours(cursor, h)));

    const history = [{ at: createdAt, by: emp.name, type: "created", text: `Ticket created with ${priority} priority` }];
    if (agent) history.push({ at: step(Math.max(0.2, ago * 0.08)), by: "Support Admin", type: "assigned", text: `Assigned to ${agent.name}` });
    if (status !== "Open") history.push({ at: step(Math.max(0.3, ago * 0.12)), by: agent ? agent.name : "Support Admin", type: "status", text: "Status changed from Open to In Progress" });
    if (comment) history.push({ at: step(Math.max(0.2, ago * 0.1)), by: agent.name, type: "comment", text: comment });

    let resolvedAt = null;
    if (status === "Resolved" || status === "Closed") {
      resolvedAt = step(ago * 0.3);
      history.push({ at: resolvedAt, by: agent.name, type: "status", text: "Status changed from In Progress to Resolved", note: resolution });
    }
    if (status === "Closed") {
      history.push({ at: step(ago * 0.2), by: emp.name, type: "status", text: "Status changed from Resolved to Closed – employee confirmed the resolution" });
    }

    return {
      id: "HD-" + (1001 + i),
      title,
      description,
      category,
      priority,
      suggestedPriority: priority,
      department: CATEGORY_MAP[category].department,
      status,
      employeeId,
      assigneeId: assigneeId || null,
      createdAt,
      updatedAt: history[history.length - 1].at,
      dueAt: addHours(createdAt, PRIORITY_MAP[priority].sla),
      resolvedAt,
      resolution: resolution || "",
      history
    };
  });
}

/** Creates unread notifications for recent status/assignment changes on sample tickets. */
function buildSampleNotifications(tickets) {
  const list = [];
  const cutoff = Date.now() - 72 * 3600e3;
  tickets.forEach((t) => {
    t.history
      .filter((h) => (h.type === "status" || h.type === "assigned") && new Date(h.at).getTime() > cutoff)
      .forEach((h) => {
        list.push({
          id: "N" + Math.random().toString(36).slice(2, 10),
          audience: "employee",
          employeeId: t.employeeId,
          ticketId: t.id,
          text: h.type === "assigned" ? `${t.id} was ${h.text.toLowerCase()}` : `${t.id}: ${h.text}`,
          at: h.at,
          read: false
        });
      });
    if (t.status === "Open" && !t.assigneeId) {
      list.push({ id: "N" + Math.random().toString(36).slice(2, 10), audience: "admin", ticketId: t.id, text: `New ${t.priority} ${t.category} ticket ${t.id} is awaiting assignment`, at: t.createdAt, read: false });
    }
  });
  return list;
}
