const fs = require('fs');
const path = require('path');

const FACTORS_PATH = path.join(__dirname, '..', '..', 'emissionFactors.json');

function loadFactors() {
  return JSON.parse(fs.readFileSync(FACTORS_PATH, 'utf8'));
}

/**
 * @param {{ electricityKwh: number, dieselLiters: number }} totals
 */
function calculateFootprint(totals) {
  const factors = loadFactors();

  const scope2KgCo2e = totals.electricityKwh * factors.electricity_kwh_kgco2e; // purchased electricity
  const scope1KgCo2e = totals.dieselLiters * factors.diesel_liter_kgco2e; // on-site fuel combustion
  const totalKgCo2e = scope1KgCo2e + scope2KgCo2e;

  return {
    scope1_kgco2e: Number(scope1KgCo2e.toFixed(2)),
    scope2_kgco2e: Number(scope2KgCo2e.toFixed(2)),
    total_tco2e: Number((totalKgCo2e / 1000).toFixed(2)),
    calculationVersion: factors.version,
  };
}

module.exports = { calculateFootprint, loadFactors };
