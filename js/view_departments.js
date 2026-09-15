(function () {
  const GROUP_COLOR = {
    "General Government": "--exp-gov",
    "Public Safety": "--exp-safe",
    "Public Services": "--exp-serv",
    "Urban Development": "--exp-urban",
    "Debt Service": "--exp-debt",
  };
  const CYCLE_COLORS = ["--series-1", "--series-2", "--series-3", "--series-4", "--series-5", "--series-6", "--series-7", "--series-8"];
  const OBJECT_COLOR = { "Personnel": "--series-1", "Operating": "--series-2", "Capital": "--series-3", "Special Appropriations": "--series-4", "Principal": "--series-1", "Interest": "--series-2" };

  let currentGroup = 'ALL';
  let currentDept = null;

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

  function renderDeptSubToggle(dept) {
    const container = document.getElementById('dept-subtoggle');
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
    const dept = App.state.dept;
    const years = dept.years;
    renderDeptSubToggle(dept);

    if (currentGroup === 'ALL') {
      const totals = groupTotals(dept, years);
      const groups = Object.keys(totals);
      const seriesDef = groups.map(g => ({ key: g, label: g, colorVar: GROUP_COLOR[g] || '--series-1' }));
      Charts.groupedBar(document.getElementById('dept-chart'), {
        years, seriesDef, values: totals, height: 380,
      });
      Charts.renderLegend(document.getElementById('dept-legend'), [
        { items: seriesDef.map(s => ({ label: s.label, color: App.cssVar(s.colorVar) })) },
      ]);
      document.getElementById('dept-title').textContent = 'General Fund Actual Expenditures by Functional Group';
      document.getElementById('dept-desc').textContent = 'FY2021–FY2025. Click a group below to see its departments, then a department to see its Personnel / Operating / Capital split.';
      return;
    }

    const depts = dept.departments[currentGroup];

    if (currentDept && depts[currentDept]) {
      const subcats = depts[currentDept];
      const subNames = Object.keys(subcats);
      const seriesDef = subNames.map(n => ({ key: n, label: n, colorVar: OBJECT_COLOR[n] || '--series-5' }));
      Charts.groupedBar(document.getElementById('dept-chart'), {
        years, seriesDef, values: subcats, height: 340,
      });
      Charts.renderLegend(document.getElementById('dept-legend'), [
        { items: seriesDef.map(s => ({ label: s.label, color: App.cssVar(s.colorVar) })) },
      ]);
      document.getElementById('dept-title').textContent = `${currentDept} — Personnel / Operating / Capital`;
      document.getElementById('dept-desc').textContent = `FY2021–FY2025 actual spending, ${currentGroup} → ${currentDept}, broken into labor (Personnel), day-to-day (Operating), and capital purchases.`;
      return;
    }

    const names = Object.keys(depts);
    const seriesDef = names.map((n, i) => ({ key: n, label: n, colorVar: CYCLE_COLORS[i % CYCLE_COLORS.length] }));
    const values = {};
    names.forEach(n => { values[n] = deptTotalByYear(depts[n], years); });
    Charts.groupedBar(document.getElementById('dept-chart'), {
      years, seriesDef, values, height: 380,
    });
    Charts.renderLegend(document.getElementById('dept-legend'), [
      { items: seriesDef.map(s => ({ label: s.label, color: App.cssVar(s.colorVar) })) },
    ]);
    document.getElementById('dept-title').textContent = `General Fund Actual Expenditures — ${currentGroup}`;
    document.getElementById('dept-desc').textContent = 'FY2021–FY2025. Click a department below to see its Personnel / Operating / Capital split.';
  }

  function initToggle() {
    const dept = App.state.dept;
    const container = document.getElementById('dept-toggle');
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

  App.registerView('departments', {
    init() { initToggle(); },
    onShow() {
      render();
      if (window.DepartmentsProposed) DepartmentsProposed.render();
    },
  });
})();
