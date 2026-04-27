const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const { calculateGst } = require('../utils/gst');

const router = express.Router();
router.use(auth);

function nextCode(prefix, lastValue, fallbackNumber) {
  const match = lastValue?.match(new RegExp(`^${prefix}(\\d+)$`));
  const nextNumber = match ? Number(match[1]) + 1 : fallbackNumber;
  return `${prefix}${nextNumber}`;
}

// POST /api/inhouse-fabric
router.post('/', async (req, res, next) => {
  try {
    const { supplier_name_id, particulars, total_weight, rate_per_unit, date } = req.body;

    if (!particulars || total_weight == null || rate_per_unit == null || !date) {
      return res.status(400).json({ message: 'Particulars, total weight, rate, and date are required.' });
    }

    const weight = Number(total_weight);
    const rate = Number(rate_per_unit);
    if (!Number.isFinite(weight) || weight <= 0 || !Number.isFinite(rate) || rate <= 0) {
      return res.status(400).json({ message: 'Total weight and rate must be valid positive numbers.' });
    }

    const latest = await prisma.inhouseKnittedFabric.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true, fabric_code: true, purchase_order_no: true },
    });

    const amount = weight * rate;
    const gst = calculateGst(amount);

    const record = await prisma.inhouseKnittedFabric.create({
      data: {
        fabric_code: nextCode('KF', latest?.fabric_code, (latest?.id || 0) + 1),
        purchase_order_no: nextCode('PO-F', latest?.purchase_order_no, (latest?.id || 0) + 1),
        supplier_name_id: supplier_name_id ? Number(supplier_name_id) : null,
        particulars,
        total_weight: weight,
        rate_per_unit: rate,
        amount,
        date: new Date(date),
      },
    });

    res.status(201).json({ ...record, ...gst });
  } catch (err) {
    next(err);
  }
});

// GET /api/inhouse-fabric/list
router.get('/list', async (req, res, next) => {
  try {
    const records = await prisma.inhouseKnittedFabric.findMany({
      orderBy: { created_at: 'desc' },
    });
    res.json(records.map(record => ({ ...record, ...calculateGst(record.amount) })));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
