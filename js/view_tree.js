(function () {
  const { REV_CATEGORIES, EXP_CATEGORIES } = Categories;

  const FUND_COLOR_VAR = {
    "General Fund": "--series-1",
    "Grants Fund": "--series-2",
    "Capital Improvements Fund": "--series-3",
    "Capital Projects Fund": "--series-4",
    "Debt Service Fund": "--series-5",
    "PBA City Hall Fund": "--series-6",
    "Other Governmental Funds": "--series-7",
  };
  function fundColor(fundName) {
    return App.cssVar(FUND_COLOR_VAR[fundName] || "--series-8");
  }

  function shade(hex, depth) {
    // depth 1 = base color; each level after lightens toward the surface
    const c = d3.hsl(hex);
    const t = Math.min(0.6, (depth - 1) * 0.16);
    c.s = Math.max(0.15, c.s * (1 - t * 0.35));
    c.l = c.l + (1 - c.l) * t;
    return c.toString();
  }

  let currentYear = null;

  function buildRevenueTree(yearData) {
    const funds = yearData.funds;
    const fundNodes = funds.map(fund => {
      const fi = funds.indexOf(fund);
      const children = REV_CATEGORIES
        .map(cat => ({ name: cat, value: (yearData.revenues[cat] || [])[fi] || 0 }))
        .filter(c => c.value > 0.5);
      return { name: fund, children };
    }).filter(f => f.children.length > 0);
    return { name: "Total Revenue", children: fundNodes };
  }

  // Collapses to a flat {name,value} leaf when there's only one real child
  // (e.g. a department with just a Personnel line, or a group with one dept),
  // otherwise returns {name, children}. Keeps the tree from padding in
  // pointless single-child nesting levels.
  function collapseNode(name, candidates) {
    const real = candidates.filter(c => (c.children && c.children.length > 0) || (c.value || 0) > 0.5);
    if (real.length === 0) return null;
    if (real.length === 1 && !real[0].children) return { name, value: real[0].value };
    if (real.length === 1 && real[0].children) return { name, children: real[0].children };
    return { name, children: real };
  }

  function pickDeptData(year) {
    const dept = App.state.dept;
    if (dept.years.includes(year)) return dept;
    const fy2027 = App.state.fy2027;
    if (fy2027 && fy2027.generalFundDepartments.years.includes(year)) return fy2027.generalFundDepartments;
    return dept;
  }

  function buildExpenditureTree(yearData, deptData, year) {
    const funds = yearData.funds;
    const deptYearIdx = deptData ? deptData.years.indexOf(year) : -1;

    const fundNodes = funds.map(fund => {
      const fi = funds.indexOf(fund);
      if (fund === "General Fund" && deptYearIdx >= 0) {
        const groups = Object.entries(deptData.departments).map(([groupName, depts]) => {
          const deptEntries = Object.entries(depts).map(([deptName, subcats]) => {
            const subEntries = Object.entries(subcats)
              .map(([subName, arr]) => ({ name: subName, value: arr[deptYearIdx] || 0 }))
              .filter(s => s.value > 0.5);
            return collapseNode(deptName, subEntries);
          }).filter(Boolean);
          return collapseNode(groupName, deptEntries);
        }).filter(Boolean);
        return { name: fund, children: groups };
      }
      const children = EXP_CATEGORIES
        .map(cat => ({ name: cat, value: (yearData.expenditures[cat] || [])[fi] || 0 }))
        .filter(c => c.value > 0.5);
      return { name: fund, children };
    }).filter(f => f.children.length > 0);

    return { name: "Total Expenditures", children: fundNodes };
  }

  const HEADER_H = 20;

  function renderTreemap(container, breadcrumbEl, rootData) {
    let path = [rootData];

    function renderBreadcrumb() {
      breadcrumbEl.innerHTML = '';
      path.forEach((d, i) => {
        const span = document.createElement('span');
        span.className = 'crumb' + (i === path.length - 1 ? ' current' : '');
        span.textContent = d.name;
        if (i < path.length - 1) {
          span.onclick = () => { path = path.slice(0, i + 1); renderBreadcrumb(); draw(); };
        }
        breadcrumbEl.appendChild(span);
        if (i < path.length - 1) {
          const sep = document.createElement('span');
          sep.className = 'sep';
          sep.textContent = '›';
          breadcrumbEl.appendChild(sep);
        }
      });
    }

    function draw() {
      const data = path[path.length - 1];
      const root = d3.hierarchy(data).sum(d => d.value || 0).sort((a, b) => b.value - a.value);
      const width = Math.max(340, container.clientWidth);
      const height = Math.max(360, Math.round(width * 0.62));

      d3.treemap()
        .tile(d3.treemapSquarify)
        .size([width, height])
        .paddingOuter(3)
        .paddingTop(d => (d.children && d.depth > 0 ? HEADER_H : 3))
        .paddingInner(2)
        .round(true)(root);

      // Color anchor is always the FUND, regardless of how deep we've drilled:
      // path[1] is the fund once we've drilled past the root; at the root
      // itself, each depth-1 child (the funds) anchors its own subtree.
      const drilledFundName = path.length > 1 ? path[1].name : null;
      root.each(d => {
        d.topAncestor = drilledFundName ? { data: { name: drilledFundName } } : (d.ancestors().reverse()[1] || d);
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
        .attr('fill', d => shade(fundColor(d.topAncestor.data.name), d.depth))
        .attr('class', d => d.children ? 'has-children' : '')
        .style('cursor', d => d.children ? 'pointer' : 'default')
        .on('click', (evt, d) => {
          if (d.children) {
            path.push(d.data);
            renderBreadcrumb();
            draw();
          }
        })
        .on('mousemove', (evt, d) => {
          const pct = root.value ? (d.value / root.value * 100) : 0;
          App.showTooltip(`<b>${d.data.name}</b><br>${App.fmtMoney(d.value, { full: true })} (${pct.toFixed(1)}% of ${data.name})`, evt);
        })
        .on('mouseleave', App.hideTooltip);

      // label: header strip for parents, centered label for leaves
      nodeG.each(function (d) {
        const g = d3.select(this);
        const w = d.x1 - d.x0, h = d.y1 - d.y0;
        if (w < 2 || h < 2) return;
        if (d.children) {
          if (h >= HEADER_H && w > 34) {
            g.append('text')
              .attr('class', 'header-text')
              .attr('x', 5).attr('y', HEADER_H / 2).attr('dy', '0.32em')
              .text(clip(d.data.name, w - 10));
          }
        } else {
          if (w > 42 && h > 26) {
            g.append('text')
              .attr('x', 5).attr('y', h / 2 - 6).attr('dy', '0.32em')
              .text(clip(d.data.name, w - 10));
            if (h > 38) {
              g.append('text')
                .attr('class', 'value-text')
                .attr('x', 5).attr('y', h / 2 + 9).attr('dy', '0.32em')
                .text(clip(App.fmtMoney(d.value), w - 10));
            }
          }
        }
      });
    }

    function clip(text, maxWidth) {
      const approxCharW = 6.2;
      const maxChars = Math.max(0, Math.floor(maxWidth / approxCharW));
      if (text.length <= maxChars) return text;
      return maxChars > 1 ? text.slice(0, maxChars - 1) + '…' : '';
    }

    renderBreadcrumb();
    draw();
    return { redraw: draw, reset: () => { path = [rootData]; renderBreadcrumb(); draw(); } };
  }

  let revIcicle = null, expIcicle = null;

  function render() {
    const budget = App.state.budget;
    const year = Number(currentYear);
    const dept = pickDeptData(year);
    const yearData = budget[currentYear];

    const revTree = buildRevenueTree(yearData);
    const expTree = buildExpenditureTree(yearData, dept, year);

    revIcicle = renderTreemap(document.getElementById('tree-rev-chart'), document.getElementById('tree-rev-breadcrumb'), revTree);
    expIcicle = renderTreemap(document.getElementById('tree-exp-chart'), document.getElementById('tree-exp-breadcrumb'), expTree);

    const hasDept = dept.years.includes(year);
    document.getElementById('tree-exp-desc').textContent = hasDept
      ? 'Fund → function → department (General Fund only, where disclosed).'
      : 'Fund → function.';

    const noteEl = document.getElementById('tree-note');
    if (yearData.note) { noteEl.textContent = yearData.note; noteEl.style.display = ''; }
    else { noteEl.style.display = 'none'; }
  }

  function initYearButtons() {
    const years = Object.keys(App.state.budget).sort();
    currentYear = years[years.length - 1];
    const container = document.getElementById('tree-years');
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

  App.registerView('tree', {
    init() { initYearButtons(); },
    onShow() { render(); },
  });
})();
