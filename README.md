# Huntsville Budget Explorer

Interactive visualizations of the City of Huntsville, Alabama's municipal budget, built from the
City's own Annual Comprehensive Financial Reports (ACFR).

Views:
- **Budget Flow** — Sankey diagram of revenue sources -> funds -> expenditure functions, one per fiscal year (FY2021-FY2025 audited actuals, plus FY2026-FY2027 planned budget years with narrower fund coverage), down to ~35 revenue/expenditure line items
- **Income & Expense Tree** — zoomable nested treemap of the same data, click any box to drill in, from fund all the way down to an individual department's Personnel/Operating/Capital split
- **Revenue & Expenditures** — citywide revenue/expenditure totals and category mix over FY2016-FY2025, plus a dedicated tax-by-type chart
- **Fund Balance & Reserves** — fund balance composition and the General Fund's reserve ratio vs. its 11.5% policy floor
- **Debt & Capital** — total outstanding debt, debt per capita, capital outlay vs. debt service
- **Growth & Per Capita** — population growth vs. budget growth, revenue/expenditure per resident
- **General Fund by Department** — actual General Fund spending by department, FY2021-FY2025, drill into any department for its Personnel/Operating/Capital split; plus a "Looking Ahead" panel with the same drill-down for FY2025 actual/FY2026 revised/FY2027 proposed, and a "what's in Special Appropriations" panel itemizing every nonprofit/agency award (toggle between the FY2026 Adopted and FY2027 Proposed budget books)
- **Schools (HCS)** — Huntsville City Schools' own government-wide revenue/expense trend, net position, pension & OPEB liability, debt, fund balance, and enrollment, FY2019-FY2024 (HCS is a legally separate state agency with its own audited financials, not part of the City's ACFR)
- Bonus panel on Revenue & Expenditures: **Top Revenue Sources** — the FY2027 Proposed Budget's own revenue table, FY2021 actual through FY2027 proposed

## Data sources

All figures are transcribed by hand from the PDFs published at the City's
[Annual Comprehensive Financial Reports](https://www.huntsvilleal.gov/government/finances-budget/annual-comprehensive-financial-reports/)
page, and cross-checked against each report's own reported totals:

| File | Source |
|---|---|
| `data/budget_data.json` | Each year's "Statement of Revenues, Expenditures, and Changes in Fund Balances - Governmental Funds" (FY2021-FY2025 ACFRs). FY2026 and FY2027 are planned-budget years, from the [FY2027 Proposed Budget Book](https://www.huntsvilleal.gov/wp-content/uploads/2026/09/1.-Full-Book.pdf) (General Fund, Lodging & Liquor Tax Fund, and Special Revenue Funds for both years) and the [FY2026 Adopted Budget Book](https://www.huntsvilleal.gov/wp-content/uploads/2025/09/Budget-Book-09-26-25v8withMayorLetter-2.pdf) (1990 & 2014 Capital Improvement Funds, FY2026 only -- the FY2027 book has no CIP section); full methodology and category-mapping notes are in each year's own `note` field |
| `data/trend_data.json` | The FY2025 ACFR's statistical section: Schedules C, D, E, K, P, R (each a 10-year, FY2016-FY2025 rolling history) |
| `data/department_data.json` | Each year's "Schedule of Revenues, Expenditures, and Changes in Fund Balances - Budget (GAAP Basis) and Actual - General Fund" (FY2021-FY2025 ACFRs) -- the same schedule's REVENUES section also supplies the Sales & Use Tax / Property Tax / Simplified Sellers Use Tax / Building Permits / Other Licenses breakdown used in Budget Flow |
| `data/special_appropriations_fy2026.json` | The [FY2026 Adopted Budget Book](https://www.huntsvilleal.gov/wp-content/uploads/2025/09/Budget-Book-09-26-25v8withMayorLetter-2.pdf)'s itemized Agency & Intergovernmental Appropriations list, pp.68-70 (planned, FY2026 only) |
| `data/special_appropriations_fy2027.json` | The [FY2027 Proposed Outside Agency Appropriations book](https://www.huntsvilleal.gov/wp-content/uploads/2026/09/2.-Appropriations-Book-2027.pdf)'s itemized, per-agency detail (planned, FY2027 only -- reorganizes the FY2026 book's category taxonomy and folds Library funding into a new "Public Resources" General Fund category) |
| `data/fy2027_proposed_data.json` | The [FY2027 Proposed Annual Budget](https://www.huntsvilleal.gov/wp-content/uploads/2026/09/1.-Full-Book.pdf)'s "Top Revenue Sources" table (pp.6-8, FY2021 actual through FY2027 proposed) and General Fund department budget tables (pp.18-23, FY2025 actual/FY2026 revised/FY2027 proposed) |

`department_data.json` also carries each department's actual spend split into Personnel / Operating / Capital
(and Debt Service into Principal / Interest), transcribed from the same GF budget-actual schedule's line items.

`budget_data.json`'s "Taxes (Other Funds)" and "Intergovernmental Assist." (Other Funds) are further split into
the actual nonmajor funds that make them up, for all five years -- transcribed from each year's ACFR "Combining
Statement of Revenues, Expenditures, and Changes in Fund Balances - Nonmajor Governmental Funds":
- **Taxes**: Lodging & Liquor Tax Fund, 6.5 Mill Public Safety Debt Fund, 6.5 Mill School Property Tax Fund,
  School Property Tax Fund, 1990 School Support Fund, PBA Cummings Research Park Fund (fund names are verbatim
  from the source; "Mill" funds are dedicated property-tax millage levies, separate from the General Fund's own
  6.5-mill property tax)
- **Intergovernmental Assistance**: School Property Tax Fund (a pure pass-through to Huntsville City Schools --
  revenue and expenditure are identical every year) and, starting FY2025 only, the PBA Cummings Research Park Fund

`data/hcs_data.json` is transcribed by hand from Huntsville City Schools' own audited financial statements
(FY2019-FY2024), published at the
[HCS Finance Department's audits page](https://www.huntsvillecityschools.org/documents/departments/finance/other-financial-documents-%26-information/audits/515438).
HCS is a legally separate agency of the State of Alabama (not a City department) and files its own annual
audit rather than an ACFR; its fiscal year also ends September 30. Sourced from each year's Statement of
Net Position, Statement of Activities, Balance Sheet -- Governmental Funds, the required-supplementary
10-year Schedule of Proportionate Share of the Collective Net Pension Liability / Net OPEB Liability, and
the Management's Discussion & Analysis enrollment table.

### HCS known caveats

- Revenue and expense category mixes use each year's own MD&A groupings (Instruction, Instructional
  Support, Operation & Maintenance, Auxiliary [Transportation + Food Service], General Administration,
  Interest & Fiscal Charges, Other), which stay consistent across years even where the underlying fund
  structure changed -- Capital Projects became its own major fund starting the FY2023 audit, having
  previously been folded into "Other Governmental Funds."
- FY2019 and FY2021 fund-balance composition (the GASB nonspendable/restricted/committed/assigned/unassigned
  split) wasn't available in the audits reviewed -- only FY2020, FY2022, FY2023, and FY2024 fund-level
  balance sheets were transcribed, so the General Fund / Other Funds composition charts interpolate across
  the FY2021 gap. The combined governmental fund balance *total* (no composition breakdown) is available
  for all six years.
- "City-Issued Bonds for HCS Capital Projects" is the outstanding par value of bonds the City of Huntsville
  issues on HCS's behalf, serviced from HCS's share of local property tax (per each audit's long-term debt
  note) -- only years with a disclosed balance are charted (FY2020, FY2022-FY2024), and the series is
  non-monotonic because of periodic refunding activity, not steady borrowing.
- The Net Pension/OPEB Liability swings (particularly the OPEB liability's collapse in FY2020 and again in
  FY2023) reflect the State's PEEHIP/TRS actuarial discount-rate assumptions resetting, not a change in
  benefits or HCS's actual cash funding.
- 2019 and 2021 net position components (Net Investment in Capital Assets / Restricted / Unrestricted) are
  taken from each audit's MD&A Table 1, which rounds to the nearest $10,000; all other years use exact
  Statement of Net Position figures.

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
  of detail). Any other *major* fund carrying a Taxes balance is a Capital Improvement Plan fund -- per
  the ACFR's own MD&A, "The Capital Improvement Fund encompasses both the 1990 and 2014 Capital Plans,"
  both funded by earmarked portions of Sales & Use Tax -- so that revenue is routed through the same
  Sales & Use Tax node.
- The ACFR never separates "sales tax" from "use tax," and the City's sales/use tax rate has been flat
  at 4.5% for all ten years on record -- there's no further split available for that category beyond
  which fund it lands in.

### FY2026-FY2027 planned-budget methodology

Budget Flow and the Income & Expense Tree also cover FY2026 and FY2027, built from the City's budget
books rather than an audited ACFR, with narrower fund coverage than the FY2021-2025 actuals:

- **FY2026** uses the FY2027 Proposed Budget Book's "Projected FY2026" revenue column and "Revised
  Budget FY2026" expenditure column, plus the FY2026 Adopted Budget Book's own ten-year plan for the
  1990 & 2014 Capital Improvement Funds (first-year figures -- the FY2027 book has no CIP section at
  all). Grants Fund isn't itemized in either source, so it's left out.
- **FY2027** uses the Proposed Budget Book's own FY2027 columns, covering only the General Fund and
  "Other Governmental Funds" (Lodging & Liquor Tax Fund plus the Gas Tax, HCS Support, 6.5 Mill, and
  TIF Special Revenue Funds). No Capital Improvement Fund data exists for FY2027, so capital spending
  is understated relative to FY2026.
- Both years exclude inter-fund transfers and fund-balance draws from the revenue/expenditure
  categories -- they show up via the automatic balancing flow instead, same as the audited years.
- TIF district property tax revenue is filed under the closest existing category, "Taxes (PBA
  Cummings Research Park Fund)." CIP debt service has no principal/interest split in the source, so
  it's lumped entirely under Debt Service Principal.

## Running locally

No build step -- static HTML/CSS/JS. Serve the directory with any static file server, e.g.:

```
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Stack

Vanilla JS + [D3](https://d3js.org/) + [d3-sankey](https://github.com/d3/d3-sankey), loaded from jsDelivr.
No build tooling, no framework.
