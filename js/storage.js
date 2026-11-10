/**
 * storage.js – localStorage persistence for tickets, employees, agents,
 * notifications and user settings.
 */
const Storage = (() => {
  const P = "rooh.helpdesk.v1.";
  const KEYS = {
    employees: P + "employees",
    agents: P + "agents",
    tickets: P + "tickets",
    notifications: P + "notifications",
    seq: P + "ticketSeq",
    settings: P + "settings"
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
      console.warn("Helpdesk: could not read", key, e);
      return fallback;
    }
  }
  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("Helpdesk: could not save", key, e);
    }
  }

  function seed() {
    const theme = read(KEYS.settings, {}).theme || "light";
    const tickets = buildSampleTickets();
    write(KEYS.employees, SAMPLE_EMPLOYEES);
    write(KEYS.agents, SAMPLE_AGENTS);
    write(KEYS.tickets, tickets);
    write(KEYS.notifications, buildSampleNotifications(tickets));
    write(KEYS.seq, 1001 + tickets.length);
    write(KEYS.settings, { role: "employee", employeeId: SAMPLE_EMPLOYEES[0].id, theme });
  }

  function init() {
    const ok = [KEYS.employees, KEYS.agents, KEYS.tickets].every((k) => Array.isArray(read(k, null)));
    if (!ok) seed();
  }

  /** Generates a unique sequential ticket ID such as HD-1023. */
  function nextTicketId() {
    const ids = new Set(read(KEYS.tickets, []).map((t) => t.id));
    let seq = Number(read(KEYS.seq, 1001)) || 1001;
    while (ids.has("HD-" + seq)) seq++;
    write(KEYS.seq, seq + 1);
    return "HD-" + seq;
  }

  function addNotification(n) {
    const list = read(KEYS.notifications, []);
    list.push({ id: "N" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), at: new Date().toISOString(), read: false, ...n });
    write(KEYS.notifications, list.slice(-200));
  }

  return {
    init,
    reset: seed,
    getEmployees: () => read(KEYS.employees, []),
    getAgents: () => read(KEYS.agents, []),
    getTickets: () => read(KEYS.tickets, []),
    saveTickets: (t) => write(KEYS.tickets, t),
    getNotifications: () => read(KEYS.notifications, []),
    saveNotifications: (n) => write(KEYS.notifications, n),
    addNotification,
    nextTicketId,
    getSettings: () => read(KEYS.settings, { role: "employee", employeeId: SAMPLE_EMPLOYEES[0].id, theme: "light" }),
    saveSettings: (patch) => write(KEYS.settings, { ...read(KEYS.settings, {}), ...patch })
  };
})();
