export interface VehicleTaxInput {
  category: string; // 'EV', 'ICE_Hatchback', 'ICE_SUV', 'ICE_Sedan', etc.
  engineCc: number; // 0 for EV
  basePriceNPR: number; // Ex-showroom price
}

export interface TaxBreakdown {
  basePrice: number;
  customsDuty: number;
  exciseDuty: number;
  vat: number;
  roadTax: number;
  totalOnRoadPrice: number;
}

/**
 * Calculates the on-road price for a vehicle in Nepal based on 2081/82 tax brackets.
 * 
 * NOTE: These are approximate placeholder brackets for Phase 1.
 * The actual values can be updated in the database or adjusted here.
 */
export function calculateNepalOnRoadPrice(input: VehicleTaxInput): TaxBreakdown {
  let customsDutyPercent = 0;
  let exciseDutyPercent = 0;
  const vatPercent = 13; // VAT is standard 13%
  const roadTax = 35000; // Flat road tax estimate (varies by province and CC)

  // Example placeholder logic for 2081/82 based on Engine CC and category
  if (input.category === 'EV') {
    // EVs have much lower tax brackets
    if (input.engineCc <= 50) { // Using kW for EV engineCc field
      customsDutyPercent = 10;
      exciseDutyPercent = 0;
    } else if (input.engineCc <= 100) {
      customsDutyPercent = 15;
      exciseDutyPercent = 10;
    } else {
      customsDutyPercent = 20;
      exciseDutyPercent = 20;
    }
  } else {
    // ICE Vehicles (Internal Combustion Engine)
    if (input.engineCc <= 1000) {
      customsDutyPercent = 40;
      exciseDutyPercent = 60;
    } else if (input.engineCc <= 1500) {
      customsDutyPercent = 80;
      exciseDutyPercent = 70;
    } else {
      customsDutyPercent = 80;
      exciseDutyPercent = 100;
    }
  }

  // Calculation
  const customsDuty = input.basePriceNPR * (customsDutyPercent / 100);
  
  // Excise duty is calculated on (Base Price + Customs Duty)
  const valueForExcise = input.basePriceNPR + customsDuty;
  const exciseDuty = valueForExcise * (exciseDutyPercent / 100);
  
  // VAT is calculated on (Base Price + Customs Duty + Excise Duty)
  const valueForVat = valueForExcise + exciseDuty;
  const vat = valueForVat * (vatPercent / 100);

  const totalOnRoadPrice = input.basePriceNPR + customsDuty + exciseDuty + vat + roadTax;

  return {
    basePrice: input.basePriceNPR,
    customsDuty,
    exciseDuty,
    vat,
    roadTax,
    totalOnRoadPrice,
  };
}
