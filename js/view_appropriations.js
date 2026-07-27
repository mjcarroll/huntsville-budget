(function () {
  const SOURCE_COLOR = {
    "General Fund Agencies": "--series-1",
    "Intergovernmental & Contracts": "--series-2",
    "Lodging & Liquor Tax Fund": "--series-3",
  };

  function shade(hex, depth) {
    const c = d3.hsl(hex);
    const t = Math.min(0.6, (depth - 1) * 0.18);
    c.s = Math.max(0.15, c.s * (1 - t * 0.35));
    c.l = c.l + (1 - c.l) * t;
    return c.toString();
  }

  function clip(text, maxWidth) {
    const approxCharW = 6.2;
    const maxChars = Math.max(0, Math.floor(maxWidth / approxCharW));
    if (text.length <= maxChars) return text;
    return maxChars > 1 ? text.slice(0, maxChars - 1) + '…' : '';
  }

  function buildData(data) {
    const gfCategories = Object.entries(data.generalFund.categories).map(([catName, cat]) => ({
      name: catName,
      children: Object.entries(cat.agencies).map(([name, value]) => ({ name, value })),
    }));

    const igEntries = Object.entries(data.intergovernmentalAndContracts.agencies).map(([name, value]) => ({ name, value }));
    const lltEntries = Object.entries(data.lodgingAndLiquorTaxFund.agencies).map(([name, value]) => ({ name, value }));

    return {
      name: "Special Appropriations (FY2026 planned)",
      children: [
        { name: "General Fund Agencies", children: gfCategories },
        { name: "Intergovernmental & Contracts", children: igEntries },
        { name: "Lodging & Liquor Tax Fund", children: lltEntries },
      ],
    };
  }

  function render(container) {
    fetch('data/special_appropriations_fy2026.json').then(r => r.json()).then(data => {
      const treeData = buildData(data);
      const root = d3.hierarchy(treeData).sum(d => d.value || 0).sort((a, b) => b.value - a.value);
      const width = Math.max(340, container.clientWidth);
      const height = Math.max(340, Math.round(width * 0.55));
      const HEADER_H = 20;

      d3.treemap()
        .tile(d3.treemapSquarify)
        .size([width, height])
        .paddingOuter(3)
        .paddingTop(d => (d.children && d.depth > 0 ? HEADER_H : 3))
        .paddingInner(2)
        .round(true)(root);

      root.each(d => {
        d.topAncestor = d.ancestors().reverse()[1] || d;
      });

      container.innerHTML = '';
      const svg = d3.select(container).append('svg')
        .attr('class', 'chart treemap')
        .attr('viewBox', `0 0 ${width} ${height}`);

      const nodeG = svg.selectAll('g')
        .data(root.descendants().filter(d => d.depth > 0))
        .join('g')
        .attr('transform', d => `translate(${d.x0},${d.y0})`);

      nodeG.append('rect')
        .attr('width', d => Math.max(0, d.x1 - d.x0))
        .attr('height', d => Math.max(0, d.y1 - d.y0))
        .attr('fill', d => shade(App.cssVar(SOURCE_COLOR[d.topAncestor.data.name] || '--series-8'), d.depth))
        .attr('class', d => d.children ? 'has-children' : '')
        .on('mousemove', (evt, d) => {
          const pct = root.value ? (d.value / root.value * 100) : 0;
          App.showTooltip(`<b>${d.data.name}</b><br>${App.fmtMoney(d.value, { full: true })} (${pct.toFixed(1)}% of total)`, evt);
        })
        .on('mouseleave', App.hideTooltip);

      nodeG.each(function (d) {
        const g = d3.select(this);
        const w = d.x1 - d.x0, h = d.y1 - d.y0;
        if (w < 2 || h < 2) return;
        if (d.children) {
          if (h >= HEADER_H && w > 34) {
            g.append('text').attr('class', 'header-text').attr('x', 5).attr('y', HEADER_H / 2).attr('dy', '0.32em')
              .text(clip(d.data.name, w - 10));
          }
        } else if (w > 42 && h > 26) {
          g.append('text').attr('x', 5).attr('y', h / 2 - 6).attr('dy', '0.32em').text(clip(d.data.name, w - 10));
          if (h > 38) {
            g.append('text').attr('class', 'value-text').attr('x', 5).attr('y', h / 2 + 9).attr('dy', '0.32em')
              .text(clip(App.fmtMoney(d.value), w - 10));
          }
        }
      });

      Charts.renderLegend(document.getElementById('approp-legend'), [
        { items: Object.entries(SOURCE_COLOR).map(([label, colorVar]) => ({ label, color: App.cssVar(colorVar) })) },
      ]);
    });
  }

  window.Appropriations = { render: () => render(document.getElementById('approp-chart')) };
})();
