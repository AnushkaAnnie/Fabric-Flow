const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

const INCLUDE = {
  dyerName: true,
  washType: true,
  colour: true,
  compacter: true,
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

// POST /api/dyeing/program — NEW: dyeing from grey fabric lot
router.post('/program', async (req, res, next) => {
  try {
    const {
      greyFabricLotId,
      dyerId,
      lot_no,
      colour_id,
      output_weight,
      gauge,
      loop_length,
      knitterDcNo,
      companyDcNo,
      compacterId,
    } = req.body;

    if (!greyFabricLotId || !dyerId || !lot_no || !colour_id || output_weight == null) {
      return res.status(400).json({
        message: 'Missing required fields: grey lot, dyer, lot_no, colour, output_weight',
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const lot = await tx.greyFabricLot.findUnique({
        where: { id: parseInt(greyFabricLotId) },
        include: { knitterProgram: true },
      });

      if (!lot || lot.status !== 'AVAILABLE') {
        throw new Error('Grey fabric lot is not available');
      }

      await tx.greyFabricLot.update({
        where: { id: lot.id },
        data: { status: 'CONSUMED' },
      });

      const dyeing = await tx.dyeing.create({
        data: {
          lot_no,
          colour_id: parseInt(colour_id),
          dyer_name_id: parseInt(dyerId),
          initial_weight: parseFloat(lot.grey_weight),
          final_weight: parseFloat(output_weight),
          gg: gauge ? parseFloat(gauge) : 0,
          no_of_rolls: lot.knitterProgram?.number_of_rolls || 0,
          knitterDcNo,
          companyDcNo,
          compacterId: compacterId ? parseInt(compacterId) : null,
          greyFabricLotId: lot.id,
          process_loss: lot.grey_weight > 0
            ? ((parseFloat(lot.grey_weight) - parseFloat(output_weight)) / parseFloat(lot.grey_weight)) * 100
            : 0,
          date: new Date(),
          source_type: 'GREY_FABRIC',
        },
        include: {
          dyerName: true,
          colour: true,
          greyFabricLot: true,
          compacter: true,
        },
      });

      return dyeing;
    });

    res.status(201).json({ message: 'Dyeing program created', dyeing: result });
  } catch (err) {
    next(err);
  }
});

// PUT /api/dyeing/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { initial_weight, knitterDcNo, companyDcNo, compacterId, dateGiven } = req.body;

    const updateData = {};
    if (initial_weight !== undefined) updateData.initial_weight = parseFloat(initial_weight);
    if (knitterDcNo !== undefined) updateData.knitterDcNo = knitterDcNo;
    if (companyDcNo !== undefined) updateData.companyDcNo = companyDcNo;
    if (compacterId !== undefined) updateData.compacterId = parseInt(compacterId) || null;
    if (dateGiven !== undefined) updateData.dateGiven = dateGiven ? new Date(dateGiven) : null;

    const updated = await prisma.dyeing.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        dyerName: true,
        colour: true,
        compacter: true,
        greyFabricLot: true,
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/dyeing/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Fetch dyeing record first to see if it's tied to a grey fabric lot
    const dyeing = await prisma.dyeing.findUnique({
      where: { id: parseInt(id) },
    });

    if (dyeing && dyeing.greyFabricLotId) {
      // Revert the grey fabric lot to AVAILABLE
      await prisma.greyFabricLot.update({
        where: { id: dyeing.greyFabricLotId },
        data: { status: 'AVAILABLE' },
      });
    }

    await prisma.dyeing.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Dyeing record deleted and grey fabric reverted' });
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
