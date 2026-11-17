// Safety checks so a broken police export never silently replaces good data.

/** @returns {string[]} list of problems (empty = OK) */
export function validate(meta, previous) {
  const problems = [];
  for (const y of meta.years) {
    if (y.accidents === 0) problems.push(`${y.year}: no accidents parsed`);
    if (y.complete && y.accidents < 50000) problems.push(`${y.year}: complete year has only ${y.accidents} accidents (expected 80k+)`);
    if (y.skipped > y.accidents * 0.05) problems.push(`${y.year}: ${y.skipped} rows skipped (bad date/region) – format change?`);
  }
  if (previous) {
    for (const old of previous.years ?? []) {
      const now = meta.years.find((y) => y.year === old.year);
      if (!now) {
        problems.push(`${old.year}: year disappeared from source`);
        continue;
      }
      if (now.accidents < old.accidents * 0.9) problems.push(`${old.year}: accidents dropped ${old.accidents} -> ${now.accidents}`);
      if (now.lastDate < old.lastDate) problems.push(`${old.year}: last date went backwards ${old.lastDate} -> ${now.lastDate}`);
    }
  }
  return problems;
}
