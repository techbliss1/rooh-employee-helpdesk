/**
 * app.js – UI controller for Rooh Helpdesk (Employee + Admin/Support workspaces).
 */
(function () {
  "use strict";

  // ---------------------------------------------------------------- helpers
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const nowIso = () => new Date().toISOString();

  const PAGES = {
    employee: {
      "emp-dashboard": ["My Dashboard", "Your support requests at a glance"],
      "emp-new": ["Raise a Ticket", "Tell us what you need help with"],
      "emp-tickets": ["My Tickets", "Track status, history and resolutions"]
    },
    admin: {
      "admin-overview": ["Support Overview", "Live helpdesk metrics and workload"],
      "admin-tickets": ["All Tickets", "Assign, update and resolve employee tickets"],
      "admin-team": ["Team & Employees", "Support agents and employee directory"]
    }
  };

  const DEFAULT_EMP_FILTERS = { q: "", category: "All", priority: "All", status: "All" };
  const DEFAULT_ADMIN_FILTERS = { q: "", category: "All", priority: "All", status: "All", assignee: "All", overdue: false };

  const state = {
    page: null,
    empFilters: { ...DEFAULT_EMP_FILTERS },
    adminFilters: { ...DEFAULT_ADMIN_FILTERS },
    modalId: null,
    priorityTouched: false,
    suggestion: null
  };
  let settings;

  const catInfo = (c) => CATEGORY_MAP[c] || { icon: "📁", color: "#64748b", department: "General Support" };
  const employee = (id) => Storage.getEmployees().find((e) => e.id === id);
  const agent = (id) => Storage.getAgents().find((a) => a.id === id);
  const initials = (name = "?") => name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const avatarColor = (name = "") => `hsl(${[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % 360} 65% 48%)`;

  const isActive = (t) => t.status === "Open" || t.status === "In Progress";
  const isOverdue = (t) => isActive(t) && Date.now() > new Date(t.dueAt).getTime();
  const isHigh = (t) => t.priority === "High" || t.priority === "Critical";

  function duration(ms) {
    const m = Math.round(Math.abs(ms) / 60000);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    return h % 24 ? `${d}d ${h % 24}h` : `${d}d`;
  }
  const timeAgo = (iso) => (Date.now() - new Date(iso) < 60000 ? "just now" : `${duration(Date.now() - new Date(iso))} ago`);
  const fmt = (iso) => (iso ? new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");

  function slaHtml(t) {
    if (!isActive(t)) return `<span class="muted">${t.resolvedAt ? "Met · " + timeAgo(t.resolvedAt) : "—"}</span>`;
    const diff = new Date(t.dueAt) - Date.now();
    return diff < 0
      ? `<span class="sla overdue">⚠ Overdue ${duration(diff)}</span>`
      : `<span class="sla ${diff < 4 * 3600e3 ? "soon" : ""}">⏱ ${duration(diff)} left</span>`;
  }
  const statusBadge = (s) => `<span class="badge st-${slug(s)}">${esc(s)}</span>`;
  const priorityBadge = (p) => `<span class="badge pr-${slug(p)}">${p === "Critical" ? "🔥 " : ""}${esc(p)}</span>`;
  const catChip = (c) => `<span class="cat-chip" style="--c:${catInfo(c).color}">${catInfo(c).icon} ${esc(c)}</span>`;
  const avatar = (name, cls = "") => `<span class="avatar ${cls}" style="background:${avatarColor(name)}">${initials(name)}</span>`;
  const rowClass = (t) => [isOverdue(t) ? "is-overdue" : "", isActive(t) && isHigh(t) ? "is-high" : ""].join(" ");

  function updateTicket(id, mutate) {
    const tickets = Storage.getTickets();
    const t = tickets.find((x) => x.id === id);
    if (!t) return null;
    mutate(t);
    t.updatedAt = nowIso();
    Storage.saveTickets(tickets);
    return t;
  }

  // ---------------------------------------------------------------- toasts & notifications
  function toast(message, kind = "info", title = "") {
    const icons = { info: "ℹ️", success: "✅", warning: "⚠️", error: "⛔" };
    const el = document.createElement("div");
    el.className = `toast ${kind}`;
    el.innerHTML = `<span class="toast-ico">${icons[kind] || "ℹ️"}</span><div>${title ? `<strong>${esc(title)}</strong>` : ""}<p>${esc(message)}</p></div>`;
    $("#toastStack").appendChild(el);
    setTimeout(() => el.classList.add("leaving"), 3800);
    setTimeout(() => el.remove(), 4300);
  }

  function notify(n) {
    Storage.addNotification(n);
    renderBell();
  }

  function myNotifications() {
    const all = Storage.getNotifications();
    const list = settings.role === "admin"
      ? all.filter((n) => n.audience === "admin")
      : all.filter((n) => n.audience === "employee" && n.employeeId === settings.employeeId);
    return list.sort((a, b) => b.at.localeCompare(a.at));
  }

  function renderBell() {
    const list = myNotifications();
    const unread = list.filter((n) => !n.read).length;
    const badge = $("#bellCount");
    badge.textContent = unread > 9 ? "9+" : unread;
    badge.classList.toggle("hidden", unread === 0);
    $("#notifList").innerHTML = list.length
      ? list.slice(0, 15).map((n) => `<li class="${n.read ? "" : "unread"}" data-ticket="${n.ticketId}" data-nid="${n.id}">
          <p>${esc(n.text)}</p><small>${timeAgo(n.at)}</small></li>`).join("")
      : `<li class="empty-li">You're all caught up 🎉</li>`;
  }

  function markRead(ids) {
    const all = Storage.getNotifications();
    all.forEach((n) => { if (!ids || ids.includes(n.id)) n.read = true; });
    Storage.saveNotifications(all);
    renderBell();
  }

  // ---------------------------------------------------------------- navigation & role
  function setRole(role) {
    settings.role = role;
    Storage.saveSettings({ role });
    $$(".role-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.role === role);
      b.setAttribute("aria-selected", b.dataset.role === role);
    });
    $("#navEmployee").classList.toggle("hidden", role !== "employee");
    $("#navAdmin").classList.toggle("hidden", role !== "admin");
    $("#employeeSelect").classList.toggle("hidden", role !== "employee");
    $("#adminName").classList.toggle("hidden", role !== "admin");
    $("#identityLabel").textContent = role === "admin" ? "Support workspace" : "Signed in as";
    renderIdentity();
    renderBell();
    navigate(role === "admin" ? "admin-overview" : "emp-dashboard");
    const unread = myNotifications().filter((n) => !n.read).length;
    if (unread) toast(`You have ${unread} unread notification${unread > 1 ? "s" : ""}.`, "info", "Updates waiting");
  }

  function renderIdentity() {
    const name = settings.role === "admin" ? "Support Admin" : employee(settings.employeeId)?.name || "?";
    const av = $("#identityAvatar");
    av.textContent = initials(name);
    av.style.background = avatarColor(name);
  }

  function navigate(page) {
    const pages = PAGES[settings.role];
    if (!pages[page]) page = Object.keys(pages)[0];
    state.page = page;
    $$(".page").forEach((p) => p.classList.toggle("active", p.id === "page-" + page));
    $$(".nav-link").forEach((a) => a.classList.toggle("active", a.dataset.page === page));
    $("#pageTitle").textContent = pages[page][0];
    $("#pageSubtitle").textContent = pages[page][1];
    closeSidebar();
    renderPage();
    window.scrollTo && window.scrollTo(0, 0);
  }

  function renderPage() {
    renderNavCounts();
    ({
      "emp-dashboard": renderEmpDashboard,
      "emp-new": renderSmartPanel,
      "emp-tickets": renderEmpTickets,
      "admin-overview": renderAdminOverview,
      "admin-tickets": renderAdminTickets,
      "admin-team": renderTeam
    }[state.page] || (() => {}))();
  }

  function renderNavCounts() {
    const tickets = Storage.getTickets();
    const mine = tickets.filter((t) => t.employeeId === settings.employeeId && isActive(t)).length;
    const pending = tickets.filter(isActive).length;
    $("#navMyCount").textContent = mine || "";
    $("#navPendingCount").textContent = pending || "";
  }

  const openSidebar = () => { $("#sidebar").classList.add("open"); $("#backdrop").classList.add("show"); };
  const closeSidebar = () => { $("#sidebar").classList.remove("open"); $("#backdrop").classList.remove("show"); };

  function statCard(icon, label, value, color, sub = "", attrs = "") {
    return `<div class="stat-card" style="--accent:${color}" ${attrs}>
      <div class="stat-icon">${icon}</div>
      <div><div class="stat-value">${value}</div><div class="stat-label">${label}</div>${sub ? `<div class="stat-sub">${sub}</div>` : ""}</div>
    </div>`;
  }

  function ticketItem(t, showEmployee = false) {
    const who = showEmployee ? esc(employee(t.employeeId)?.name || "") + " · " : "";
    return `<button class="ticket-item ${rowClass(t)}" data-ticket="${t.id}">
      <div class="ti-main">
        <div class="ti-top"><span class="ti-id">${t.id}</span>${priorityBadge(t.priority)}${statusBadge(t.status)}</div>
        <div class="ti-title">${esc(t.title)}</div>
        <div class="ti-meta">${who}${catInfo(t.category).icon} ${esc(t.category)} · updated ${timeAgo(t.updatedAt)}</div>
      </div>
      <div class="ti-sla">${slaHtml(t)}</div>
    </button>`;
  }

  // ---------------------------------------------------------------- EMPLOYEE: dashboard
  function renderEmpDashboard() {
    const emp = employee(settings.employeeId);
    if (!emp) return;
    const mine = Storage.getTickets().filter((t) => t.employeeId === emp.id);
    const count = (s) => mine.filter((t) => t.status === s).length;
    $("#empWelcome").textContent = emp.name.split(" ")[0];
    $("#empInfo").textContent = `${emp.title} · ${emp.department} · ${emp.location}`;
    $("#empStats").innerHTML =
      statCard("🎫", "Total tickets", mine.length, "#6366f1") +
      statCard("📬", "Open", count("Open"), STATUS_COLORS.Open) +
      statCard("⚙️", "In progress", count("In Progress"), STATUS_COLORS["In Progress"]) +
      statCard("✅", "Resolved / closed", count("Resolved") + count("Closed"), STATUS_COLORS.Resolved);

    const recent = [...mine].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);
    $("#empRecent").innerHTML = recent.length
      ? recent.map((t) => ticketItem(t)).join("")
      : `<div class="empty">No tickets yet. <button class="link-btn" data-goto="emp-new">Raise your first ticket →</button></div>`;

    const updates = myNotifications().slice(0, 6);
    $("#empUpdates").innerHTML = updates.length
      ? updates.map((n) => `<li class="${n.read ? "" : "unread"}" data-ticket="${n.ticketId}"><span class="dot-ind"></span><div><p>${esc(n.text)}</p><small>${timeAgo(n.at)}</small></div></li>`).join("")
      : `<li class="empty-li">No updates yet.</li>`;
  }

  // ---------------------------------------------------------------- EMPLOYEE: new ticket + smart assist
  function renderSmartPanel() {
    const title = $("#tTitle").value;
    const desc = $("#tDescription").value;
    const text = `${title} ${desc}`;
    const category = $("#tCategory").value;
    $("#descCount").textContent = desc.length;

    // Priority suggestion
    const s = Smart.suggestPriority(text);
    state.suggestion = s.priority;
    if (!state.priorityTouched) $("#tPriority").value = s.priority;
    $("#priorityAuto").classList.toggle("hidden", state.priorityTouched);
    const differs = state.priorityTouched && $("#tPriority").value !== s.priority;
    $("#smartPriority").innerHTML = `${priorityBadge(s.priority)}
      <p class="small muted">${esc(s.reason)}</p>
      ${differs ? `<button type="button" class="btn btn-sm btn-soft" id="applyPriority">Use suggested (${s.priority})</button>` : ""}`;

    // Category hint
    const guess = Smart.suggestCategory(text);
    if (guess && guess !== category) {
      $("#smartCategory").innerHTML = `<p>Looks like ${catChip(guess)}</p>
        <button type="button" class="btn btn-sm btn-soft" id="applyCategory" data-cat="${esc(guess)}">Use this category</button>`;
    } else if (category) {
      $("#smartCategory").innerHTML = `<p>${catChip(category)} <span class="ok">✓ selected</span></p>`;
    } else {
      $("#smartCategory").innerHTML = `<p class="small muted">Describe the issue and we'll suggest a category.</p>`;
    }

    // Department routing
    const dept = Smart.suggestDepartment(category || guess);
    if (dept) {
      const team = Storage.getAgents().filter((a) => a.department === dept.name);
      $("#smartDept").innerHTML = `<div class="dept-card">
        <div class="dept-ico">${dept.icon}</div>
        <div><strong>${esc(dept.name)}</strong><p class="small muted">${esc(dept.description)}</p>
        <p class="small">📧 ${esc(dept.email)} · 🕘 ${esc(dept.hours)}</p>
        <p class="small">👥 ${team.map((a) => esc(a.name)).join(", ") || "—"}</p></div></div>`;
    } else {
      $("#smartDept").innerHTML = `<p class="small muted">Select a category to see the responsible team.</p>`;
    }

    const p = PRIORITY_MAP[$("#tPriority").value];
    $("#smartSla").innerHTML = `<p><strong>${p.id}</strong> tickets are targeted for resolution within <strong>${p.sla < 24 ? p.sla + " hours" : p.sla / 24 + " days"}</strong>.</p>`;
  }

  function resetForm() {
    $("#ticketForm").reset();
    state.priorityTouched = false;
    $("#formError").textContent = "";
    renderSmartPanel();
  }

  function submitTicket(e) {
    e.preventDefault();
    const err = $("#formError");
    const title = $("#tTitle").value.trim();
    const category = $("#tCategory").value;
    const priority = $("#tPriority").value;
    const description = $("#tDescription").value.trim();
    if (title.length < 5) return (err.textContent = "Please enter a title of at least 5 characters.");
    if (!category) return (err.textContent = "Please choose a category.");
    if (description.length < 10) return (err.textContent = "Please describe the issue (at least 10 characters).");
    err.textContent = "";

    const emp = employee(settings.employeeId);
    const suggested = Smart.suggestPriority(`${title} ${description}`).priority;
    const dept = Smart.suggestDepartment(category);
    const id = Storage.nextTicketId();
    const createdAt = nowIso();
    const ticket = {
      id, title, description, category, priority,
      suggestedPriority: suggested,
      department: dept.name,
      status: "Open",
      employeeId: emp.id,
      assigneeId: null,
      createdAt,
      updatedAt: createdAt,
      dueAt: new Date(Date.now() + PRIORITY_MAP[priority].sla * 3600e3).toISOString(),
      resolvedAt: null,
      resolution: "",
      history: [
        { at: createdAt, by: emp.name, type: "created", text: `Ticket created with ${priority} priority${suggested !== priority ? ` (smart suggestion was ${suggested})` : ""}` },
        { at: createdAt, by: "System", type: "routed", text: `Routed to ${dept.name}` }
      ]
    };
    const tickets = Storage.getTickets();
    tickets.push(ticket);
    Storage.saveTickets(tickets);
    notify({ audience: "admin", ticketId: id, text: `New ${priority} ${category} ticket ${id} from ${emp.name}: "${title}"` });
    toast(`Ticket ${id} has been routed to ${dept.name}.`, "success", "Ticket submitted");
    resetForm();
    navigate("emp-tickets");
    openTicket(id);
  }

  // ---------------------------------------------------------------- filtering
  function applyFilters(list, f) {
    const q = (f.q || "").trim().toLowerCase();
    return list.filter((t) =>
      (f.category === "All" || t.category === f.category) &&
      (f.priority === "All" || t.priority === f.priority || (f.priority === "HighPlus" && isHigh(t))) &&
      (f.status === "All" || t.status === f.status || (f.status === "Active" && isActive(t)) || (f.status === "Done" && !isActive(t))) &&
      (!f.assignee || f.assignee === "All" || (f.assignee === "unassigned" ? !t.assigneeId : t.assigneeId === f.assignee)) &&
      (!f.overdue || isOverdue(t)) &&
      (!q || [t.id, t.title, t.description, employee(t.employeeId)?.name, agent(t.assigneeId)?.name]
        .some((v) => (v || "").toLowerCase().includes(q))));
  }

  const smartSort = (a, b) =>
    (isActive(b) - isActive(a)) ||
    (isOverdue(b) - isOverdue(a)) ||
    (PRIORITY_MAP[b.priority].rank - PRIORITY_MAP[a.priority].rank) ||
    b.createdAt.localeCompare(a.createdAt);

  // ---------------------------------------------------------------- EMPLOYEE: my tickets
  function renderEmpTickets() {
    const mine = Storage.getTickets().filter((t) => t.employeeId === settings.employeeId);
    const rows = applyFilters(mine, state.empFilters).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    $("#empEmpty").classList.toggle("hidden", rows.length > 0);
    $("#empTable").innerHTML = rows.map((t) => `<tr class="clickable ${rowClass(t)}" data-ticket="${t.id}">
      <td><div class="t-id">${t.id}</div><div class="t-title">${esc(t.title)}</div></td>
      <td>${catChip(t.category)}</td>
      <td>${priorityBadge(t.priority)}</td>
      <td>${statusBadge(t.status)}</td>
      <td>${t.assigneeId ? esc(agent(t.assigneeId)?.name) : '<span class="muted">Awaiting assignment</span>'}</td>
      <td><span title="${fmt(t.createdAt)}">${timeAgo(t.createdAt)}</span></td>
      <td>${slaHtml(t)}</td></tr>`).join("");
  }

  // ---------------------------------------------------------------- ADMIN: overview
  function renderAdminOverview() {
    const tickets = Storage.getTickets();
    const active = tickets.filter(isActive);
    const resolved = tickets.filter((t) => !isActive(t));
    const high = active.filter(isHigh);
    const overdue = active.filter(isOverdue);
    const unassigned = active.filter((t) => !t.assigneeId);

    $("#adminStats").innerHTML =
      statCard("🎫", "Total tickets", tickets.length, "#6366f1", `${tickets.filter((t) => Date.now() - new Date(t.createdAt) < 7 * 86400e3).length} in last 7 days`, 'data-filter="all"') +
      statCard("⏳", "Pending", active.length, STATUS_COLORS["In Progress"], `${tickets.filter((t) => t.status === "Open").length} open · ${tickets.filter((t) => t.status === "In Progress").length} in progress`, 'data-filter="pending"') +
      statCard("✅", "Resolved", resolved.length, STATUS_COLORS.Resolved, `${tickets.length ? Math.round((resolved.length / tickets.length) * 100) : 0}% resolution rate`, 'data-filter="resolved"') +
      statCard("🔥", "High priority", high.length, "#ef4444", "Active High + Critical", 'data-filter="high"') +
      statCard("⚠️", "Overdue", overdue.length, "#dc2626", "Past SLA target", 'data-filter="overdue"') +
      statCard("📥", "Unassigned", unassigned.length, "#0ea5e9", "Awaiting an agent", 'data-filter="unassigned"');

    Charts.donut($("#catChart"),
      CATEGORIES.map((c) => ({ label: c.id, value: tickets.filter((t) => t.category === c.id).length, color: c.color })),
      { centerLabel: "tickets", ariaLabel: "Tickets by category", onClick: (label) => goFiltered({ category: label }) });

    Charts.bars($("#statusChart"),
      STATUSES.map((s) => ({ label: s, value: tickets.filter((t) => t.status === s).length, color: STATUS_COLORS[s] })),
      { onClick: (label) => goFiltered({ status: label }) });

    Charts.bars($("#priorityChart"),
      [...PRIORITIES].reverse().map((p) => ({ label: p.id, value: active.filter((t) => t.priority === p.id).length, color: p.color })),
      { onClick: (label) => goFiltered({ priority: label, status: "Active" }) });

    Charts.bars($("#workloadChart"),
      Storage.getAgents().map((a) => ({ label: a.name, sub: a.department, value: active.filter((t) => t.assigneeId === a.id).length, color: "var(--primary)" })),
      { onClick: (label) => { const a = Storage.getAgents().find((x) => x.name === label); goFiltered({ assignee: a.id }); } });

    const attention = active.filter((t) => isOverdue(t) || isHigh(t)).sort(smartSort).slice(0, 8);
    $("#attentionList").innerHTML = attention.length
      ? attention.map((t) => ticketItem(t, true)).join("")
      : `<div class="empty">Nothing urgent right now 🎉</div>`;
  }

  function goFiltered(f) {
    state.adminFilters = { ...DEFAULT_ADMIN_FILTERS, ...f };
    syncAdminFilterInputs();
    navigate("admin-tickets");
  }

  // ---------------------------------------------------------------- ADMIN: all tickets
  function agentOptions(selected, category) {
    const suggestedDept = catInfo(category).department;
    const agents = Storage.getAgents().sort((a, b) => (b.department === suggestedDept) - (a.department === suggestedDept));
    return `<option value="">— Unassigned —</option>` + agents.map((a) =>
      `<option value="${a.id}" ${a.id === selected ? "selected" : ""}>${a.department === suggestedDept ? "★ " : ""}${esc(a.name)} · ${esc(a.department)}</option>`).join("");
  }

  function renderAdminTickets() {
    const all = Storage.getTickets();
    const rows = applyFilters(all, state.adminFilters).sort(smartSort);
    $("#adResultInfo").textContent = `Showing ${rows.length} of ${all.length} tickets · ★ = agents from the suggested department`;
    $("#adEmpty").classList.toggle("hidden", rows.length > 0);
    $("#adTable").innerHTML = rows.map((t) => {
      const emp = employee(t.employeeId);
      return `<tr class="clickable ${rowClass(t)}" data-ticket="${t.id}">
        <td><div class="t-id">${t.id}${isOverdue(t) ? ' <span class="flag">OVERDUE</span>' : ""}</div><div class="t-title">${esc(t.title)}</div></td>
        <td><div class="emp-cell">${avatar(emp?.name || "?", "sm")}<div><div>${esc(emp?.name)}</div><small class="muted">${esc(emp?.department)}</small></div></div></td>
        <td>${catChip(t.category)}</td>
        <td>${priorityBadge(t.priority)}</td>
        <td>${statusBadge(t.status)}</td>
        <td><select class="inline-assign" data-assign="${t.id}" aria-label="Assign ${t.id}">${agentOptions(t.assigneeId, t.category)}</select></td>
        <td>${slaHtml(t)}</td>
        <td><button class="btn btn-sm btn-soft" data-ticket="${t.id}">Manage</button></td>
      </tr>`;
    }).join("");
  }

  function syncAdminFilterInputs() {
    const f = state.adminFilters;
    $("#adSearch").value = f.q;
    $("#adCat").value = f.category;
    $("#adPri").value = f.priority;
    $("#adStatus").value = f.status;
    $("#adAssignee").value = f.assignee;
    $("#adOverdue").checked = f.overdue;
  }

  function assignTicket(id, agentId) {
    const a = agent(agentId);
    const t = updateTicket(id, (t) => {
      t.assigneeId = agentId || null;
      t.history.push({ at: nowIso(), by: "Support Admin", type: "assigned", text: a ? `Assigned to ${a.name}` : "Unassigned" });
    });
    if (!t) return;
    if (a) notify({ audience: "employee", employeeId: t.employeeId, ticketId: id, text: `${id} has been assigned to ${a.name} (${a.department})` });
    toast(a ? `${id} assigned to ${a.name}.` : `${id} is now unassigned.`, "success", "Assignment updated");
    renderPage();
  }

  // ---------------------------------------------------------------- ADMIN: team
  function renderTeam() {
    const tickets = Storage.getTickets();
    $("#teamGrid").innerHTML = Storage.getAgents().map((a) => {
      const mine = tickets.filter((t) => t.assigneeId === a.id);
      const act = mine.filter(isActive);
      const done = mine.filter((t) => !isActive(t));
      const od = act.filter(isOverdue).length;
      return `<div class="team-card" data-agent="${a.id}">
        ${avatar(a.name, "lg")}
        <h4>${esc(a.name)}</h4>
        <p class="muted small">${esc(a.role)}</p>
        <span class="dept-pill">${DEPARTMENTS[a.department].icon} ${esc(a.department)}</span>
        <div class="team-stats">
          <div><strong>${act.length}</strong><small>Active</small></div>
          <div><strong>${done.length}</strong><small>Resolved</small></div>
          <div class="${od ? "danger" : ""}"><strong>${od}</strong><small>Overdue</small></div>
        </div>
      </div>`;
    }).join("");

    $("#employeeTable").innerHTML = Storage.getEmployees().map((e) => {
      const mine = tickets.filter((t) => t.employeeId === e.id);
      return `<tr><td><div class="emp-cell">${avatar(e.name, "sm")}<div><div>${esc(e.name)}</div><small class="muted">${e.id} · ${esc(e.title)}</small></div></div></td>
        <td>${esc(e.department)}</td><td>${esc(e.location)}</td><td>${mine.length}</td><td>${mine.filter(isActive).length}</td></tr>`;
    }).join("");
  }

  // ---------------------------------------------------------------- ticket modal
  function openTicket(id) {
    if (!Storage.getTickets().some((t) => t.id === id)) return;
    state.modalId = id;
    renderModal();
    $("#ticketModal").classList.remove("hidden");
    document.body.classList.add("no-scroll");
  }
  function closeModal() {
    state.modalId = null;
    $("#ticketModal").classList.add("hidden");
    document.body.classList.remove("no-scroll");
  }

  function renderModal() {
    const t = Storage.getTickets().find((x) => x.id === state.modalId);
    if (!t) return closeModal();
    const emp = employee(t.employeeId);
    const ag = agent(t.assigneeId);
    $("#mId").textContent = `${t.id} · ${t.department}`;
    $("#mTitle").textContent = t.title;
    $("#mBadges").innerHTML = `${statusBadge(t.status)}${priorityBadge(t.priority)}${catChip(t.category)}${isOverdue(t) ? '<span class="flag">OVERDUE</span>' : ""}`;
    $("#mDescription").textContent = t.description;
    $("#mResolution").innerHTML = t.resolution
      ? `<div class="resolution"><h4>✅ Resolution</h4><p>${esc(t.resolution)}</p><small>${t.resolvedAt ? "Resolved " + fmt(t.resolvedAt) : ""}${ag ? " by " + esc(ag.name) : ""}</small></div>`
      : "";

    const typeIcon = { created: "🆕", routed: "🧭", assigned: "👤", status: "🔄", comment: "💬" };
    $("#mTimeline").innerHTML = [...t.history].reverse().map((h) => `<li class="tl-${h.type}">
      <span class="tl-ico">${typeIcon[h.type] || "•"}</span>
      <div><p>${esc(h.text)}</p>${h.note ? `<blockquote>${esc(h.note)}</blockquote>` : ""}
      <small>${esc(h.by)} · ${fmt(h.at)}</small></div></li>`).join("");

    $("#mMeta").innerHTML = `
      <dt>Raised by</dt><dd>${esc(emp?.name)}<small>${esc(emp?.department)} · ${esc(emp?.email)}</small></dd>
      <dt>Assigned to</dt><dd>${ag ? `${esc(ag.name)}<small>${esc(ag.department)}</small>` : '<span class="muted">Unassigned</span>'}</dd>
      <dt>Priority</dt><dd>${esc(t.priority)}${t.suggestedPriority && t.suggestedPriority !== t.priority ? `<small>Smart suggestion: ${esc(t.suggestedPriority)}</small>` : ""}</dd>
      <dt>Created</dt><dd>${fmt(t.createdAt)}</dd>
      <dt>Last updated</dt><dd>${fmt(t.updatedAt)}</dd>
      <dt>SLA target</dt><dd>${fmt(t.dueAt)}<small>${slaHtml(t)}</small></dd>`;

    $("#mActions").innerHTML = settings.role === "admin" ? adminActionsHtml(t) : employeeActionsHtml(t);
  }

  function adminActionsHtml(t) {
    return `<h4>Update ticket</h4>
      <label for="mAssignee">Assign to</label>
      <select id="mAssignee">${agentOptions(t.assigneeId, t.category)}</select>
      <label for="mStatus">Status</label>
      <select id="mStatus">${STATUSES.map((s) => `<option ${s === t.status ? "selected" : ""}>${s}</option>`).join("")}</select>
      <label for="mPriorityEdit">Priority</label>
      <select id="mPriorityEdit">${PRIORITIES.map((p) => `<option ${p.id === t.priority ? "selected" : ""}>${p.id}</option>`).join("")}</select>
      <label for="mNote">Comment / resolution details</label>
      <textarea id="mNote" rows="4" placeholder="Add a progress note, or describe the resolution when resolving."></textarea>
      <p class="form-error" id="mError"></p>
      <button class="btn btn-primary btn-block" id="adminSave">Save update</button>`;
  }

  function employeeActionsHtml(t) {
    if (t.employeeId !== settings.employeeId) return "";
    let html = `<h4>Add a comment</h4>
      <textarea id="mNote" rows="3" placeholder="Share more details or reply to the support team"></textarea>
      <p class="form-error" id="mError"></p>
      <button class="btn btn-soft btn-block" id="empComment">Add comment</button>`;
    if (t.status === "Resolved") {
      html += `<div class="confirm-box"><p>Is your issue fixed?</p>
        <button class="btn btn-primary btn-block" id="empClose">✔ Yes, close ticket</button>
        <button class="btn btn-ghost btn-block" id="empReopen">↺ No, reopen</button></div>`;
    } else if (t.status === "Closed") {
      html = `<div class="confirm-box"><p>This ticket is closed. Still having trouble?</p>
        <button class="btn btn-ghost btn-block" id="empReopen">↺ Reopen ticket</button></div>`;
    }
    return html;
  }

  function adminSave() {
    const id = state.modalId;
    const t0 = Storage.getTickets().find((x) => x.id === id);
    const status = $("#mStatus").value;
    const assigneeId = $("#mAssignee").value || null;
    const priority = $("#mPriorityEdit").value;
    const note = $("#mNote").value.trim();

    if (status === "Resolved" && t0.status !== "Resolved" && !note) {
      $("#mError").textContent = "Please add resolution details before resolving the ticket.";
      return;
    }
    const changes = [];
    updateTicket(id, (t) => {
      const at = nowIso();
      if (assigneeId !== t.assigneeId) {
        const a = agent(assigneeId);
        t.assigneeId = assigneeId;
        t.history.push({ at, by: "Support Admin", type: "assigned", text: a ? `Assigned to ${a.name}` : "Unassigned" });
        if (a) changes.push(`assigned to ${a.name}`);
      }
      if (priority !== t.priority) {
        t.history.push({ at, by: "Support Admin", type: "status", text: `Priority changed from ${t.priority} to ${priority}` });
        t.priority = priority;
        t.dueAt = new Date(new Date(t.createdAt).getTime() + PRIORITY_MAP[priority].sla * 3600e3).toISOString();
        changes.push(`priority set to ${priority}`);
      }
      if (status !== t.status) {
        t.history.push({ at, by: "Support Admin", type: "status", text: `Status changed from ${t.status} to ${status}`, note: note || undefined });
        if (status === "Resolved") { t.resolution = note; t.resolvedAt = at; }
        if (status === "Open" || status === "In Progress") t.resolvedAt = null;
        if (status === "Closed" && !t.resolvedAt) t.resolvedAt = at;
        t.status = status;
        changes.push(`status changed to ${status}`);
      } else if (note) {
        t.history.push({ at, by: "Support Admin", type: "comment", text: note });
        changes.push("new comment from support");
      }
    });

    if (!changes.length) {
      $("#mError").textContent = "No changes to save.";
      return;
    }
    notify({ audience: "employee", employeeId: t0.employeeId, ticketId: id, text: `${id}: ${changes.join(", ")}` });
    const statusChanged = status !== t0.status;
    toast(`${id}: ${changes.join(", ")}. The employee has been notified.`, statusChanged ? "success" : "info", statusChanged ? "Status updated" : "Ticket updated");
    renderModal();
    renderPage();
  }

  function employeeAction(kind) {
    const id = state.modalId;
    const emp = employee(settings.employeeId);
    const note = ($("#mNote")?.value || "").trim();
    if (kind === "comment" && !note) {
      $("#mError").textContent = "Please type a comment first.";
      return;
    }
    updateTicket(id, (t) => {
      const at = nowIso();
      if (kind === "comment") t.history.push({ at, by: emp.name, type: "comment", text: note });
      if (kind === "close") {
        t.history.push({ at, by: emp.name, type: "status", text: "Status changed from Resolved to Closed – employee confirmed the resolution" });
        t.status = "Closed";
      }
      if (kind === "reopen") {
        t.history.push({ at, by: emp.name, type: "status", text: `Status changed from ${t.status} to Open – reopened by employee`, note: note || undefined });
        t.status = "Open";
        t.resolvedAt = null;
        t.dueAt = new Date(Date.now() + PRIORITY_MAP[t.priority].sla * 3600e3).toISOString();
      }
    });
    const msgs = { comment: "commented on", close: "confirmed and closed", reopen: "reopened" };
    notify({ audience: "admin", ticketId: id, text: `${emp.name} ${msgs[kind]} ${id}` });
    toast(kind === "comment" ? "Your comment was added." : `Ticket ${id} ${kind === "close" ? "closed" : "reopened"}.`, kind === "reopen" ? "warning" : "success",
      kind === "comment" ? "Comment added" : "Status updated");
    renderModal();
    renderPage();
  }

  // ---------------------------------------------------------------- theme
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    $("#themeBtn").textContent = theme === "dark" ? "☀️" : "🌙";
    settings.theme = theme;
    Storage.saveSettings({ theme });
  }

  // ---------------------------------------------------------------- setup
  function fillSelect(sel, items, allLabel) {
    $(sel).innerHTML = (allLabel ? `<option value="All">${allLabel}</option>` : "") + items.map((i) => `<option value="${esc(i.value)}">${esc(i.label)}</option>`).join("");
  }

  function populateStaticSelects() {
    const cats = CATEGORIES.map((c) => ({ value: c.id, label: `${c.icon} ${c.id}` }));
    const pris = PRIORITIES.map((p) => ({ value: p.id, label: p.id }));
    const sts = STATUSES.map((s) => ({ value: s, label: s }));
    $("#tCategory").innerHTML = `<option value="">Select a category…</option>` + cats.map((c) => `<option value="${c.value}">${c.label}</option>`).join("");
    fillSelect("#tPriority", pris);
    fillSelect("#empCat", cats, "All categories");
    fillSelect("#empPri", pris, "All priorities");
    fillSelect("#empStatus", sts, "All statuses");
    fillSelect("#adCat", cats, "All categories");
    fillSelect("#adPri", [{ value: "HighPlus", label: "High & Critical" }, ...pris], "All priorities");
    fillSelect("#adStatus", [{ value: "Active", label: "Pending (Open + In Progress)" }, { value: "Done", label: "Resolved + Closed" }, ...sts], "All statuses");
    $("#adAssignee").innerHTML = `<option value="All">All assignees</option><option value="unassigned">Unassigned</option>` +
      Storage.getAgents().map((a) => `<option value="${a.id}">${esc(a.name)}</option>`).join("");
    $("#employeeSelect").innerHTML = Storage.getEmployees().map((e) => `<option value="${e.id}">${esc(e.name)}</option>`).join("");
    $("#employeeSelect").value = settings.employeeId;
  }

  function bindEvents() {
    // global delegated clicks: open ticket / go to page
    document.addEventListener("click", (e) => {
      const goto = e.target.closest("[data-goto]");
      if (goto) { e.preventDefault(); navigate(goto.dataset.goto); return; }
      if (e.target.closest(".inline-assign")) return;
      const tk = e.target.closest("[data-ticket]");
      if (tk) {
        if (tk.dataset.nid) markRead([tk.dataset.nid]);
        $("#notifPanel").classList.add("hidden");
        openTicket(tk.dataset.ticket);
      }
      if (!e.target.closest(".bell-wrap")) $("#notifPanel").classList.add("hidden");
    });

    $$(".nav-link").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); navigate(a.dataset.page); }));
    $$(".role-btn").forEach((b) => b.addEventListener("click", () => setRole(b.dataset.role)));
    $("#menuBtn").addEventListener("click", openSidebar);
    $("#backdrop").addEventListener("click", closeSidebar);

    $("#employeeSelect").addEventListener("change", (e) => {
      settings.employeeId = e.target.value;
      Storage.saveSettings({ employeeId: settings.employeeId });
      renderIdentity();
      renderBell();
      renderPage();
      const unread = myNotifications().filter((n) => !n.read).length;
      toast(`Now viewing as ${employee(settings.employeeId).name}${unread ? ` · ${unread} unread update(s)` : ""}.`, "info");
    });

    $("#bellBtn").addEventListener("click", (e) => { e.stopPropagation(); $("#notifPanel").classList.toggle("hidden"); });
    $("#markReadBtn").addEventListener("click", (e) => {
      e.stopPropagation();
      markRead(myNotifications().map((n) => n.id));
      renderPage();
    });
    $("#themeBtn").addEventListener("click", () => applyTheme(settings.theme === "dark" ? "light" : "dark"));

    $("#resetBtn").addEventListener("click", () => {
      if (!confirm("Reset all tickets, notifications and settings to the original demo data?")) return;
      Storage.reset();
      settings = Storage.getSettings();
      state.empFilters = { ...DEFAULT_EMP_FILTERS };
      state.adminFilters = { ...DEFAULT_ADMIN_FILTERS };
      populateStaticSelects();
      syncAdminFilterInputs();
      ["#empSearch", "#empCat", "#empPri", "#empStatus"].forEach((s, i) => ($(s).value = i ? "All" : ""));
      resetForm();
      closeModal();
      applyTheme(settings.theme);
      setRole(settings.role);
      toast("Demo data has been restored.", "success", "Reset complete");
    });

    // new ticket form
    $("#ticketForm").addEventListener("submit", submitTicket);
    $("#clearForm").addEventListener("click", resetForm);
    ["#tTitle", "#tDescription"].forEach((s) => $(s).addEventListener("input", renderSmartPanel));
    $("#tCategory").addEventListener("change", renderSmartPanel);
    $("#tPriority").addEventListener("change", () => { state.priorityTouched = true; renderSmartPanel(); });
    $("#page-emp-new").addEventListener("click", (e) => {
      if (e.target.id === "applyPriority") { $("#tPriority").value = state.suggestion; state.priorityTouched = false; renderSmartPanel(); }
      if (e.target.id === "applyCategory") { $("#tCategory").value = e.target.dataset.cat; renderSmartPanel(); }
    });

    // employee filters
    const empMap = { "#empSearch": "q", "#empCat": "category", "#empPri": "priority", "#empStatus": "status" };
    Object.entries(empMap).forEach(([sel, key]) => $(sel).addEventListener(sel === "#empSearch" ? "input" : "change", (e) => {
      state.empFilters[key] = e.target.value;
      renderEmpTickets();
    }));
    $("#empClear").addEventListener("click", () => {
      state.empFilters = { ...DEFAULT_EMP_FILTERS };
      Object.keys(empMap).forEach((s, i) => ($(s).value = i ? "All" : ""));
      renderEmpTickets();
    });

    // admin filters
    const adMap = { "#adSearch": "q", "#adCat": "category", "#adPri": "priority", "#adStatus": "status", "#adAssignee": "assignee" };
    Object.entries(adMap).forEach(([sel, key]) => $(sel).addEventListener(sel === "#adSearch" ? "input" : "change", (e) => {
      state.adminFilters[key] = e.target.value;
      renderAdminTickets();
    }));
    $("#adOverdue").addEventListener("change", (e) => { state.adminFilters.overdue = e.target.checked; renderAdminTickets(); });
    $("#adClear").addEventListener("click", () => { state.adminFilters = { ...DEFAULT_ADMIN_FILTERS }; syncAdminFilterInputs(); renderAdminTickets(); });
    $("#adTable").addEventListener("change", (e) => { if (e.target.dataset.assign) assignTicket(e.target.dataset.assign, e.target.value); });
    $("#viewOverdue").addEventListener("click", () => goFiltered({ overdue: true }));

    // stat cards act as quick filters
    $("#adminStats").addEventListener("click", (e) => {
      const card = e.target.closest("[data-filter]");
      if (!card) return;
      const map = {
        all: {},
        pending: { status: "Active" },
        resolved: { status: "Done" },
        high: { priority: "HighPlus", status: "Active" },
        overdue: { overdue: true },
        unassigned: { assignee: "unassigned" }
      };
      goFiltered(map[card.dataset.filter]);
    });

    // modal
    $("#modalClose").addEventListener("click", closeModal);
    $("#ticketModal").addEventListener("click", (e) => {
      if (e.target.id === "ticketModal") closeModal();
      if (e.target.id === "adminSave") adminSave();
      if (e.target.id === "empComment") employeeAction("comment");
      if (e.target.id === "empClose") employeeAction("close");
      if (e.target.id === "empReopen") employeeAction("reopen");
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeModal(); closeSidebar(); } });

    // keep SLA timers fresh
    setInterval(() => { renderPage(); if (state.modalId) renderModal(); }, 60000);
  }

  function init() {
    Storage.init();
    settings = Storage.getSettings();
    if (!employee(settings.employeeId)) settings.employeeId = Storage.getEmployees()[0].id;
    populateStaticSelects();
    applyTheme(settings.theme || "light");
    bindEvents();
    renderSmartPanel();
    setRole(settings.role === "admin" ? "admin" : "employee");
  }

  document.addEventListener("DOMContentLoaded", init);
})();
