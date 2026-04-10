const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

const INCLUDE = {
  compacterName: true,
  colour: true,
};

// GET /api/compacting
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = search ? { 
      OR: [
        { lot_no: { contains: search } },
        { hf_code: { contains: search } }
      ]
    } : {};

    const [records, total] = await Promise.all([
      prisma.compacting.findMany({
        where,
        include: INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.compacting.count({ where }),
    ]);

    res.json({ data: records, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});

// GET /api/compacting/:id
router.get('/:id', async (req, res, next) => {
  try {
    const record = await prisma.compacting.findUnique({
      where: { id: Number(req.params.id) },
      include: INCLUDE,
    });
    if (!record) return res.status(404).json({ message: 'Compacting record not found.' });
    res.json(record);
  } catch (err) {
    next(err);
  }
});

// POST /api/compacting
router.post('/', async (req, res, next) => {
  try {
    const {
      hf_code, lot_no, initial_weight, compacter_name_id,
      final_dia, colour_id, final_weight, final_gsm, date,
    } = req.body;

    // Verify lot_no exists in Dyeing
    const dyeing = await prisma.dyeing.findUnique({ where: { lot_no } });
    if (!dyeing) return res.status(400).json({ message: `Lot No "${lot_no}" not found in Dyeing.` });

    // Check if already compacted
    const existing = await prisma.compacting.findUnique({ where: { lot_no } });
    if (existing) return res.status(409).json({ message: `Lot No "${lot_no}" is already compacted.` });

    // Auto-calculate process_loss based on Dyeing initial_weight
    const grey_fabric_weight = dyeing.initial_weight;
    const fw = Number(final_weight);
    const process_loss = grey_fabric_weight > 0
      ? ((grey_fabric_weight - fw) / grey_fabric_weight) * 100
      : 0;

    const record = await prisma.compacting.create({
      data: {
        hf_code,
        lot_no,
        initial_weight: Number(initial_weight),
        compacter_name_id: Number(compacter_name_id),
        final_dia: Number(final_dia),
        colour_id: Number(colour_id),
        final_weight: fw,
        final_gsm: Number(final_gsm),
        process_loss,
        date: new Date(date),
      },
      include: INCLUDE,
    });

    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
});

// PUT /api/compacting/:id
router.put('/:id', async (req, res, next) => {
  try {
    const {
      hf_code, initial_weight, compacter_name_id, final_dia,
      colour_id, final_weight, final_gsm, date,
    } = req.body;

    // Recalculate process_loss
    const existing = await prisma.compacting.findUnique({
      where: { id: Number(req.params.id) },
    });
    const dyeing = await prisma.dyeing.findUnique({ where: { lot_no: existing.lot_no } });

    const grey_fabric_weight = dyeing ? dyeing.initial_weight : Number(initial_weight);
    const fw = Number(final_weight);
    const process_loss = grey_fabric_weight > 0
      ? ((grey_fabric_weight - fw) / grey_fabric_weight) * 100
      : 0;

    const record = await prisma.compacting.update({
      where: { id: Number(req.params.id) },
      data: {
        hf_code,
        initial_weight: Number(initial_weight),
        compacter_name_id: Number(compacter_name_id),
        final_dia: Number(final_dia),
        colour_id: Number(colour_id),
        final_weight: fw,
        final_gsm: Number(final_gsm),
        process_loss,
        date: new Date(date),
      },
      include: INCLUDE,
    });

    res.json(record);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/compacting/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.compacting.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Compacting record deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
