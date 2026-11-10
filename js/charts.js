/**
 * charts.js – Lightweight, dependency-free interactive charts (SVG donut + bar chart).
 */
const Charts = (() => {
  let tip;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function tooltip() {
    if (!tip) {
      tip = document.createElement("div");
      tip.className = "chart-tip";
      document.body.appendChild(tip);
    }
    return tip;
  }
  function showTip(e, text) {
    const t = tooltip();
    t.textContent = text;
    t.style.left = e.clientX + 14 + "px";
    t.style.top = e.clientY + 14 + "px";
    t.classList.add("show");
  }
  const hideTip = () => tooltip().classList.remove("show");

  /** Donut chart. data = [{label, value, color}] */
  function donut(el, data, opts = {}) {
    const total = data.reduce((s, d) => s + d.value, 0);
    const r = 70;
    const C = 2 * Math.PI * r;
    let offset = 0;
    const segs = data
      .filter((d) => d.value > 0)
      .map((d) => {
        const len = (d.value / total) * C;
        const svg = `<circle class="donut-seg" r="${r}" cx="100" cy="100" stroke="${d.color}"
          stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-offset}" data-label="${esc(d.label)}" data-value="${d.value}"></circle>`;
        offset += len;
        return svg;
      })
      .join("");

    el.innerHTML = `<div class="donut-wrap">
      <svg viewBox="0 0 200 200" class="donut" role="img" aria-label="${esc(opts.ariaLabel || "Donut chart")}">
        <circle r="${r}" cx="100" cy="100" class="donut-track"></circle>
        <g transform="rotate(-90 100 100)">${segs}</g>
        <text x="100" y="98" class="donut-total">${total}</text>
        <text x="100" y="120" class="donut-sub">${esc(opts.centerLabel || "total")}</text>
      </svg>
      <ul class="legend">${data.map((d) => `<li data-label="${esc(d.label)}" data-value="${d.value}" tabindex="0">
        <span class="dot" style="background:${d.color}"></span>
        <span class="lg-label">${esc(d.label)}</span>
        <span class="lg-val">${d.value} <small>${total ? Math.round((d.value / total) * 100) : 0}%</small></span></li>`).join("")}
      </ul></div>`;

    el.querySelectorAll("[data-label]").forEach((node) => {
      const label = node.dataset.label;
      node.addEventListener("mouseenter", () => {
        el.classList.add("hovering");
        el.querySelectorAll(`[data-label="${CSS.escape(label)}"]`).forEach((n) => n.classList.add("hl"));
      });
      node.addEventListener("mousemove", (e) => showTip(e, `${label}: ${node.dataset.value} ticket(s)`));
      node.addEventListener("mouseleave", () => {
        el.classList.remove("hovering");
        el.querySelectorAll(".hl").forEach((n) => n.classList.remove("hl"));
        hideTip();
      });
      node.addEventListener("click", () => { hideTip(); opts.onClick && opts.onClick(label); });
      node.addEventListener("keydown", (e) => { if (e.key === "Enter") opts.onClick && opts.onClick(label); });
    });
  }

  /** Horizontal bar chart. data = [{label, value, color, sub?}] */
  function bars(el, data, opts = {}) {
    const max = Math.max(1, ...data.map((d) => d.value));
    el.innerHTML = data.map((d) => `<button class="bar-row" data-label="${esc(d.label)}" ${opts.onClick ? "" : "disabled"}>
        <span class="bar-label">${esc(d.label)}${d.sub ? `<small>${esc(d.sub)}</small>` : ""}</span>
        <span class="bar-track"><span class="bar-fill" style="background:${d.color}" data-w="${(d.value / max) * 100}"></span></span>
        <span class="bar-val">${d.value}</span>
      </button>`).join("");
    requestAnimationFrame(() => el.querySelectorAll(".bar-fill").forEach((b) => (b.style.width = b.dataset.w + "%")));
    if (opts.onClick) el.querySelectorAll(".bar-row").forEach((b) => b.addEventListener("click", () => opts.onClick(b.dataset.label)));
  }

  return { donut, bars };
})();
