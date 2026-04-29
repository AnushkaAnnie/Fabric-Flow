const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

const { Prisma } = require('@prisma/client');

const toDecimal = (value) => new Prisma.Decimal(String(Number(value || 0)));

const PROGRAM_INCLUDE = {
  dyerName: true,
  washType: true,
  colour: true,
  greyFabricLot: {
    include: {
      knitterProgram: {
        include: {
          knitterName: true,
          yarn: { include: { millName: true } },
        },
      },
    },
  },
};

router.post('/program', async (req, res, next) => {
  try {
    const {
      greyFabricLotId,
      dyerId,
      dyer_name_id,
      lot_no,
      colour,
      colour_id,
      gauge,
      loop_length,
      output_weight,
    } = req.body;

    const greyFabricLotIdNum = Number(greyFabricLotId);
    const dyerIdNum = Number(dyerId || dyer_name_id);
    const colourIdNum = Number(colour_id || colour);
    const loopLength = loop_length === '' || loop_length == null ? null : Number(loop_length);
    const outputWeight = output_weight == null || output_weight === '' ? 0 : Number(output_weight);

    if (!greyFabricLotIdNum || !dyerIdNum || !colourIdNum || !lot_no) {
      return res.status(400).json({ message: 'greyFabricLotId, dyerId, lot_no, and colour are required.' });
    }

    const record = await prisma.$transaction(async (tx) => {
      const greyFabricLot = await tx.greyFabricLot.findUnique({
        where: { id: greyFabricLotIdNum },
        include: {
          knitterProgram: {
            include: {
              knitterName: true,
              yarn: { include: { millName: true } },
            },
          },
        },
      });

      if (!greyFabricLot) {
        throw Object.assign(new Error('Grey fabric lot not found.'), { statusCode: 404 });
      }

      if (greyFabricLot.status !== 'AVAILABLE') {
        throw Object.assign(new Error('Grey fabric lot has already been consumed.'), { statusCode: 409 });
      }

      const existingLot = await tx.dyeing.findUnique({ where: { lot_no } });
      if (existingLot) {
        throw Object.assign(new Error(`Lot No "${lot_no}" is already used.`), { statusCode: 409 });
      }

      const washType = await tx.washType.findFirst({ orderBy: { id: 'asc' } });
      if (!washType) {
        throw Object.assign(new Error('At least one wash type is required before creating a dyeing record.'), { statusCode: 400 });
      }

      const updatedLot = await tx.greyFabricLot.updateMany({
        where: { id: greyFabricLotIdNum, status: 'AVAILABLE' },
        data: { status: 'CONSUMED' },
      });

      if (updatedLot.count === 0) {
        throw Object.assign(new Error('Grey fabric lot has already been consumed.'), { statusCode: 409 });
      }

      const initialWeight = Number(greyFabricLot.grey_weight || 0);
      const finalWeight = outputWeight || 0;
      const processLoss = initialWeight > 0 ? ((initialWeight - finalWeight) / initialWeight) * 100 : 0;

      const dyeing = await tx.dyeing.create({
        data: {
          dyeingId: undefined,
          hf_code: greyFabricLot.knitterProgram?.yarn?.hf_code || '',
          source_type: 'GREY_FABRIC',
          fabric_code: null,
          count: greyFabricLot.knitterProgram?.yarn?.count || '',
          lot_no,
          initial_weight: initialWeight,
          output_weight: finalWeight,
          dyer_name_id: dyerIdNum,
          wash_type_id: washType.id,
          colour_id: colourIdNum,
          gg: Number(gauge || 0),
          gauge: gauge || null,
          loop_length: loopLength == null ? null : loopLength,
          initial_dia: 0,
          final_dia: 0,
          no_of_rolls: greyFabricLot.knitterProgram?.number_of_rolls || 0,
          final_weight: finalWeight,
          process_loss: processLoss,
          grey_fabric_lot_id: greyFabricLot.id,
          date: new Date(),
        },
        include: PROGRAM_INCLUDE,
      });

      return dyeing;
    });

    res.status(201).json({
      ...record,
      initial_weight: Number(record.initial_weight),
      output_weight: record.output_weight == null ? null : Number(record.output_weight),
      final_weight: Number(record.final_weight),
      gg: Number(record.gg),
      loop_length: record.loop_length == null ? null : Number(record.loop_length),
    });
  } catch (err) {
    if (err?.statusCode) return res.status(err.statusCode).json({ message: err.message });
    next(err);
  }
});

const INCLUDE = {
  dyerName: true,
  washType: true,
  colour: true,
};

// GET /api/dyeing
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
      prisma.dyeing.findMany({
        where,
        include: INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.dyeing.count({ where }),
    ]);

    res.json({ data: records, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});

// GET /api/dyeing/:id
router.get('/:id', async (req, res, next) => {
  try {
    const record = await prisma.dyeing.findUnique({
      where: { id: Number(req.params.id) },
      include: INCLUDE,
    });
    if (!record) return res.status(404).json({ message: 'Dyeing record not found.' });
    res.json(record);
  } catch (err) {
    next(err);
  }
});

// POST /api/dyeing
router.post('/', async (req, res, next) => {
  try {
    const {
      hf_code, source_type, fabric_code, count, lot_no, initial_weight, dyer_name_id, wash_type_id, colour_id,
      gg, initial_dia, final_dia,
      no_of_rolls, final_weight, date,
    } = req.body;

    const sourceType = source_type || 'KNITTING';
    let resolvedInitialWeight = Number(initial_weight);
    let resolvedHfCode = hf_code;

    if (sourceType === 'INHOUSE_FABRIC') {
      if (!fabric_code) return res.status(400).json({ message: 'Fabric code is required for fabric purchase dyeing.' });
      const fabric = await prisma.inhouseKnittedFabric.findUnique({ where: { fabric_code } });
      if (!fabric) return res.status(404).json({ message: `Fabric Code "${fabric_code}" not found.` });
      resolvedInitialWeight = fabric.total_weight;
      resolvedHfCode = hf_code || fabric.fabric_code;
    }

    // Calculate process loss based on ((initial_weight - final_weight) / initial_weight) * 100
    const iw = resolvedInitialWeight;
    const fw = Number(final_weight);
    const process_loss = iw > 0 ? ((iw - fw) / iw) * 100 : 0;

    // Check if already dyed
    const existing = await prisma.dyeing.findUnique({ where: { lot_no } });
    if (existing) return res.status(409).json({ message: `Lot No "${lot_no}" is already dyed.` });

    const record = await prisma.dyeing.create({
      data: {
        hf_code: resolvedHfCode,
        source_type: sourceType,
        fabric_code: sourceType === 'INHOUSE_FABRIC' ? fabric_code : null,
        count,
        lot_no,
        initial_weight: resolvedInitialWeight,
        dyer_name_id: Number(dyer_name_id),
        wash_type_id: Number(wash_type_id),
        colour_id: Number(colour_id),
        gg: Number(gg),
        initial_dia: Number(initial_dia),
        final_dia: Number(final_dia),
        no_of_rolls: Number(no_of_rolls),
        final_weight: Number(final_weight),
        process_loss: process_loss,
        date: new Date(date),
      },
      include: INCLUDE,
    });

    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
});

// PUT /api/dyeing/:id
router.put('/:id', async (req, res, next) => {
  try {
    const {
      hf_code, source_type, fabric_code, count, initial_weight, dyer_name_id, wash_type_id, colour_id,
      gg, initial_dia, final_dia,
      no_of_rolls, final_weight, date,
    } = req.body;

    const sourceType = source_type || 'KNITTING';
    let resolvedInitialWeight = Number(initial_weight);
    let resolvedHfCode = hf_code;

    if (sourceType === 'INHOUSE_FABRIC') {
      if (!fabric_code) return res.status(400).json({ message: 'Fabric code is required for fabric purchase dyeing.' });
      const fabric = await prisma.inhouseKnittedFabric.findUnique({ where: { fabric_code } });
      if (!fabric) return res.status(404).json({ message: `Fabric Code "${fabric_code}" not found.` });
      resolvedInitialWeight = fabric.total_weight;
      resolvedHfCode = hf_code || fabric.fabric_code;
    }

    // Calculate process loss
    const iw = resolvedInitialWeight;
    const fw = Number(final_weight);
    const process_loss = iw > 0 ? ((iw - fw) / iw) * 100 : 0;

    const record = await prisma.dyeing.update({
      where: { id: Number(req.params.id) },
      data: {
        hf_code: resolvedHfCode,
        source_type: sourceType,
        fabric_code: sourceType === 'INHOUSE_FABRIC' ? fabric_code : null,
        count,
        initial_weight: resolvedInitialWeight,
        dyer_name_id: Number(dyer_name_id),
        wash_type_id: Number(wash_type_id),
        colour_id: Number(colour_id),
        gg: Number(gg),
        initial_dia: Number(initial_dia),
        final_dia: Number(final_dia),
        no_of_rolls: Number(no_of_rolls),
        final_weight: Number(final_weight),
        process_loss: process_loss,
        date: new Date(date),
      },
      include: INCLUDE,
    });

    res.json(record);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/dyeing/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.dyeing.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Dyeing record deleted.' });
  } catch (err) {
    next(err);
  }
});

// GET /api/dyeing/list/lot-nos — for dropdowns
router.get('/list/lot-nos', async (req, res, next) => {
  try {
    const records = await prisma.dyeing.findMany({
      select: { id: true, lot_no: true, hf_code: true },
      orderBy: { lot_no: 'asc' },
    });
    res.json(records);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
