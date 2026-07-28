const App = (() => {
  const state = { budget: null, trend: null, dept: null, cip: null, hcs: null };

  function cssVar(name, el) {
    return getComputedStyle(el || document.documentElement).getPropertyValue(name).trim();
  }

  function fmtMoney(v, opts = {}) {
    const abs = Math.abs(v);
    const sign = v < 0 ? '-' : '';
    if (opts.full) return (v < 0 ? '-$' : '$') + Math.round(abs).toLocaleString('en-US');
    if (abs >= 1e9) return sign + '$' + (abs / 1e9).toFixed(2).replace(/\.00$/, '') + 'B';
    if (abs >= 1e6) return sign + '$' + (abs / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (abs >= 1e3) return sign + '$' + (abs / 1e3).toFixed(0) + 'K';
    return sign + '$' + Math.round(abs);
  }

  function fmtCompact(v) {
    const abs = Math.abs(v);
    const sign = v < 0 ? '-' : '';
    if (abs >= 1e6) return sign + (abs / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (abs >= 1e3) return sign + (abs / 1e3).toFixed(0) + 'K';
    return sign + String(Math.round(abs));
  }

  const tooltip = document.getElementById('tooltip');
  function showTooltip(html, evt) {
    tooltip.innerHTML = html;
    const pad = 14;
    let x = evt.clientX + pad, y = evt.clientY + 10;
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
    tooltip.style.opacity = 1;
  }
  function hideTooltip() { tooltip.style.opacity = 0; }

  async function loadData() {
    const [budget, trend, dept, cip, hcs] = await Promise.all([
      fetch('data/budget_data.json').then(r => r.json()),
      fetch('data/trend_data.json').then(r => r.json()),
      fetch('data/department_data.json').then(r => r.json()),
      fetch('data/cip_data.json').then(r => r.json()),
      fetch('data/hcs_data.json').then(r => r.json()),
    ]);
    state.budget = budget;
    state.trend = trend;
    state.dept = dept;
    state.cip = cip;
    state.hcs = hcs;
  }

  const views = {};
  function registerView(name, fns) { views[name] = fns; }

  function setupTabs() {
    const buttons = document.querySelectorAll('nav.tabs button');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const view = document.getElementById('view-' + btn.dataset.view);
        view.classList.add('active');
        if (views[btn.dataset.view] && views[btn.dataset.view].onShow) {
          views[btn.dataset.view].onShow();
        }
      });
    });
  }

  async function boot() {
    await loadData();
    setupTabs();
    Object.keys(views).forEach(name => {
      if (views[name].init) views[name].init(state);
    });
    const activeBtn = document.querySelector('nav.tabs button.active') || document.querySelector('nav.tabs button');
    if (activeBtn && views[activeBtn.dataset.view] && views[activeBtn.dataset.view].onShow) {
      views[activeBtn.dataset.view].onShow();
    }

    let resizeT;
    window.addEventListener('resize', () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(() => {
        Object.keys(views).forEach(name => {
          const el = document.getElementById('view-' + name);
          if (el && el.classList.contains('active') && views[name].onShow) views[name].onShow();
        });
      }, 150);
    });
  }

  return { state, cssVar, fmtMoney, fmtCompact, showTooltip, hideTooltip, registerView, boot };
})();
