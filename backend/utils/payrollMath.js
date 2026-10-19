import { roundUgx } from './money.js';

// Resident PAYE bands published by the Uganda Revenue Authority.
const payeUgx = (chargeable) => {
  const income = Math.max(0, roundUgx(chargeable));
  if (income <= 235000) return 0;
  if (income <= 335000) return roundUgx((income - 235000) * 0.1);
  if (income <= 410000) return roundUgx(10000 + (income - 335000) * 0.2);
  if (income <= 10000000) return roundUgx(25000 + (income - 410000) * 0.3);
  return roundUgx(2902000 + (income - 10000000) * 0.4);
};

const nssfParts = (grossUgx) => {
  const gross = roundUgx(grossUgx);
  return {
    employeeUgx: roundUgx(gross * 0.05),
    employerUgx: roundUgx(gross * 0.1)
  };
};

const netPayUgx = (grossUgx) => {
  const nssf = nssfParts(grossUgx);
  const paye = payeUgx(roundUgx(grossUgx) - nssf.employeeUgx);
  return {
    ...nssf,
    payeUgx: paye,
    netUgx: roundUgx(roundUgx(grossUgx) - nssf.employeeUgx - paye)
  };
};

export { netPayUgx, nssfParts, payeUgx };
