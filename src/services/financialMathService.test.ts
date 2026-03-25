// backend/src/services/financialMathService.test.ts
import {
  calculateSIPMonthly,
  calculateFDMonthly,
  calculatePPFAnnual,
  projectSIPGrowth,
} from "./financialMathService";

function assert(label: string, actual: number, expected: number, tolerance = 50) {
  const diff = Math.abs(actual - expected);
  const status = diff <= tolerance ? "✅ PASS" : "❌ FAIL";
  console.log(`${status} | ${label}`);
  console.log(`       Got: ₹${Math.round(actual).toLocaleString("en-IN")}`);
  console.log(`  Expected: ₹${Math.round(expected).toLocaleString("en-IN")}`);
  console.log(`      Diff: ₹${Math.round(diff)}\n`);
}

// ─── Known correct values (verified against Groww + ET Money calculators) ───

// SIP: ₹10L target, 15 years, 12% → ₹2,002/month
assert("SIP ₹10L / 15yr / 12%", calculateSIPMonthly(1_000_000, 15, 0.12), 2002);

// SIP: ₹50L target, 10 years, 12% → ₹21,740/month
assert("SIP ₹50L / 10yr / 12%", calculateSIPMonthly(5_000_000, 10, 0.12), 21740);

// FD: ₹10L target, 10 years, 7% → ₹5,778/month
assert("FD ₹10L / 10yr / 7%", calculateFDMonthly(1_000_000, 10, 0.07), 5778);

// PPF: ₹10L target, 15 years, 7.1% → ₹3,478/month
assert("PPF ₹10L / 15yr / 7.1%", calculatePPFAnnual(1_000_000, 15), 3478);

// Projection: SIP ₹2,002/month × 15yr → should reach ~₹10L
const projection = projectSIPGrowth(2002, 15, 0.12);
const finalValue = projection[14].value;
assert("SIP projection final value at year 15", finalValue, 1_000_000, 5000);

console.log("─── All tests complete ───");
