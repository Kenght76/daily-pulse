/* ============================================================
   chart.js — SVG Weight Chart Renderer
   ============================================================ */

const Chart = (() => {

  const render = (containerId, weights, days = 30) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const data = weights.slice(-days);

    if (data.length < 2) {
      container.innerHTML = `
        <div class="chart-empty">
          <span class="chart-empty-icon">📊</span>
          <p>Log at least 2 days to see your trend</p>
        </div>`;
      return;
    }

    const vals = data.map(d => d.weight);
    const min = Math.min(...vals) - 2;
    const max = Math.max(...vals) + 2;
    const W = 700, H = 220, PAD = 40;
    const gw = W - PAD * 2, gh = H - PAD * 2;

    const pts = data.map((d, i) => ({
      x: PAD + (i / (data.length - 1)) * gw,
      y: PAD + gh - ((d.weight - min) / (max - min)) * gh,
      ...d
    }));

    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const area = line + ` L${pts[pts.length - 1].x.toFixed(1)},${H - PAD} L${pts[0].x.toFixed(1)},${H - PAD} Z`;

    const gridLines = [0, 0.25, 0.5, 0.75, 1].map(f => {
      const y = (PAD + gh * (1 - f)).toFixed(1);
      const v = (min + (max - min) * f).toFixed(1);
      return `<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="var(--border-color)" stroke-width="1" opacity="0.4"/>
              <text x="${PAD - 6}" y="${Number(y) + 4}" text-anchor="end" fill="var(--text-secondary)" font-size="10" font-family="var(--font-mono)">${v}</text>`;
    }).join('');

    const dots = pts.map((p, i) => {
      const showLabel = i === 0 || i === pts.length - 1 || i % Math.max(1, Math.floor(pts.length / 6)) === 0;
      const dateLabel = showLabel
        ? `<text x="${p.x.toFixed(1)}" y="${H - PAD + 16}" text-anchor="middle" fill="var(--text-secondary)" font-size="9" font-family="var(--font-mono)">${formatDate(p.date)}</text>`
        : '';
      return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="var(--accent-primary)" stroke="var(--bg-primary)" stroke-width="2" class="chart-dot"/>
              ${dateLabel}`;
    }).join('');

    container.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" class="weight-chart-svg">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--accent-primary)" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="var(--accent-primary)" stop-opacity="0.02"/>
          </linearGradient>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="var(--accent-primary)"/>
            <stop offset="100%" stop-color="var(--accent-secondary)"/>
          </linearGradient>
        </defs>
        ${gridLines}
        <path d="${area}" fill="url(#areaGrad)"/>
        <path d="${line}" fill="none" stroke="url(#lineGrad)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        ${dots}
      </svg>`;
  };

  const formatDate = (d) => {
    const date = new Date(d + 'T12:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return { render };
})();
