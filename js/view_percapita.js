(function () {
  function totalsByYear(trend) {
    const n = trend.years.length;
    const revenue = new Array(n).fill(0);
    const expenditure = new Array(n).fill(0);
    Object.values(trend.citywideRevenues).forEach(vals => vals.forEach((v, i) => { revenue[i] += v || 0; }));
    Object.values(trend.citywideExpenditures).forEach(vals => vals.forEach((v, i) => { expenditure[i] += v || 0; }));
    return { revenue, expenditure };
  }

  function index100(arr) {
    const base = arr[0];
    return arr.map(v => (v / base) * 100);
  }

  function render() {
    const trend = App.state.trend;
    const years = trend.years;
    const { revenue, expenditure } = totalsByYear(trend);
    const population = trend.demographics.population;

    const popIdx = index100(population);
    const revIdx = index100(revenue);
    const expIdx = index100(expenditure);

    const last = years.length - 1;
    document.getElementById('percapita-stats').innerHTML = `
      <span>Population growth FY${years[0]}&ndash;FY${years[last]} <b>+${(popIdx[last] - 100).toFixed(0)}%</b></span>
      <span>Revenue growth <b>+${(revIdx[last] - 100).toFixed(0)}%</b></span>
      <span>Expenditure growth <b>+${(expIdx[last] - 100).toFixed(0)}%</b></span>
    `;

    Charts.multiLine(document.getElementById('index-chart'), {
      years, height: 300,
      seriesDef: [
        { key: 'population', label: 'Population', colorVar: '--series-6' },
        { key: 'revenue', label: 'Total Revenue', colorVar: '--series-1' },
        { key: 'expenditure', label: 'Total Expenditure', colorVar: '--series-2' },
      ],
      values: { population: popIdx, revenue: revIdx, expenditure: expIdx },
      yFormat: v => v.toFixed(0),
      yDomain: [90, Math.max(180, d3.max([...popIdx, ...revIdx, ...expIdx]) * 1.08)],
    });
    Charts.renderLegend(document.getElementById('index-legend'), [
      { title: `Indexed to FY${years[0]} = 100`, items: [
        { label: 'Population', color: App.cssVar('--series-6'), line: true },
        { label: 'Total Revenue', color: App.cssVar('--series-1'), line: true },
        { label: 'Total Expenditure', color: App.cssVar('--series-2'), line: true },
      ] },
    ]);

    const revenuePerCapita = revenue.map((v, i) => v / population[i]);
    const expenditurePerCapita = expenditure.map((v, i) => v / population[i]);

    Charts.multiLine(document.getElementById('percapita-chart'), {
      years, height: 280,
      seriesDef: [
        { key: 'revenue', label: 'Revenue per Resident', colorVar: '--series-1' },
        { key: 'expenditure', label: 'Expenditure per Resident', colorVar: '--series-2' },
      ],
      values: { revenue: revenuePerCapita, expenditure: expenditurePerCapita },
      yFormat: v => '$' + Math.round(v).toLocaleString('en-US'),
    });
    Charts.renderLegend(document.getElementById('percapita-legend'), [
      { items: [
        { label: 'Revenue per resident', color: App.cssVar('--series-1'), line: true },
        { label: 'Expenditure per resident', color: App.cssVar('--series-2'), line: true },
      ] },
    ]);
  }

  App.registerView('percapita', { onShow() { render(); } });
})();
