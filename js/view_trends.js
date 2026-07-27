(function () {
  const REV_DEF = [
    { key: "Taxes", label: "Taxes", colorVar: "--rev-1" },
    { key: "Licenses & Permits", label: "Licenses & Permits", colorVar: "--rev-2" },
    { key: "Fines & Forfeitures", label: "Fines & Forfeitures", colorVar: "--rev-3" },
    { key: "Charges for Services", label: "Charges for Services", colorVar: "--rev-4" },
    { key: "Intergovernmental", label: "Intergovernmental", colorVar: "--rev-5" },
    { key: "Interest", label: "Interest", colorVar: "--rev-6" },
    { key: "Miscellaneous", label: "Miscellaneous & Other", colorVar: "--rev-7" },
  ];
  const EXP_DEF = [
    { key: "General Government", label: "General Government", colorVar: "--exp-gov" },
    { key: "Public Safety", label: "Public Safety", colorVar: "--exp-safe" },
    { key: "Public Services", label: "Public Services", colorVar: "--exp-serv" },
    { key: "Urban Development", label: "Urban Development", colorVar: "--exp-urban" },
    { key: "Intergovernmental Assist.", label: "Intergovernmental Assist.", colorVar: "--exp-intgv" },
    { key: "Capital Outlay", label: "Capital Outlay", colorVar: "--exp-cap" },
    { key: "Debt Service Principal", label: "Debt Service - Principal", colorVar: "--exp-debt-principal" },
    { key: "Debt Service Interest", label: "Debt Service - Interest", colorVar: "--exp-debt-interest" },
    { key: "Debt Service Issuance Costs", label: "Debt Service - Issuance Costs", colorVar: "--exp-debt-issuance" },
  ];

  function buildRevenueValues(trend) {
    const n = trend.years.length;
    const r = trend.citywideRevenues;
    const zeros = () => new Array(n).fill(0);
    const misc = zeros();
    for (let i = 0; i < n; i++) {
      misc[i] = (r["Miscellaneous"][i] || 0) + (r["Revenues from Money & Property"][i] || 0) + (r["Gifts and Donations"][i] || 0);
    }
    return {
      "Taxes": r["Taxes"],
      "Licenses & Permits": r["Licenses and Permits"],
      "Fines & Forfeitures": r["Fines and Forfeitures"],
      "Charges for Services": r["Charges for Services"],
      "Intergovernmental": r["Intergovernmental"],
      "Interest": r["Interest"],
      "Miscellaneous": misc,
    };
  }

  function buildExpenditureValues(trend) {
    const n = trend.years.length;
    const e = trend.citywideExpenditures;
    const issuance = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      issuance[i] = (e["Fiscal Charges"][i] || 0) + (e["Debt Issuance Costs"][i] || 0);
    }
    return {
      "General Government": e["General Government"],
      "Public Safety": e["Public Safety"],
      "Public Services": e["Public Services"],
      "Urban Development": e["Urban Development"],
      "Intergovernmental Assist.": e["Intergovernmental Assist."],
      "Capital Outlay": e["Capital Outlay"],
      "Debt Service Principal": e["Debt Service Principal"],
      "Debt Service Interest": e["Debt Service Interest"],
      "Debt Service Issuance Costs": issuance,
    };
  }

  function renderTotals(trend) {
    const years = trend.years;
    const revTotal = years.map((_, i) => Object.values(trend.citywideRevenues).reduce((s, v) => s + (v[i] || 0), 0));
    const expTotal = years.map((_, i) => Object.values(trend.citywideExpenditures).reduce((s, v) => s + (v[i] || 0), 0));

    const first = 0, last = years.length - 1;
    const revGrowth = ((revTotal[last] / revTotal[first]) - 1) * 100;
    const expGrowth = ((expTotal[last] / expTotal[first]) - 1) * 100;
    const deficitYears = years.filter((y, i) => expTotal[i] > revTotal[i]);

    document.getElementById('trend-stats').innerHTML = `
      <span>Revenue growth FY${years[first]}&ndash;FY${years[last]} <b>${revGrowth >= 0 ? '+' : ''}${revGrowth.toFixed(0)}%</b></span>
      <span>Expenditure growth <b>${expGrowth >= 0 ? '+' : ''}${expGrowth.toFixed(0)}%</b></span>
      <span>Deficit years <b>${deficitYears.length ? deficitYears.map(y => 'FY' + y).join(', ') : 'none'}</b></span>
    `;

    Charts.multiLine(document.getElementById('trend-total-chart'), {
      years, height: 220,
      seriesDef: [
        { key: 'revenue', label: 'Total Revenue', colorVar: '--series-1' },
        { key: 'expenditure', label: 'Total Expenditure', colorVar: '--series-2' },
      ],
      values: { revenue: revTotal, expenditure: expTotal },
      yFormat: v => App.fmtMoney(v),
    });
    Charts.renderLegend(document.getElementById('trend-total-legend'), [
      { items: [
        { label: 'Total Revenue', color: App.cssVar('--series-1'), line: true },
        { label: 'Total Expenditure', color: App.cssVar('--series-2'), line: true },
      ] },
    ]);
  }

  function render() {
    const trend = App.state.trend;
    const years = trend.years;

    renderTotals(trend);

    const revValues = buildRevenueValues(trend);
    Charts.stackedArea(document.getElementById('revenue-mix-chart'), {
      years, seriesDef: REV_DEF, values: revValues, height: 300,
    });
    Charts.renderLegend(document.getElementById('revenue-mix-legend'), [
      { items: REV_DEF.map(s => ({ label: s.label, color: App.cssVar(s.colorVar) })) },
    ]);

    const expValues = buildExpenditureValues(trend);
    Charts.stackedArea(document.getElementById('expenditure-mix-chart'), {
      years, seriesDef: EXP_DEF, values: expValues, height: 300,
    });
    Charts.renderLegend(document.getElementById('expenditure-mix-legend'), [
      { items: EXP_DEF.map(s => ({ label: s.label, color: App.cssVar(s.colorVar) })) },
    ]);

    const taxDef = [
      { key: "Sales & Use Tax", label: "Sales & Use Tax", colorVar: "--rev-1" },
      { key: "Property Tax", label: "Property Tax", colorVar: "--rev-3" },
      { key: "Simplified Sellers Use Tax", label: "Simplified Sellers Use Tax", colorVar: "--rev-5" },
      { key: "Lodging Tax", label: "Lodging Tax", colorVar: "--rev-7" },
      { key: "All Other Taxes", label: "All Other Taxes", colorVar: "--rev-9" },
    ];
    Charts.stackedArea(document.getElementById('tax-detail-chart'), {
      years, seriesDef: taxDef, values: trend.taxDetail, height: 300,
    });
    Charts.renderLegend(document.getElementById('tax-detail-legend'), [
      { items: taxDef.map(s => ({ label: s.label, color: App.cssVar(s.colorVar) })) },
    ]);
  }

  App.registerView('trends', { onShow() { render(); } });
})();
