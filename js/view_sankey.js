(function () {
  const { REV_CATEGORIES, REV_COLOR_VARS, EXP_CATEGORIES, EXP_COLOR_VARS, BALANCE_IN, BALANCE_OUT } = Categories;

  let currentYear = null;

  function nodeColor(d) {
    if (d.kind === 'fund') return App.cssVar('--fund-node');
    if (d.kind === 'balance-out') return App.cssVar('--status-good');
    if (d.kind === 'balance-in') return App.cssVar('--status-warn');
    return App.cssVar(d.colorVar);
  }

  function buildGraph(yearData) {
    const funds = yearData.funds;
    const nodesByName = new Map();
    function node(name, colorVar, kind) {
      if (!nodesByName.has(name)) nodesByName.set(name, { name, colorVar, kind });
      return nodesByName.get(name);
    }
    const links = [];

    REV_CATEGORIES.forEach((cat, ci) => {
      const vals = yearData.revenues[cat] || [];
      funds.forEach((fund, fi) => {
        const v = vals[fi] || 0;
        if (v > 0) {
          node(cat, REV_COLOR_VARS[ci], 'revenue');
          node(fund, null, 'fund');
          links.push({ source: cat, target: fund, value: v });
        }
      });
    });

    EXP_CATEGORIES.forEach((cat, ci) => {
      const vals = yearData.expenditures[cat] || [];
      funds.forEach((fund, fi) => {
        const v = vals[fi] || 0;
        if (v > 0) {
          node(cat, EXP_COLOR_VARS[ci], 'expenditure');
          node(fund, null, 'fund');
          links.push({ source: fund, target: cat, value: v });
        }
      });
    });

    funds.forEach((fund, fi) => {
      let revenue = 0, exp = 0;
      REV_CATEGORIES.forEach(cat => { revenue += (yearData.revenues[cat] || [])[fi] || 0; });
      EXP_CATEGORIES.forEach(cat => { exp += (yearData.expenditures[cat] || [])[fi] || 0; });
      const net = revenue - exp;
      if (net > 0.5) { node(BALANCE_OUT, null, 'balance-out'); links.push({ source: fund, target: BALANCE_OUT, value: net }); }
      else if (net < -0.5) { node(BALANCE_IN, null, 'balance-in'); links.push({ source: BALANCE_IN, target: fund, value: -net }); }
    });

    const nodeNames = Array.from(nodesByName.keys());
    const nameToIndex = new Map(nodeNames.map((n, i) => [n, i]));
    const nodes = nodeNames.map(n => Object.assign({}, nodesByName.get(n)));
    const idxLinks = links.map(l => ({ source: nameToIndex.get(l.source), target: nameToIndex.get(l.target), value: l.value }));

    return {
      nodes, links: idxLinks,
      totalRevenue: d3.sum(REV_CATEGORIES, c => d3.sum(yearData.revenues[c] || [])),
      totalExpenditure: d3.sum(EXP_CATEGORIES, c => d3.sum(yearData.expenditures[c] || [])),
    };
  }

  function render() {
    const container = document.getElementById('sankey-chart');
    if (!container) return;
    const DATA = App.state.budget;
    const yearData = DATA[currentYear];
    const { nodes, links, totalRevenue, totalExpenditure } = buildGraph(yearData);

    const noteEl = document.getElementById('sankey-note');
    if (yearData.note) { noteEl.textContent = yearData.note; noteEl.style.display = ''; }
    else { noteEl.style.display = 'none'; }

    let width = Math.max(760, container.clientWidth);
    let height = window.innerWidth < 700 ? 980 : 880;
    const margin = { top: 6, right: 6, bottom: 6, left: 6 };

    container.innerHTML = '';
    const svg = d3.select(container).append('svg').attr('class', 'chart').attr('viewBox', `0 0 ${width} ${height}`);

    const sankey = d3.sankey()
      .nodeId(d => d.index)
      .nodeWidth(16)
      .nodePadding(8)
      .nodeAlign(d3.sankeyJustify)
      .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]]);

    const graph = sankey({
      nodes: nodes.map((d, i) => Object.assign({ index: i }, d)),
      links: links.map(d => Object.assign({}, d)),
    });

    const linkLayer = svg.append('g');
    const nodeLayer = svg.append('g');

    linkLayer.selectAll('path')
      .data(graph.links)
      .join('path')
      .attr('class', 'link')
      .attr('d', d3.sankeyLinkHorizontal())
      .attr('fill', 'none')
      .attr('stroke', d => nodeColor(d.source))
      .attr('stroke-opacity', 0.35)
      .attr('stroke-width', d => Math.max(1, d.width))
      .on('mousemove', (evt, d) => App.showTooltip(`${d.source.name} &rarr; ${d.target.name}<br><b>${App.fmtMoney(d.value, { full: true })}</b>`, evt))
      .on('mouseleave', App.hideTooltip)
      .on('mouseenter', function () { d3.select(this).attr('stroke-opacity', 0.6); })
      .on('mouseout', function () { d3.select(this).attr('stroke-opacity', 0.35); });

    const nodeG = nodeLayer.selectAll('g').data(graph.nodes).join('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x0},${d.y0})`);

    nodeG.append('rect')
      .attr('width', d => d.x1 - d.x0)
      .attr('height', d => Math.max(1, d.y1 - d.y0))
      .attr('fill', nodeColor)
      .on('mousemove', (evt, d) => App.showTooltip(`<b>${d.name}</b><br>${App.fmtMoney(d.value, { full: true })}`, evt))
      .on('mouseleave', App.hideTooltip);

    nodeG.append('text')
      .attr('x', d => (d.x0 < width / 2 ? d.x1 - d.x0 + 6 : -6))
      .attr('y', d => (d.y1 - d.y0) / 2 - 3)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => (d.x0 < width / 2 ? 'start' : 'end'))
      .text(d => d.name);

    nodeG.append('text')
      .attr('class', 'node-value')
      .attr('x', d => (d.x0 < width / 2 ? d.x1 - d.x0 + 6 : -6))
      .attr('y', d => (d.y1 - d.y0) / 2 + 11)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => (d.x0 < width / 2 ? 'start' : 'end'))
      .text(d => App.fmtMoney(d.value));

    document.getElementById('sankey-stats').innerHTML = `
      <span>Total revenue <b>${App.fmtMoney(totalRevenue, { full: true })}</b></span>
      <span>Total expenditure <b>${App.fmtMoney(totalExpenditure, { full: true })}</b></span>
      <span>Net <b>${totalRevenue - totalExpenditure >= 0 ? '+' : ''}${App.fmtMoney(totalRevenue - totalExpenditure, { full: true })}</b></span>
    `;

    Charts.renderLegend(document.getElementById('sankey-legend'), [
      { title: 'Revenue', items: REV_CATEGORIES.map((c, i) => ({ label: c, color: App.cssVar(REV_COLOR_VARS[i]) })) },
      { title: 'Expenditure', items: EXP_CATEGORIES.map((c, i) => ({ label: c, color: App.cssVar(EXP_COLOR_VARS[i]) })) },
      { title: 'Balance', items: [{ label: BALANCE_OUT, color: App.cssVar('--status-good') }, { label: BALANCE_IN, color: App.cssVar('--status-warn') }] },
    ]);
  }

  function initYearButtons() {
    const years = Object.keys(App.state.budget).sort();
    currentYear = years[years.length - 1];
    const container = document.getElementById('sankey-years');
    container.innerHTML = '';
    years.forEach(y => {
      const btn = document.createElement('button');
      btn.className = 'pill-btn' + (y === currentYear ? ' active' : '');
      btn.textContent = 'FY' + y;
      btn.onclick = () => {
        currentYear = y;
        container.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        render();
      };
      container.appendChild(btn);
    });
  }

  App.registerView('sankey', {
    init() { initYearButtons(); },
    onShow() { render(); },
  });
})();
