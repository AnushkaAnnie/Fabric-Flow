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

function validateFabricInput(body) {
  const { particulars, total_weight, rate_per_unit, date } = body;
  if (!particulars || total_weight == null || rate_per_unit == null || !date) {
    return { error: 'Particulars, total weight, rate, and date are required.' };
  }

  const weight = Number(total_weight);
  const rate = Number(rate_per_unit);
  if (!Number.isFinite(weight) || weight <= 0 || !Number.isFinite(rate) || rate <= 0) {
    return { error: 'Total weight and rate must be valid positive numbers.' };
  }

  return { weight, rate };
}

async function withSupplierAndGst(record) {
  const supplier = record.supplier_name_id
    ? await prisma.millName.findUnique({ where: { id: record.supplier_name_id } }).catch(() => null)
    : null;
  return { ...record, supplierName: supplier, ...calculateGst(record.amount) };
}

// POST /api/inhouse-fabric
router.post('/', async (req, res, next) => {
  try {
    const { supplier_name_id, fabric_code, purchase_order_no, invoice_no, particulars, total_weight, rate_per_unit, date } = req.body;
    const validation = validateFabricInput(req.body);
    if (validation.error) return res.status(400).json({ message: validation.error });

    const latest = await prisma.inhouseKnittedFabric.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true, fabric_code: true, purchase_order_no: true },
    });

    const amount = validation.weight * validation.rate;
    const gst = calculateGst(amount);

    const record = await prisma.inhouseKnittedFabric.create({
      data: {
        fabric_code: fabric_code?.trim() || nextCode('KF', latest?.fabric_code, (latest?.id || 0) + 1),
        purchase_order_no: purchase_order_no?.trim() || nextCode('PO-F', latest?.purchase_order_no, (latest?.id || 0) + 1),
        invoice_no: invoice_no || '',
        supplier_name_id: supplier_name_id ? Number(supplier_name_id) : null,
        particulars,
        total_weight: validation.weight,
        rate_per_unit: validation.rate,
        amount,
        date: new Date(date),
      },
    });

    res.status(201).json({ ...record, ...gst });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ message: 'Fabric code must be unique. This fabric code is already in use.' });
    }
    next(err);
  }
});

// GET /api/inhouse-fabric/list
router.get('/list', async (req, res, next) => {
  try {
    const records = await prisma.inhouseKnittedFabric.findMany({
      orderBy: { created_at: 'desc' },
    });
    res.json(await Promise.all(records.map(withSupplierAndGst)));
  } catch (err) {
    next(err);
  }
});

// PUT /api/inhouse-fabric/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { supplier_name_id, fabric_code, purchase_order_no, invoice_no, particulars, date } = req.body;
    const validation = validateFabricInput(req.body);
    if (validation.error) return res.status(400).json({ message: validation.error });

    const amount = validation.weight * validation.rate;
    const id = Number(req.params.id);
    const oldRecord = await prisma.inhouseKnittedFabric.findUnique({ where: { id } });
    if (!oldRecord) return res.status(404).json({ message: 'Fabric purchase not found.' });

    const nextFabricCode = fabric_code?.trim() || oldRecord.fabric_code;
    const record = await prisma.$transaction(async (tx) => {
      const updated = await tx.inhouseKnittedFabric.update({
        where: { id },
        data: {
          fabric_code: nextFabricCode,
          purchase_order_no: purchase_order_no?.trim() || oldRecord.purchase_order_no,
          invoice_no: invoice_no || '',
          supplier_name_id: supplier_name_id ? Number(supplier_name_id) : null,
          particulars,
          total_weight: validation.weight,
          rate_per_unit: validation.rate,
          amount,
          date: new Date(date),
        },
      });

      if (nextFabricCode !== oldRecord.fabric_code) {
        await tx.dyeing.updateMany({
          where: { source_type: 'INHOUSE_FABRIC', fabric_code: oldRecord.fabric_code },
          data: { fabric_code: nextFabricCode, hf_code: nextFabricCode },
        });
      }

      return updated;
    });

    res.json(await withSupplierAndGst(record));
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ message: 'Fabric code must be unique. This fabric code is already in use.' });
    }
    next(err);
  }
});

// DELETE /api/inhouse-fabric/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.inhouseKnittedFabric.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Fabric purchase deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
