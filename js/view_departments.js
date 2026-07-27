(function () {
  const GROUP_COLOR = {
    "General Government": "--exp-gov",
    "Public Safety": "--exp-safe",
    "Public Services": "--exp-serv",
    "Urban Development": "--exp-urban",
    "Debt Service": "--exp-debt",
  };
  const CYCLE_COLORS = ["--series-1", "--series-2", "--series-3", "--series-4", "--series-5", "--series-6", "--series-7", "--series-8"];

  let currentGroup = 'ALL';

  function groupTotals(dept, years) {
    const out = {};
    Object.keys(dept.departments).forEach(group => {
      const depts = dept.departments[group];
      out[group] = years.map((y, i) => Object.values(depts).reduce((s, arr) => s + (arr[i] || 0), 0));
    });
    return out;
  }

  function render() {
    const dept = App.state.dept;
    const years = dept.years;

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
    } else {
      const depts = dept.departments[currentGroup];
      const names = Object.keys(depts);
      const seriesDef = names.map((n, i) => ({ key: n, label: n, colorVar: CYCLE_COLORS[i % CYCLE_COLORS.length] }));
      const values = {};
      names.forEach(n => { values[n] = depts[n]; });
      Charts.groupedBar(document.getElementById('dept-chart'), {
        years, seriesDef, values, height: 380,
      });
      Charts.renderLegend(document.getElementById('dept-legend'), [
        { items: seriesDef.map(s => ({ label: s.label, color: App.cssVar(s.colorVar) })) },
      ]);
      document.getElementById('dept-title').textContent = `General Fund Actual Expenditures — ${currentGroup}`;
    }
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
        container.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        render();
      };
      container.appendChild(btn);
    });
  }

  App.registerView('departments', {
    init() { initToggle(); },
    onShow() { render(); },
  });
})();
