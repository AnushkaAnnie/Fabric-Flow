function calculateGst(amount) {
  const value = Number(amount) || 0;
  const cgst = value * 0.025;
  const sgst = value * 0.025;
  return {
    cgst,
    sgst,
    grand_total: value + cgst + sgst,
  };
}

module.exports = { calculateGst };
