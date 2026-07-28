(function () {
  const FUND_COMPONENT_DEF = [
    { key: "Unassigned", label: "Unassigned", colorVar: "--series-1" },
    { key: "Assigned", label: "Assigned", colorVar: "--series-4" },
    { key: "Committed", label: "Committed", colorVar: "--series-3" },
    { key: "Restricted", label: "Restricted", colorVar: "--series-7" },
    { key: "Nonspendable", label: "Nonspendable", colorVar: "--series-6" },
  ];

  function render() {
    const hcs = App.state.hcs;
    if (!hcs) return;
    const years = hcs.years;

    // ---- Total revenue vs. expenses ----
    const totalRevenue = years.map((_, i) =>
      hcs.revenues.chargesForServices[i] + hcs.revenues.operatingGrants[i] + hcs.revenues.capitalGrants[i] +
      hcs.revenues.adValoremTax[i] + hcs.revenues.salesTax[i] + hcs.revenues.otherTax[i] + hcs.revenues.other[i]);
    const totalExpense = years.map((_, i) =>
      hcs.expenses.instruction[i] + hcs.expenses.instructionalSupport[i] + hcs.expenses.operationMaintenance[i] +
      hcs.expenses.auxiliary[i] + hcs.expenses.generalAdmin[i] + hcs.expenses.interest[i] + hcs.expenses.other[i]);

    const last = years.length - 1;
    const revGrowth = ((totalRevenue[last] / totalRevenue[0]) - 1) * 100;
    const expGrowth = ((totalExpense[last] / totalExpense[0]) - 1) * 100;
    const npGrowth = ((hcs.netPosition.total[last] / hcs.netPosition.total[0]) - 1) * 100;
    document.getElementById('hcs-total-stats').innerHTML = `
      <span>Revenue growth FY${years[0]}&ndash;FY${years[last]} <b>+${revGrowth.toFixed(0)}%</b></span>
      <span>Expense growth <b>+${expGrowth.toFixed(0)}%</b></span>
      <span>Net position growth <b>+${npGrowth.toFixed(0)}%</b></span>
    `;

    Charts.multiLine(document.getElementById('hcs-total-chart'), {
      years, height: 280,
      seriesDef: [
        { key: 'revenue', label: 'Total Revenue', colorVar: '--series-1' },
        { key: 'expense', label: 'Total Expenses', colorVar: '--series-2' },
      ],
      values: { revenue: totalRevenue, expense: totalExpense },
      yFormat: v => App.fmtMoney(v),
    });
    Charts.renderLegend(document.getElementById('hcs-total-legend'), [
      { items: [
        { label: 'Total revenue', color: App.cssVar('--series-1'), line: true },
        { label: 'Total expenses', color: App.cssVar('--series-2'), line: true },
      ] },
    ]);

    // ---- Per-pupil spending ----
    const enrollForYears = years.map(yr => hcs.enrollment.count[hcs.enrollment.years.indexOf(yr)]);
    const revenuePerPupil = totalRevenue.map((v, i) => v / enrollForYears[i]);
    const expensePerPupil = totalExpense.map((v, i) => v / enrollForYears[i]);
    const enrollChange = ((enrollForYears[last] / enrollForYears[0]) - 1) * 100;
    const expPerPupilGrowth = ((expensePerPupil[last] / expensePerPupil[0]) - 1) * 100;
    document.getElementById('hcs-perpupil-stats').innerHTML = `
      <span>Expense per pupil FY${years[0]} <b>${App.fmtMoney(expensePerPupil[0], { full: true })}</b> &rarr; FY${years[last]} <b>${App.fmtMoney(expensePerPupil[last], { full: true })}</b></span>
      <span>Expense per pupil growth <b>+${expPerPupilGrowth.toFixed(0)}%</b></span>
      <span>Enrollment change <b>${enrollChange >= 0 ? '+' : ''}${enrollChange.toFixed(1)}%</b></span>
    `;

    Charts.multiLine(document.getElementById('hcs-perpupil-chart'), {
      years, height: 280,
      seriesDef: [
        { key: 'revenue', label: 'Revenue per Pupil', colorVar: '--series-1' },
        { key: 'expense', label: 'Expense per Pupil', colorVar: '--series-2' },
      ],
      values: { revenue: revenuePerPupil, expense: expensePerPupil },
      yFormat: v => '$' + Math.round(v).toLocaleString('en-US'),
    });
    Charts.renderLegend(document.getElementById('hcs-perpupil-legend'), [
      { items: [
        { label: 'Revenue per pupil', color: App.cssVar('--series-1'), line: true },
        { label: 'Expense per pupil', color: App.cssVar('--series-2'), line: true },
      ] },
    ]);

    // ---- Revenue mix ----
    const revDef = [
      { key: 'adValoremTax', label: 'Ad Valorem Tax', colorVar: '--rev-2' },
      { key: 'operatingGrants', label: 'Operating Grants (State/Federal)', colorVar: '--rev-8' },
      { key: 'salesTax', label: 'Sales Tax', colorVar: '--rev-14' },
      { key: 'chargesForServices', label: 'Charges for Services', colorVar: '--rev-19' },
      { key: 'capitalGrants', label: 'Capital Grants', colorVar: '--exp-cap' },
      { key: 'otherTax', label: 'Other Taxes', colorVar: '--series-4' },
      { key: 'other', label: 'Other', colorVar: '--baseline' },
    ];
    Charts.stackedArea(document.getElementById('hcs-revenue-mix-chart'), {
      years, seriesDef: revDef, values: hcs.revenues, height: 300,
    });
    Charts.renderLegend(document.getElementById('hcs-revenue-mix-legend'), [
      { items: revDef.map(s => ({ label: s.label, color: App.cssVar(s.colorVar) })) },
    ]);

    // ---- Expense mix ----
    const expDef = [
      { key: 'instruction', label: 'Instruction', colorVar: '--exp-safe' },
      { key: 'instructionalSupport', label: 'Instructional Support', colorVar: '--exp-serv' },
      { key: 'operationMaintenance', label: 'Operation & Maintenance', colorVar: '--exp-gov' },
      { key: 'auxiliary', label: 'Auxiliary (Transportation & Food Service)', colorVar: '--exp-urban' },
      { key: 'generalAdmin', label: 'General Administration', colorVar: '--exp-intgv2' },
      { key: 'interest', label: 'Interest & Fiscal Charges', colorVar: '--exp-debt' },
      { key: 'other', label: 'Other (Pre-K, Extended Day)', colorVar: '--baseline' },
    ];
    Charts.stackedArea(document.getElementById('hcs-expense-mix-chart'), {
      years, seriesDef: expDef, values: hcs.expenses, height: 300,
    });
    Charts.renderLegend(document.getElementById('hcs-expense-mix-legend'), [
      { items: expDef.map(s => ({ label: s.label, color: App.cssVar(s.colorVar) })) },
    ]);

    // ---- Net position components ----
    Charts.multiLine(document.getElementById('hcs-networth-chart'), {
      years, height: 300,
      seriesDef: [
        { key: 'total', label: 'Total Net Position', colorVar: '--series-1' },
        { key: 'nic', label: 'Net Investment in Capital Assets', colorVar: '--series-3' },
        { key: 'restricted', label: 'Restricted', colorVar: '--series-7' },
        { key: 'unrestricted', label: 'Unrestricted', colorVar: '--series-8' },
      ],
      values: {
        total: hcs.netPosition.total,
        nic: hcs.netPosition.netInvestmentCapitalAssets,
        restricted: hcs.netPosition.restricted,
        unrestricted: hcs.netPosition.unrestricted,
      },
      yFormat: v => App.fmtMoney(v),
    });
    Charts.renderLegend(document.getElementById('hcs-networth-legend'), [
      { items: [
        { label: 'Total net position', color: App.cssVar('--series-1'), line: true },
        { label: 'Net investment in capital assets', color: App.cssVar('--series-3'), line: true },
        { label: 'Restricted', color: App.cssVar('--series-7'), line: true },
        { label: 'Unrestricted (negative — pension/OPEB liability)', color: App.cssVar('--series-8'), line: true },
      ] },
    ]);

    // ---- Pension & OPEB liabilities ----
    const liab = hcs.liabilities;
    Charts.multiLine(document.getElementById('hcs-liabilities-chart'), {
      years: liab.years, height: 280,
      seriesDef: [
        { key: 'pension', label: 'Net Pension Liability', colorVar: '--series-2' },
        { key: 'opeb', label: 'Net OPEB Liability', colorVar: '--series-5' },
      ],
      values: { pension: liab.netPensionLiability, opeb: liab.netOPEBLiability },
      yFormat: v => App.fmtMoney(v),
    });
    Charts.renderLegend(document.getElementById('hcs-liabilities-legend'), [
      { items: [
        { label: 'Net pension liability (TRS)', color: App.cssVar('--series-2'), line: true },
        { label: 'Net OPEB liability (PEEHIP retiree health)', color: App.cssVar('--series-5'), line: true },
      ] },
    ]);

    // ---- Debt ----
    Charts.multiLine(document.getElementById('hcs-debt-chart'), {
      years, height: 240,
      seriesDef: [{ key: 'debt', label: "Board's Own Debt", colorVar: '--exp-debt' }],
      values: { debt: hcs.debt.boardIssued },
      yFormat: v => App.fmtMoney(v),
    });

    Charts.multiLine(document.getElementById('hcs-citydebt-chart'), {
      years: hcs.debt.cityIssuedParYears, height: 240,
      seriesDef: [{ key: 'citydebt', label: 'City-Issued Bonds (par)', colorVar: '--series-7' }],
      values: { citydebt: hcs.debt.cityIssuedPar },
      yFormat: v => App.fmtMoney(v),
    });

    // ---- Fund balance total ----
    Charts.multiLine(document.getElementById('hcs-fundtotal-chart'), {
      years, height: 240,
      seriesDef: [{ key: 'fb', label: 'Combined Governmental Fund Balance', colorVar: '--status-good' }],
      values: { fb: hcs.fundBalanceTotal },
      yFormat: v => App.fmtMoney(v),
    });

    // ---- Fund balance composition (years with detail only) ----
    const fbYears = hcs.fundBalanceDetail.years;
    Charts.stackedArea(document.getElementById('hcs-gfbalance-chart'), {
      years: fbYears, seriesDef: FUND_COMPONENT_DEF, values: hcs.fundBalanceDetail.generalFund, height: 260,
    });
    Charts.stackedArea(document.getElementById('hcs-otherbalance-chart'), {
      years: fbYears, seriesDef: FUND_COMPONENT_DEF, values: hcs.fundBalanceDetail.otherFunds, height: 260,
    });
    Charts.renderLegend(document.getElementById('hcs-balance-legend'), [
      { items: FUND_COMPONENT_DEF.map(s => ({ label: s.label, color: App.cssVar(s.colorVar) })) },
    ]);

    // ---- Enrollment ----
    Charts.multiLine(document.getElementById('hcs-enrollment-chart'), {
      years: hcs.enrollment.years, height: 260,
      seriesDef: [{ key: 'enrollment', label: 'Student Enrollment', colorVar: '--series-6' }],
      values: { enrollment: hcs.enrollment.count },
      yFormat: v => Math.round(v).toLocaleString('en-US'),
      yDomain: [21500, 23500],
    });
  }

  App.registerView('hcs', { onShow() { render(); } });
})();
