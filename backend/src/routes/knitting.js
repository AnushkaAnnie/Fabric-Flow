const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

const INCLUDE = {
  knitterName: true,
  fabricDescription: true,
};

// GET /api/knitting
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = search
      ? {
          OR: [
            { hf_code: { contains: search } },
          ],
        }
      : {};

    const [records, total] = await Promise.all([
      prisma.knitting.findMany({
        where,
        include: INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.knitting.count({ where }),
    ]);

    res.json({ data: records, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});

// GET /api/knitting/:id
router.get('/:id', async (req, res, next) => {
  try {
    const record = await prisma.knitting.findUnique({
      where: { id: Number(req.params.id) },
      include: { ...INCLUDE, dyeings: true, compactings: true },
    });
    if (!record) return res.status(404).json({ message: 'Knitting record not found.' });
    res.json(record);
  } catch (err) {
    next(err);
  }
});

// POST /api/knitting
router.post('/', async (req, res, next) => {
  try {
    const {
      hf_code, knitter_name_id, yarn_quantity,
      loop_length, dia, count, gauge, date_given,
      fabric_description_id, grey_fabric_weight,
      other_yarn_type, other_yarn_percentage,
      gsm, no_of_rolls, date,
    } = req.body;

    // Verify HK No exists
    // Verify HF Code exists
    const yarn = await prisma.yarn.findUnique({ where: { hf_code } });
    if (!yarn) return res.status(400).json({ message: `HF Code "${hf_code}" not found.` });

    const record = await prisma.knitting.create({
      data: {
        hf_code,
        knitter_name_id: Number(knitter_name_id),
        yarn_quantity: Number(yarn_quantity),
        loop_length: Number(loop_length),
        dia: Number(dia),
        count,
        gauge,
        date_given: new Date(date_given),
        fabric_description_id: Number(fabric_description_id),
        grey_fabric_weight: Number(grey_fabric_weight),
        other_yarn_type,
        other_yarn_percentage: other_yarn_percentage ? Number(other_yarn_percentage) : null,
        gsm: Number(gsm),
        no_of_rolls: Number(no_of_rolls),
        date: new Date(date),
      },
      include: INCLUDE,
    });

    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
});

// PUT /api/knitting/:id
router.put('/:id', async (req, res, next) => {
  try {
    const {
      hf_code, knitter_name_id, yarn_quantity,
      loop_length, dia, count, gauge, date_given,
      fabric_description_id, grey_fabric_weight,
      other_yarn_type, other_yarn_percentage,
      gsm, no_of_rolls, date,
    } = req.body;

    const record = await prisma.knitting.update({
      where: { id: Number(req.params.id) },
      data: {
        hf_code,
        knitter_name_id: Number(knitter_name_id),
        yarn_quantity: Number(yarn_quantity),
        loop_length: Number(loop_length),
        dia: Number(dia),
        count,
        gauge,
        date_given: new Date(date_given),
        fabric_description_id: Number(fabric_description_id),
        grey_fabric_weight: Number(grey_fabric_weight),
        other_yarn_type,
        other_yarn_percentage: other_yarn_percentage ? Number(other_yarn_percentage) : null,
        gsm: Number(gsm),
        no_of_rolls: Number(no_of_rolls),
        date: new Date(date),
      },
      include: INCLUDE,
    });

    res.json(record);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/knitting/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.knitting.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Knitting record deleted.' });
  } catch (err) {
    next(err);
  }
});

// GET /api/knitting/list/hf-codes — for dropdowns
router.get('/list/hf-codes', async (req, res, next) => {
  try {
    const records = await prisma.knitting.findMany({
      select: { id: true, hf_code: true, grey_fabric_weight: true },
      orderBy: { hf_code: 'asc' },
    });
    res.json(records);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
