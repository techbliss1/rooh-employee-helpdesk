/**
 * smart.js – Rule-based "smart" helpers (no AI service or backend required).
 *  - suggestPriority(text):  keyword-based urgency detection
 *  - suggestCategory(text):  keyword-based category guess
 *  - suggestDepartment(cat): routes a category to its support department
 */
const Smart = (() => {
  // Rules are evaluated top-down; the first level with a keyword match wins.
  const PRIORITY_RULES = [
    {
      priority: "Critical",
      words: ["outage", "server down", "system down", "production down", "data loss", "security breach", "breach",
        "ransomware", "virus", "malware", "hacked", "phishing", "entire team", "entire floor", "all users", "everyone",
        "cannot work", "can't work", "fire", "flood", "gas leak", "injury", "short circuit"]
    },
    {
      priority: "High",
      words: ["urgent", "asap", "immediately", "not working", "unable to", "can't access", "cannot access", "locked out",
        "error", "failed", "failure", "deadline", "today", "not credited", "salary not", "payment missing", "missing",
        "leak", "leaking", "broken", "crash", "crashes", "client demo", "blocked"]
    },
    {
      priority: "Low",
      words: ["question", "how to", "how do i", "information", "clarification", "suggestion", "nice to have", "minor",
        "whenever", "no rush", "when possible", "request for", "requesting", "new mouse", "chair", "feedback"]
    }
  ];

  const CATEGORY_KEYWORDS = {
    "IT Support": ["laptop", "computer", "monitor", "printer", "wifi", "wi-fi", "vpn", "email", "outlook", "network",
      "internet", "keyboard", "mouse", "slow", "virus", "phishing", "malware", "docking", "teams", "hardware", "screen"],
    "HR Query": ["leave", "policy", "holiday", "benefit", "insurance", "appraisal", "performance review", "onboarding",
      "resignation", "emergency contact", "address", "job posting", "training", "maternity", "paternity", "hr"],
    Payroll: ["salary", "payslip", "pay slip", "tax", "tds", "bonus", "reimbursement", "payroll", "deduction",
      "allowance", "expense", "credited", "pf", "provident fund", "arrears"],
    "Software Access": ["access", "licence", "license", "permission", "account", "password", "login", "log in",
      "locked out", "install", "sso", "github", "salesforce", "power bi", "jira", "adobe", "repository", "mfa"],
    "Workplace Facilities": ["air conditioning", "ac ", "chair", "desk", "parking", "cafeteria", "leak", "light",
      "washroom", "meeting room", "access card", "badge", "cleaning", "pantry", "temperature", "ceiling", "lift", "elevator"]
  };

  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const has = (text, word) => new RegExp(`(^|[^a-z])${escapeRe(word.trim())}([^a-z]|$)`, "i").test(text);

  function suggestPriority(text) {
    const t = (text || "").toLowerCase();
    if (!t.trim()) return { priority: "Medium", matches: [], reason: "Start typing to get a suggestion. Default is Medium." };
    for (const rule of PRIORITY_RULES) {
      const matches = rule.words.filter((w) => has(t, w));
      if (matches.length) return { priority: rule.priority, matches, reason: `Detected keywords: ${matches.slice(0, 5).join(", ")}` };
    }
    return { priority: "Medium", matches: [], reason: "No urgency keywords detected – standard priority." };
  }

  function suggestCategory(text) {
    const t = ` ${(text || "").toLowerCase()} `;
    let best = null;
    let bestScore = 0;
    Object.entries(CATEGORY_KEYWORDS).forEach(([cat, words]) => {
      const score = words.filter((w) => has(t, w)).length;
      if (score > bestScore) { best = cat; bestScore = score; }
    });
    return best;
  }

  function suggestDepartment(category) {
    const cat = CATEGORY_MAP[category];
    if (!cat) return null;
    const dept = DEPARTMENTS[cat.department];
    return { name: cat.department, ...dept };
  }

  return { suggestPriority, suggestCategory, suggestDepartment };
})();
