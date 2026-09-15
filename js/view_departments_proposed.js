(function () {
  const GROUP_COLOR = {
    "General Government": "--exp-gov",
    "Public Safety": "--exp-safe",
    "Public Services": "--exp-serv",
    "Urban Development": "--exp-urban",
  };
  const CYCLE_COLORS = ["--series-1", "--series-2", "--series-3", "--series-4", "--series-5", "--series-6", "--series-7", "--series-8"];
  const OBJECT_COLOR = { "Personnel": "--series-1", "Operating": "--series-2", "Capital": "--series-3" };
  const BASIS_LABEL = 'FY2025 actual, FY2026 revised budget, FY2027 proposed budget';

  let currentGroup = 'ALL';
  let currentDept = null;
  let initialized = false;

  function deptTotalByYear(subcats, years) {
    return years.map((y, i) => Object.values(subcats).reduce((s, arr) => s + (arr[i] || 0), 0));
  }

  function groupTotals(dept, years) {
    const out = {};
    Object.keys(dept.departments).forEach(group => {
      const depts = dept.departments[group];
      out[group] = years.map((y, i) => Object.values(depts).reduce((s, subcats) => s + deptTotalByYear(subcats, years)[i], 0));
    });
    return out;
  }

  function renderSubToggle(dept) {
    const container = document.getElementById('dept-proposed-subtoggle');
    if (currentGroup === 'ALL') { container.innerHTML = ''; return; }
    const names = Object.keys(dept.departments[currentGroup]);
    container.innerHTML = '';
    const overview = document.createElement('button');
    overview.className = 'pill-btn' + (currentDept === null ? ' active' : '');
    overview.textContent = 'Overview';
    overview.onclick = () => { currentDept = null; render(); };
    container.appendChild(overview);
    names.forEach(n => {
      const btn = document.createElement('button');
      btn.className = 'pill-btn' + (n === currentDept ? ' active' : '');
      btn.textContent = n;
      btn.onclick = () => { currentDept = n; render(); };
      container.appendChild(btn);
    });
  }

  function render() {
    const fy2027 = App.state.fy2027;
    if (!fy2027) return;
    const dept = fy2027.generalFundDepartments;
    const years = dept.years;
    renderSubToggle(dept);

    if (currentGroup === 'ALL') {
      const totals = groupTotals(dept, years);
      const groups = Object.keys(totals);
      const seriesDef = groups.map(g => ({ key: g, label: g, colorVar: GROUP_COLOR[g] || '--series-1' }));
      Charts.groupedBar(document.getElementById('dept-proposed-chart'), {
        years, seriesDef, values: totals, height: 380,
      });
      Charts.renderLegend(document.getElementById('dept-proposed-legend'), [
        { items: seriesDef.map(s => ({ label: s.label, color: App.cssVar(s.colorVar) })) },
      ]);
      document.getElementById('dept-proposed-title').innerHTML = 'Looking Ahead: General Fund Expenditures by Functional Group <span style="font-weight:400;color:var(--text-muted);font-size:0.8rem;">(FY2026&ndash;FY2027 planned, not actual)</span>';
      document.getElementById('dept-proposed-desc').textContent = `${BASIS_LABEL}. Click a group below to see its departments, then a department to see its Personnel / Operating / Capital split.`;
      return;
    }

    const depts = dept.departments[currentGroup];

    if (currentDept && depts[currentDept]) {
      const subcats = depts[currentDept];
      const subNames = Object.keys(subcats);
      const seriesDef = subNames.map(n => ({ key: n, label: n, colorVar: OBJECT_COLOR[n] || '--series-5' }));
      Charts.groupedBar(document.getElementById('dept-proposed-chart'), {
        years, seriesDef, values: subcats, height: 340,
      });
      Charts.renderLegend(document.getElementById('dept-proposed-legend'), [
        { items: seriesDef.map(s => ({ label: s.label, color: App.cssVar(s.colorVar) })) },
      ]);
      document.getElementById('dept-proposed-title').textContent = `${currentDept} — Personnel / Operating / Capital`;
      document.getElementById('dept-proposed-desc').textContent = `${BASIS_LABEL}, ${currentGroup} → ${currentDept}, broken into labor (Personnel), day-to-day (Operating), and capital purchases.`;
      return;
    }

    const names = Object.keys(depts);
    const seriesDef = names.map((n, i) => ({ key: n, label: n, colorVar: CYCLE_COLORS[i % CYCLE_COLORS.length] }));
    const values = {};
    names.forEach(n => { values[n] = deptTotalByYear(depts[n], years); });
    Charts.groupedBar(document.getElementById('dept-proposed-chart'), {
      years, seriesDef, values, height: 380,
    });
    Charts.renderLegend(document.getElementById('dept-proposed-legend'), [
      { items: seriesDef.map(s => ({ label: s.label, color: App.cssVar(s.colorVar) })) },
    ]);
    document.getElementById('dept-proposed-title').textContent = `Looking Ahead: General Fund Expenditures — ${currentGroup}`;
    document.getElementById('dept-proposed-desc').textContent = `${BASIS_LABEL}. Click a department below to see its Personnel / Operating / Capital split.`;
  }

  function initToggle() {
    const fy2027 = App.state.fy2027;
    if (!fy2027) return;
    const dept = fy2027.generalFundDepartments;
    const container = document.getElementById('dept-proposed-toggle');
    const groups = ['ALL', ...Object.keys(dept.departments)];
    container.innerHTML = '';
    groups.forEach(g => {
      const btn = document.createElement('button');
      btn.className = 'pill-btn' + (g === currentGroup ? ' active' : '');
      btn.textContent = g === 'ALL' ? 'All Groups' : g;
      btn.onclick = () => {
        currentGroup = g;
        currentDept = null;
        container.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        render();
      };
      container.appendChild(btn);
    });
  }

  window.DepartmentsProposed = {
    render: () => {
      if (!initialized) { initToggle(); initialized = true; }
      render();
    },
  };
})();
