const Categories = (() => {
  const REV_CATEGORIES = [
    "Sales & Use Tax", "Property Tax", "Simplified Sellers Use Tax", "Other Taxes (General Fund)", "Taxes (Other Funds)",
    "Building Permits", "Other Licenses & Permits",
    "Fines & Forfeitures",
    "Sanitation Charges (General Fund)", "Parking Charges (General Fund)", "Other Charges for Services (General Fund)", "Charges for Services (Other Funds)",
    "Intergovernmental", "Interest",
    "Recreational Revenue (General Fund)", "Contributions (General Fund)", "Other Miscellaneous (General Fund)", "Miscellaneous (Other Funds)",
  ];
  const REV_COLOR_VARS = [
    "--rev-1", "--rev-2", "--rev-3", "--rev-4", "--rev-5",
    "--rev-6", "--rev-7",
    "--rev-8",
    "--rev-9", "--rev-10", "--rev-11", "--rev-12",
    "--rev-13", "--rev-14",
    "--rev-15", "--rev-16", "--rev-17", "--rev-18",
  ];

  const EXP_CATEGORIES = [
    "General Government", "Public Safety", "Public Services", "Urban Development",
    "Intergovernmental Assist.", "Intergovernmental Assist. (School Property Tax Fund)", "Intergovernmental Assist. (PBA Cummings Research Park Fund)",
    "Capital Outlay",
    "Debt Service Principal", "Debt Service Interest", "Debt Service Issuance Costs",
  ];
  const EXP_COLOR_VARS = [
    "--exp-gov", "--exp-safe", "--exp-serv", "--exp-urban",
    "--exp-intgv", "--exp-intgv2", "--exp-intgv3",
    "--exp-cap",
    "--exp-debt-principal", "--exp-debt-interest", "--exp-debt-issuance",
  ];

  const BALANCE_IN = "Bond Proceeds & Transfers (net)";
  const BALANCE_OUT = "Added to Fund Balance";

  return { REV_CATEGORIES, REV_COLOR_VARS, EXP_CATEGORIES, EXP_COLOR_VARS, BALANCE_IN, BALANCE_OUT };
})();
