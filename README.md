# Huntsville Budget Explorer

Interactive visualizations of the City of Huntsville, Alabama's municipal budget, built from the
City's own Annual Comprehensive Financial Reports (ACFR).

Views:
- **Budget Flow** — Sankey diagram of revenue sources -> funds -> expenditure functions, one per fiscal year (FY2021-FY2025)
- **Revenue & Expenditures** — citywide revenue/expenditure totals and category mix over FY2016-FY2025
- **Fund Balance & Reserves** — fund balance composition and the General Fund's reserve ratio vs. its 11.5% policy floor
- **Debt & Capital** — total outstanding debt, debt per capita, capital outlay vs. debt service
- **Growth & Per Capita** — population growth vs. budget growth, revenue/expenditure per resident
- **General Fund by Department** — actual General Fund spending by department, FY2021-FY2025
- Bonus panel on Debt & Capital: **10-Year Capital Improvement Plan** — planned (not actual) capital spending FY2026-FY2035, from the FY2026 Adopted Budget Book

## Data sources

All figures are transcribed by hand from the PDFs published at the City's
[Annual Comprehensive Financial Reports](https://www.huntsvilleal.gov/government/finances-budget/annual-comprehensive-financial-reports/)
page, and cross-checked against each report's own reported totals:

| File | Source |
|---|---|
| `data/budget_data.json` | Each year's "Statement of Revenues, Expenditures, and Changes in Fund Balances - Governmental Funds" (FY2021-FY2025 ACFRs) |
| `data/trend_data.json` | The FY2025 ACFR's statistical section: Schedules C, D, E, K, P, R (each a 10-year, FY2016-FY2025 rolling history) |
| `data/department_data.json` | Each year's "Schedule of Revenues, Expenditures, and Changes in Fund Balances - Budget (GAAP Basis) and Actual - General Fund" (FY2021-FY2025 ACFRs) -- the same schedule's REVENUES section also supplies the Sales & Use Tax / Property Tax / Simplified Sellers Use Tax / Building Permits / Other Licenses breakdown used in Budget Flow |
| `data/cip_data.json` | The [FY2026 Adopted Budget Book](https://www.huntsvilleal.gov/government/finances-budget/annual-municipal-and-capital-budgets/)'s 1990 & 2014 Capital Improvement Fund ten-year plans (planned, FY2026-FY2035) |

### Known caveats

- Excludes proprietary/enterprise funds (Water Pollution Control, Parking & Public Transit, Sanitation)
  and fiduciary funds -- this covers governmental funds only.
- The Budget Flow view's "Bond Proceeds & Transfers (net)" and "Added to Fund Balance" nodes are a
  simplification: they net each fund's "Other Financing Sources (Uses)" (debt issuance, bond premiums,
  transfers between funds) into a single balancing flow so that revenue in equals expenditure out.
- The multi-year trend views draw on the ACFR's own 10-year statistical schedules, which reflect
  routine prior-period reclassifications and can differ slightly from a given year's originally
  published statement (e.g. FY2022 taxes: $446.8M in the trend schedule vs. $460.0M in the FY2022
  report itself, a $13.2M Simplified Sellers Use Tax reclassification).
- The General Fund department schedule covers the "General Fund - General Fund" budgetary fund; a
  few small blended component funds (Health & Life Benefits, Humane Education, Animal Sterilization,
  Revolving Revenues) are consolidated into the Budget Flow view's General Fund total but aren't
  broken out by department, so department totals run 0.4-0.9% under that figure each year.
- Sales & Use Tax, Property Tax, Simplified Sellers Use Tax, Building Permits, and Other Licenses &
  Permits are broken out for the General Fund only (the only fund where the ACFR discloses this level
  of detail). Any other fund carrying a Taxes balance is a Capital Improvement Plan fund -- per the
  ACFR's own MD&A, "The Capital Improvement Fund encompasses both the 1990 and 2014 Capital Plans,"
  both funded by earmarked portions of Sales & Use Tax -- so that revenue is routed through the same
  Sales & Use Tax node. Nonmajor "Other Governmental Funds" carry a mix of taxes (lodging, gas, etc.)
  that isn't separately disclosed at this level, so it's shown as a single "Taxes (Other Funds)" flow.

## Running locally

No build step -- static HTML/CSS/JS. Serve the directory with any static file server, e.g.:

```
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Stack

Vanilla JS + [D3](https://d3js.org/) + [d3-sankey](https://github.com/d3/d3-sankey), loaded from jsDelivr.
No build tooling, no framework.
