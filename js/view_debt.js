(function () {
  function render() {
    const trend = App.state.trend;
    const debt = trend.debtOutstanding;

    Charts.multiLine(document.getElementById('debt-total-chart'), {
      years: debt.years, height: 260,
      seriesDef: [{ key: 'total', label: 'Total Outstanding Debt', colorVar: '--exp-debt' }],
      values: { total: debt.total_primary_government },
      yFormat: v => App.fmtMoney(v),
    });
    Charts.renderLegend(document.getElementById('debt-total-legend'), [
      { items: [{ label: 'Total outstanding debt, primary government', color: App.cssVar('--exp-debt'), line: true }] },
    ]);

    Charts.multiLine(document.getElementById('debt-percapita-chart'), {
      years: debt.years, height: 260,
      seriesDef: [{ key: 'pc', label: 'Debt per Capita', colorVar: '--series-7' }],
      values: { pc: debt.per_capita },
      yFormat: v => '$' + Math.round(v).toLocaleString('en-US'),
    });
    Charts.renderLegend(document.getElementById('debt-percapita-legend'), [
      { items: [{ label: 'Outstanding debt per resident', color: App.cssVar('--series-7'), line: true }] },
    ]);

    const e = trend.citywideExpenditures;
    const years = trend.years;
    const capitalOutlay = e["Capital Outlay"];
    const debtServiceTotal = years.map((_, i) => (e["Debt Service Principal"][i] || 0) + (e["Debt Service Interest"][i] || 0) + (e["Fiscal Charges"][i] || 0) + (e["Debt Issuance Costs"][i] || 0));

    Charts.multiLine(document.getElementById('debt-capital-chart'), {
      years, height: 260,
      seriesDef: [
        { key: 'capital', label: 'Capital Outlay', colorVar: '--exp-cap' },
        { key: 'debtservice', label: 'Debt Service (P&I)', colorVar: '--exp-debt' },
      ],
      values: { capital: capitalOutlay, debtservice: debtServiceTotal },
      yFormat: v => App.fmtMoney(v),
    });
    Charts.renderLegend(document.getElementById('debt-capital-legend'), [
      { items: [
        { label: 'Capital outlay', color: App.cssVar('--exp-cap'), line: true },
        { label: 'Debt service (principal + interest)', color: App.cssVar('--exp-debt'), line: true },
      ] },
    ]);

    Charts.multiLine(document.getElementById('debt-noncapital-chart'), {
      years, height: 220,
      seriesDef: [{ key: 'pct', label: 'Debt Service % of Noncapital Expenditures', colorVar: '--status-warn' }],
      values: { pct: trend.debtServicePctNoncapital },
      yFormat: v => v.toFixed(1) + '%',
      yDomain: [0, Math.max(30, d3.max(trend.debtServicePctNoncapital) * 1.15)],
    });
    Charts.renderLegend(document.getElementById('debt-noncapital-legend'), [
      { items: [{ label: 'Debt service as % of noncapital expenditures', color: App.cssVar('--status-warn'), line: true }] },
    ]);

    const cip = App.state.cip;
    if (cip) {
      Charts.stackedArea(document.getElementById('cip-chart'), {
        years: cip.years, height: 260,
        seriesDef: [
          { key: 'cip1990', label: '1990 Capital Improvement Fund', colorVar: '--series-1' },
          { key: 'cip2014', label: '2014 Capital Improvement Fund', colorVar: '--series-2' },
        ],
        values: { cip1990: cip.cip1990.total_expenditures, cip2014: cip.cip2014.total_expenditures },
      });
      Charts.renderLegend(document.getElementById('cip-legend'), [
        { items: [
          { label: '1990 Capital Improvement Fund (streets, facilities, fleet, parks)', color: App.cssVar('--series-1') },
          { label: '2014 Capital Improvement Fund (roads, drainage, economic development)', color: App.cssVar('--series-2') },
        ] },
      ]);
    }
  }

  App.registerView('debt', { onShow() { render(); } });
})();
