(function () {
  const COMPONENT_DEF = [
    { key: "Unassigned", label: "Unassigned", colorVar: "--series-1" },
    { key: "Assigned", label: "Assigned", colorVar: "--series-4" },
    { key: "Committed", label: "Committed", colorVar: "--series-3" },
    { key: "Restricted", label: "Restricted", colorVar: "--series-7" },
    { key: "Nonspendable", label: "Nonspendable", colorVar: "--series-6" },
  ];

  function generalFundRevenueByYear() {
    const budget = App.state.budget;
    const out = {};
    Object.keys(budget).forEach(year => {
      const yd = budget[year];
      const gfIndex = yd.funds.indexOf("General Fund");
      let total = 0;
      Object.values(yd.revenues).forEach(vals => { total += vals[gfIndex] || 0; });
      out[year] = total;
    });
    return out;
  }

  function render() {
    const trend = App.state.trend;
    const years = trend.years;

    Charts.stackedArea(document.getElementById('gf-balance-chart'), {
      years, seriesDef: COMPONENT_DEF, values: trend.fundBalances["General Fund"], height: 280,
    });
    Charts.stackedArea(document.getElementById('other-balance-chart'), {
      years, seriesDef: COMPONENT_DEF, values: trend.fundBalances["All Other Governmental Funds"], height: 280,
    });
    Charts.renderLegend(document.getElementById('balance-legend'), [
      { items: COMPONENT_DEF.map(s => ({ label: s.label, color: App.cssVar(s.colorVar) })) },
    ]);

    // Reserve ratio: unassigned GF balance / GF revenue, FY2021-2025 (only years we have GF-level revenue for)
    const gfRevenue = generalFundRevenueByYear();
    const ratioYears = Object.keys(gfRevenue).map(Number).sort();
    const unassignedByYear = {};
    trend.years.forEach((y, i) => { unassignedByYear[y] = trend.fundBalances["General Fund"]["Unassigned"][i]; });
    const ratios = ratioYears.map(y => (unassignedByYear[y] / gfRevenue[y]) * 100);

    Charts.multiLine(document.getElementById('reserve-ratio-chart'), {
      years: ratioYears, height: 220,
      seriesDef: [{ key: 'ratio', label: 'Unassigned GF Balance / GF Revenue', colorVar: '--status-good' }],
      values: { ratio: ratios },
      yFormat: v => v.toFixed(0) + '%',
      yDomain: [0, Math.max(75, d3.max(ratios) * 1.15)],
    });

    // draw the 11.5% policy floor as a reference line
    const svg = d3.select('#reserve-ratio-chart svg');
    const root = svg.select('g');
    const yScaleTicks = ratios;
    // recompute the same y scale used inside multiLine by re-deriving domain (kept in sync w/ yDomain above)
    const height = 220, margin = { top: 12, right: 16, bottom: 26, left: 52 };
    const innerH = height - margin.top - margin.bottom;
    const yDomain = [0, Math.max(75, d3.max(ratios) * 1.15)];
    const y = d3.scaleLinear().domain(yDomain).nice().range([innerH, 0]);
    const width = document.getElementById('reserve-ratio-chart').clientWidth;
    const innerW = width - margin.left - margin.right;
    root.append('line')
      .attr('x1', 0).attr('x2', innerW).attr('y1', y(11.5)).attr('y2', y(11.5))
      .attr('stroke', App.cssVar('--status-warn')).attr('stroke-width', 1.5).attr('stroke-dasharray', '5 3');
    root.append('text')
      .attr('x', innerW).attr('y', y(11.5) - 5).attr('text-anchor', 'end')
      .attr('fill', App.cssVar('--status-warn')).attr('font-size', '10.5px')
      .text('11.5% policy floor');

    Charts.renderLegend(document.getElementById('reserve-ratio-legend'), [
      { items: [{ label: 'Unassigned / General Fund revenue', color: App.cssVar('--status-good'), line: true }] },
    ]);
  }

  App.registerView('fundbalance', { onShow() { render(); } });
})();
