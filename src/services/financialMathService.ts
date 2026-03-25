// backend/src/services/financialMathService.ts

// SIP formula: M = P × ({[1 + r]^n – 1} / r) × (1 + r)
// P = monthly investment, r = monthly rate, n = total months
export function calculateSIPMonthly(
  targetAmount: number,
  years: number,
  annualReturnRate: number  // e.g. 0.12 for 12%
): number {
  const n = years * 12;
  const r = annualReturnRate / 12;
  // Reverse SIP formula — solve for P given target
  const P = targetAmount / (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
  return Math.round(P);
}

// FD formula: A = P(1 + r/n)^(nt)
export function calculateFDMonthly(
  targetAmount: number,
  years: number,
  annualRate: number  // e.g. 0.07 for 7%
): number {
  // Monthly deposit needed (simple approximation)
  const months = years * 12;
  const r = annualRate / 12;
  const fv = (Math.pow(1 + r, months) - 1) / r;
  return Math.round(targetAmount / fv);
}

// PPF formula: 7.1% fixed, 15-year lock-in, annual contributions
export function calculatePPFAnnual(targetAmount: number, years: number): number {
  const rate = 0.071;
  const n = Math.min(years, 15); // PPF max 15 years extendable
  let fv = 0;
  for (let i = 1; i <= n; i++) {
    fv += Math.pow(1 + rate, i);
  }
  return Math.round(targetAmount / fv / 12); // monthly equivalent
}

// Year-by-year SIP growth projection for the chart
export function projectSIPGrowth(
  monthlyAmount: number,
  years: number,
  annualRate: number
): { year: number; invested: number; value: number }[] {
  const r = annualRate / 12;
  const result = [];
  for (let y = 1; y <= years; y++) {
    const n = y * 12;
    const invested = monthlyAmount * n;
    const value = Math.round(
      monthlyAmount * (((Math.pow(1 + r, n) - 1) / r) * (1 + r))
    );
    result.push({ year: y, invested, value });
  }
  return result;
}

// Returns all three options with risk levels
export function computeAllOptions(targetAmount: number, years: number) {
  return {
    sip: {
      label: "SIP (Mutual Fund)",
      monthly: calculateSIPMonthly(targetAmount, years, 0.12),
      expectedReturn: "12% p.a.",
      risk: "moderate",
      taxBenefit: false,
      liquidity: "High — can withdraw anytime",
    },
    elss: {
      label: "ELSS (Tax-saving SIP)",
      monthly: calculateSIPMonthly(targetAmount, years, 0.13),
      expectedReturn: "13% p.a.",
      risk: "high",
      taxBenefit: true,
      liquidity: "3-year lock-in",
    },
    ppf: {
      label: "PPF (Government)",
      monthly: calculatePPFAnnual(targetAmount, years),
      expectedReturn: "7.1% p.a.",
      risk: "low",
      taxBenefit: true,
      liquidity: "15-year lock-in",
    },
    fd: {
      label: "FD (Fixed Deposit)",
      monthly: calculateFDMonthly(targetAmount, years, 0.07),
      expectedReturn: "7% p.a.",
      risk: "low",
      taxBenefit: false,
      liquidity: "Moderate — penalty on early exit",
    },
  };
}
