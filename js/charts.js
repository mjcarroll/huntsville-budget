const Charts = (() => {

  function makeSvg(container, height) {
    container.innerHTML = '';
    const width = Math.max(280, container.clientWidth);
    const svg = d3.select(container).append('svg')
      .attr('class', 'chart')
      .attr('viewBox', `0 0 ${width} ${height}`);
    return { svg, width, height };
  }

  function renderLegend(container, groups) {
    container.innerHTML = groups.map(g => {
      const items = g.items.map(it => {
        const shape = it.line ? '<i class="line-swatch" style="background:' + it.color + '"></i>' : '<i style="background:' + it.color + '"></i>';
        return `<span class="swatch${it.line ? ' line' : ''}">${shape}${it.label}</span>`;
      }).join('');
      return `<div class="legend-group">${g.title ? '<span class="legend-title">' + g.title + '</span>' : ''}${items}</div>`;
    }).join('');
  }

  // Stacked area chart. seriesDef: [{key,label,colorVar}], values: {key: [v,...]}, years: [...]
  function stackedArea(container, { years, seriesDef, values, yFormat, height = 320, pctMode = false }) {
    const margin = { top: 12, right: 16, bottom: 26, left: 52 };
    const { svg, width } = makeSvg(container, height);
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;
    const root = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const colors = seriesDef.map(s => App.cssVar(s.colorVar));

    const stackData = years.map((y, i) => {
      const row = { year: y };
      seriesDef.forEach(s => { row[s.key] = values[s.key][i] || 0; });
      return row;
    });
    const stackGen = d3.stack().keys(seriesDef.map(s => s.key));
    const stacked = stackGen(stackData);

    const x = d3.scaleLinear().domain(d3.extent(years)).range([0, innerW]);
    const yMax = pctMode ? 100 : d3.max(stacked, layer => d3.max(layer, d => d[1])) * 1.05;
    const y = d3.scaleLinear().domain([0, yMax]).nice().range([innerH, 0]);

    root.append('g').attr('class', 'gridlines')
      .selectAll('line').data(y.ticks(5)).join('line')
      .attr('class', 'gridline')
      .attr('x1', 0).attr('x2', innerW).attr('y1', d => y(d)).attr('y2', d => y(d));

    const area = d3.area()
      .x(d => x(d.data.year))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))
      .curve(d3.curveMonotoneX);

    root.selectAll('path.area')
      .data(stacked)
      .join('path')
      .attr('class', 'area')
      .attr('fill', (d, i) => colors[i])
      .attr('fill-opacity', 0.85)
      .attr('d', area);

    root.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(years.length).tickSizeOuter(0));

    root.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => pctMode ? d + '%' : App.fmtCompact(d)).tickSizeOuter(0));

    // hover crosshair
    const hoverLine = root.append('line').attr('class', 'hover-line').attr('y1', 0).attr('y2', innerH).style('opacity', 0);
    const hoverDots = root.selectAll('circle.hd').data(seriesDef).join('circle')
      .attr('class', 'hd hover-dot').attr('r', 4).style('opacity', 0);

    const bisect = d3.bisector(d => d).left;
    svg.append('rect')
      .attr('x', margin.left).attr('y', margin.top).attr('width', innerW).attr('height', innerH)
      .attr('fill', 'transparent')
      .on('mousemove', (evt) => {
        const [mx] = d3.pointer(evt, root.node());
        const yearAtX = x.invert(mx);
        let idx = bisect(years, yearAtX);
        idx = Math.max(0, Math.min(years.length - 1, idx));
        const yr = years[idx];
        hoverLine.attr('x1', x(yr)).attr('x2', x(yr)).style('opacity', 1);
        let html = `<b>FY${yr}</b><br>`;
        seriesDef.forEach((s, i) => {
          const v = stacked[i][idx];
          hoverDots.filter((d, di) => di === i)
            .attr('cx', x(yr)).attr('cy', y(v[1])).style('opacity', 1).attr('stroke', colors[i]);
          const raw = values[s.key][idx] || 0;
          html += `<span style="color:${colors[i]}">&#9632;</span> ${s.label}: <b>${pctMode ? raw.toFixed(1) + '%' : App.fmtMoney(raw, { full: true })}</b><br>`;
        });
        App.showTooltip(html, evt);
      })
      .on('mouseleave', () => { hoverLine.style('opacity', 0); hoverDots.style('opacity', 0); App.hideTooltip(); });

    return { svg, x, y };
  }

  // Multi-line chart. seriesDef: [{key,label,colorVar}], values: {key:[v,...]}
  function multiLine(container, { years, seriesDef, values, height = 320, yFormat, yDomain, rightAxis }) {
    const margin = { top: 12, right: rightAxis ? 46 : 16, bottom: 26, left: 52 };
    const { svg, width } = makeSvg(container, height);
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;
    const root = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const colors = seriesDef.map(s => App.cssVar(s.colorVar));
    const x = d3.scaleLinear().domain(d3.extent(years)).range([0, innerW]);

    let domain = yDomain;
    if (!domain) {
      const allVals = seriesDef.flatMap(s => values[s.key]);
      domain = [Math.min(0, d3.min(allVals)), d3.max(allVals) * 1.08];
    }
    const y = d3.scaleLinear().domain(domain).nice().range([innerH, 0]);

    root.append('g').attr('class', 'gridlines')
      .selectAll('line').data(y.ticks(5)).join('line')
      .attr('class', 'gridline')
      .attr('x1', 0).attr('x2', innerW).attr('y1', d => y(d)).attr('y2', d => y(d));

    const line = d3.line().x((d, i) => x(years[i])).y(d => y(d)).curve(d3.curveMonotoneX);

    seriesDef.forEach((s, i) => {
      root.append('path')
        .datum(values[s.key])
        .attr('fill', 'none')
        .attr('stroke', colors[i])
        .attr('stroke-width', 2.5)
        .attr('d', line);
    });

    root.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(years.length).tickSizeOuter(0));

    root.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(y).ticks(5).tickFormat(yFormat || (d => App.fmtCompact(d))).tickSizeOuter(0));

    const hoverLine = root.append('line').attr('class', 'hover-line').attr('y1', 0).attr('y2', innerH).style('opacity', 0);
    const hoverDots = root.selectAll('circle.hd').data(seriesDef).join('circle')
      .attr('class', 'hd hover-dot').attr('r', 4).style('opacity', 0);

    const bisect = d3.bisector(d => d).left;
    svg.append('rect')
      .attr('x', margin.left).attr('y', margin.top).attr('width', innerW).attr('height', innerH)
      .attr('fill', 'transparent')
      .on('mousemove', (evt) => {
        const [mx] = d3.pointer(evt, root.node());
        const yearAtX = x.invert(mx);
        let idx = bisect(years, yearAtX);
        idx = Math.max(0, Math.min(years.length - 1, idx));
        const yr = years[idx];
        hoverLine.attr('x1', x(yr)).attr('x2', x(yr)).style('opacity', 1);
        let html = `<b>FY${yr}</b><br>`;
        seriesDef.forEach((s, i) => {
          const v = values[s.key][idx];
          hoverDots.filter((d, di) => di === i)
            .attr('cx', x(yr)).attr('cy', y(v)).style('opacity', 1).attr('stroke', colors[i]);
          html += `<span style="color:${colors[i]}">&#9632;</span> ${s.label}: <b>${(yFormat || App.fmtCompact)(v)}</b><br>`;
        });
        App.showTooltip(html, evt);
      })
      .on('mouseleave', () => { hoverLine.style('opacity', 0); hoverDots.style('opacity', 0); App.hideTooltip(); });

    return { svg, x, y };
  }

  // Grouped bar chart. groups on x axis (years), seriesDef bars within each group.
  function groupedBar(container, { years, seriesDef, values, height = 320, yFormat }) {
    const margin = { top: 12, right: 16, bottom: 26, left: 52 };
    const { svg, width } = makeSvg(container, height);
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;
    const root = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const colors = seriesDef.map(s => App.cssVar(s.colorVar));
    const x0 = d3.scaleBand().domain(years).range([0, innerW]).paddingInner(0.3).paddingOuter(0.15);
    const x1 = d3.scaleBand().domain(seriesDef.map(s => s.key)).range([0, x0.bandwidth()]).padding(0.08);

    const allVals = seriesDef.flatMap(s => values[s.key]);
    const y = d3.scaleLinear().domain([0, d3.max(allVals) * 1.08]).nice().range([innerH, 0]);

    root.append('g').attr('class', 'gridlines')
      .selectAll('line').data(y.ticks(5)).join('line')
      .attr('class', 'gridline')
      .attr('x1', 0).attr('x2', innerW).attr('y1', d => y(d)).attr('y2', d => y(d));

    const groupsSel = root.selectAll('g.group').data(years).join('g')
      .attr('class', 'group')
      .attr('transform', yr => `translate(${x0(yr)},0)`);

    groupsSel.selectAll('rect')
      .data(yr => seriesDef.map((s, i) => ({ key: s.key, label: s.label, color: colors[i], value: values[s.key][years.indexOf(yr)], year: yr })))
      .join('rect')
      .attr('x', d => x1(d.key))
      .attr('width', x1.bandwidth())
      .attr('y', d => y(d.value))
      .attr('height', d => innerH - y(d.value))
      .attr('fill', d => d.color)
      .on('mousemove', (evt, d) => {
        App.showTooltip(`<b>FY${d.year} &middot; ${d.label}</b><br>${App.fmtMoney(d.value, { full: true })}`, evt);
      })
      .on('mouseleave', App.hideTooltip);

    root.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x0).tickFormat(d => 'FY' + d).tickSizeOuter(0));

    root.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(y).ticks(5).tickFormat(yFormat || App.fmtCompact).tickSizeOuter(0));

    return { svg, x0, x1, y };
  }

  return { makeSvg, renderLegend, stackedArea, multiLine, groupedBar };
})();
