const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

const INCLUDE = {
  knitterName: true,
  fabricDescription: true,
  yarnUsages: { include: { yarn: { include: { millName: true } } } },
  lots: {
    include: {
      dyerName: true,
      entries: { include: { colour: true } },
    },
  },
  greyFabric: true,
};

// GET /api/knitting
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = search
      ? { OR: [{ hf_code: { contains: search } }] }
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

// GET /api/knitting/:id  — IMPORTANT: kept AFTER all named routes to avoid shadowing
// (moved below — see end of named routes section)

// ─────────────────────────────────────────────────────
// Helper: Recalculate knitter yarn balance
// ─────────────────────────────────────────────────────
async function recalculateKnitterBalance(knitter_id) {
  const knittings = await prisma.knitting.findMany({
    where: { knitter_name_id: Number(knitter_id) }
  });
  let balance = 0;
  for (const k of knittings) {
    balance += Number(k.total_yarn_qty || 0);
    balance -= Number(k.received_weight || 0);
  }
  await prisma.knitterName.update({
    where: { id: Number(knitter_id) },
    data: { yarn_balance: balance }
  });
}

// ─────────────────────────────────────────────────────
// Helper: upsert dyeing records from knitting lots
// ─────────────────────────────────────────────────────
async function syncDyeingFromLots(knittingId, lots, knitting) {
  const incomingLotNos = lots.map(l => l.lot_no);
  const fallbackRolls = Number(knitting.no_of_rolls || 0);

  // ── 1. Delete lots that were removed from the form ──────────────────────
  const existingLots = await prisma.knittingLot.findMany({
    where: { knitting_id: knittingId },
    include: { entries: true },
  });

  for (const existingLot of existingLots) {
    if (!incomingLotNos.includes(existingLot.lot_no)) {
      // Delete linked dyeing records and entries
      for (const entry of existingLot.entries) {
        if (entry.dyeing_id) {
          await prisma.dyeing.delete({ where: { id: entry.dyeing_id } }).catch(() => {});
        }
        await prisma.knittingLotEntry.delete({ where: { id: entry.id } });
      }
      await prisma.knittingLot.delete({ where: { id: existingLot.id } });
    }
  }

  // ── 2. Upsert incoming lots ──────────────────────────────────────────────
  for (const lot of lots) {
    // Ensure lot exists
    let knittingLot = await prisma.knittingLot.findUnique({ where: { lot_no: lot.lot_no } });

    if (!knittingLot) {
      knittingLot = await prisma.knittingLot.create({
        data: {
          knitting_id: knittingId,
          lot_no: lot.lot_no,
          job_work_no: lot.job_work_no || '',
          no_of_rolls: Number(lot.no_of_rolls ?? fallbackRolls) || 0,
          dyer_name_id: Number(lot.dyer_name_id),
        },
      });
    } else {
      await prisma.knittingLot.update({
        where: { id: knittingLot.id },
        data: {
          dyer_name_id: Number(lot.dyer_name_id),
          job_work_no: lot.job_work_no || '',
          no_of_rolls: Number(lot.no_of_rolls ?? fallbackRolls) || 0,
        },
      });
    }

    // Remove old entries for this lot that are no longer present
    const incomingColourIds = (lot.entries || []).map(e => Number(e.colour_id));
    const existingEntries = await prisma.knittingLotEntry.findMany({
      where: { knitting_lot_id: knittingLot.id },
    });

    for (const oldEntry of existingEntries) {
      if (!incomingColourIds.includes(oldEntry.colour_id)) {
        // Remove associated dyeing if any
        if (oldEntry.dyeing_id) {
          await prisma.dyeing.delete({ where: { id: oldEntry.dyeing_id } }).catch(() => {});
        }
        await prisma.knittingLotEntry.delete({ where: { id: oldEntry.id } });
      }
    }

    // Upsert entries
    for (const entry of (lot.entries || [])) {
      const existingEntry = existingEntries.find(e => e.colour_id === Number(entry.colour_id));

      // Default dyeing fields
      const dyeingData = {
        hf_code: knitting.hf_code,
        source_type: 'KNITTING',
        fabric_code: null,
        count: knitting.count || '',
        lot_no: lot.lot_no,
        initial_weight: Number(entry.weight),
        dyer_name_id: Number(lot.dyer_name_id),
        wash_type_id: 1, // default; user updates in Dyeing page
        colour_id: Number(entry.colour_id),
        gg: knitting.gauge ? Number(knitting.gauge) || 0 : 0,
        initial_dia: Number(knitting.dia) || 0,
        final_dia: 0,
        no_of_rolls: Number(lot.no_of_rolls ?? fallbackRolls) || 0,
        final_weight: 0,
        process_loss: 0,
        date: new Date(),
      };

      if (existingEntry) {
        // Update weight and dyer on existing entry
        await prisma.knittingLotEntry.update({
          where: { id: existingEntry.id },
          data: { weight: Number(entry.weight), colour_id: Number(entry.colour_id) },
        });
        // Update corresponding dyeing if exists
        if (existingEntry.dyeing_id) {
          await prisma.dyeing.update({
            where: { id: existingEntry.dyeing_id },
            data: {
              initial_weight: Number(entry.weight),
              dyer_name_id: Number(lot.dyer_name_id),
              colour_id: Number(entry.colour_id),
              no_of_rolls: Number(lot.no_of_rolls ?? fallbackRolls) || 0,
            },
          }).catch(() => {});
        }
      } else {
        // Create new entry + dyeing record
        let dyeingRecord = null;
        const existingDyeing = await prisma.dyeing.findUnique({ where: { lot_no: lot.lot_no } }).catch(() => null);
        if (!existingDyeing) {
          dyeingRecord = await prisma.dyeing.create({ data: dyeingData }).catch(() => null);
        } else {
          dyeingRecord = existingDyeing;
        }

        await prisma.knittingLotEntry.create({
          data: {
            knitting_lot_id: knittingLot.id,
            colour_id: Number(entry.colour_id),
            weight: Number(entry.weight),
            dyeing_id: dyeingRecord?.id || null,
          },
        });
      }
    }
  }
}

// ─────────────────────────────────────────────────────
// Helper: validate yarn stock in 2 queries (batched)
// Throws if any HF code has insufficient remaining stock.
// excludeKnittingId: skip usages from the record being edited (PUT)
// ─────────────────────────────────────────────────────
async function validateYarnStock(yarnUsages, excludeKnittingId = null) {
  const yarnIds = [...new Set(yarnUsages.map(u => Number(u.yarn_id)))];

  // 1. Fetch all yarn totals in one query
  const yarns = await prisma.yarn.findMany({
    where: { id: { in: yarnIds } },
    select: { id: true, hf_code: true, total_weight: true },
  });

  // 2. Fetch all usage sums in one groupBy query
  const usageGroups = await prisma.knittingYarnUsage.groupBy({
    by: ['yarn_id'],
    _sum: { quantity: true },
    where: {
      yarn_id: { in: yarnIds },
      ...(excludeKnittingId ? { knitting_id: { not: excludeKnittingId } } : {}),
    },
  });

  const usedMap = new Map(usageGroups.map(g => [g.yarn_id, g._sum.quantity || 0]));

  const errors = [];
  for (const usage of yarnUsages) {
    const yarn = yarns.find(y => y.id === Number(usage.yarn_id));
    if (!yarn) { errors.push(`Yarn ID ${usage.yarn_id} not found.`); continue; }
    const alreadyUsed = usedMap.get(yarn.id) || 0;
    const remaining = yarn.total_weight - alreadyUsed;
    if (Number(usage.quantity) > remaining) {
      errors.push(`Insufficient stock for ${yarn.hf_code}: requested ${usage.quantity} kg, available ${remaining.toFixed(2)} kg.`);
    }
  }
  return errors;
}

// POST /api/knitting
router.post('/', async (req, res, next) => {
  try {
    const {
      hf_code, dc_no, knitter_name_id, total_yarn_qty, loop_length, dia, count, gauge, date_given,
      fabric_description_id, grey_fabric_weight, received_weight,
      other_yarn_type, other_yarn_percentage,
      no_of_rolls, date,
      // New: array of { hf_code, yarn_id }
      yarnUsages = [],
      // New: array of { lot_no, dyer_name_id, entries: [{ colour_id, weight }] }
      lots = [],
      // New: grey fabric specs { description, gauge, loopLength, diameter, gsm, quantity }
      greyFabric = null,
    } = req.body;
    const fallbackRolls = Number(no_of_rolls) || 0;

    // yarnUsages must have at least one entry
    if (!yarnUsages.length) {
      return res.status(400).json({ message: 'At least one yarn HF code usage is required.' });
    }

    // Primary hf_code = first entry's hf_code (for backward compat)
    const primaryHfCode = hf_code || yarnUsages[0]?.hf_code || '';

    // Validate stock in 2 batched queries
    const stockErrors = await validateYarnStock(yarnUsages);
    if (stockErrors.length) return res.status(400).json({ message: stockErrors.join(' ') });

    // Validate grey fabric quantity if provided
    if (greyFabric && greyFabric.quantity) {
      const totalYarnUsed = yarnUsages.reduce((sum, u) => sum + Number(u.quantity || 0), 0);
      if (Number(greyFabric.quantity) > totalYarnUsed) {
        return res.status(400).json({
          message: `Grey fabric quantity (${greyFabric.quantity} kg) cannot exceed total yarn usage (${totalYarnUsed} kg).`,
        });
      }
    }

    const record = await prisma.knitting.create({
      data: {
        hf_code: primaryHfCode,
        dc_no: dc_no || '',
        knitter_name_id: Number(knitter_name_id),
        total_yarn_qty: Number(total_yarn_qty) || 0,
        loop_length: Number(loop_length),
        dia: Number(dia),
        count,
        gauge,
        date_given: new Date(date_given),
        fabric_description_id: Number(fabric_description_id),
        grey_fabric_weight: Number(grey_fabric_weight),
        received_weight: received_weight !== '' && received_weight != null ? Number(received_weight) : null,
        other_yarn_type,
        other_yarn_percentage: other_yarn_percentage ? Number(other_yarn_percentage) : null,
        no_of_rolls: fallbackRolls,
        date: new Date(date),
      },
      include: INCLUDE,
    });

    // Create all yarn usage records in one query
    await prisma.knittingYarnUsage.createMany({
      data: yarnUsages.map(usage => ({
        knitting_id: record.id,
        yarn_id: Number(usage.yarn_id),
        hf_code: usage.hf_code,
        quantity: Number(usage.quantity) || 0,
      })),
    });

    // Create grey fabric record if provided
    if (greyFabric) {
      await prisma.greyFabric.create({
        data: {
          knittingId: record.id,
          description: greyFabric.description || '',
          gauge: greyFabric.gauge || null,
          loopLength: greyFabric.loopLength ? Number(greyFabric.loopLength) : null,
          diameter: greyFabric.diameter ? Number(greyFabric.diameter) : null,
          gsm: greyFabric.gsm ? Number(greyFabric.gsm) : null,
          quantity: Number(greyFabric.quantity) || 0,
        },
      });
    }

    // Sync dyeing lots
    if (lots.length) {
      await syncDyeingFromLots(record.id, lots, { hf_code: primaryHfCode, count, gauge, dia, no_of_rolls: fallbackRolls });
    }

    await recalculateKnitterBalance(record.knitter_name_id);

    // Return fresh record
    const fresh = await prisma.knitting.findUnique({ where: { id: record.id }, include: INCLUDE });
    res.status(201).json(fresh);
  } catch (err) {
    if (err.code === 'P2002' && (err.meta?.target?.includes('dc_no') || err.message.includes('dc_no'))) {
      return res.status(400).json({ message: 'DC No must be unique. This DC No is already in use.' });
    }
    next(err);
  }
});

// PUT /api/knitting/:id
router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const {
      hf_code, dc_no, knitter_name_id, total_yarn_qty, loop_length, dia, count, gauge, date_given,
      fabric_description_id, grey_fabric_weight, received_weight,
      other_yarn_type, other_yarn_percentage,
      no_of_rolls, date,
      yarnUsages = [],
      lots = [],
      // New: grey fabric specs
      greyFabric = null,
    } = req.body;
    const fallbackRolls = Number(no_of_rolls) || 0;

    if (!yarnUsages.length) {
      return res.status(400).json({ message: 'At least one yarn HF code usage is required.' });
    }

    const primaryHfCode = hf_code || yarnUsages[0]?.hf_code || '';

    // Validate stock in 2 batched queries (exclude this record's own usages)
    const stockErrors = await validateYarnStock(yarnUsages, id);
    if (stockErrors.length) return res.status(400).json({ message: stockErrors.join(' ') });

    // Validate grey fabric quantity if provided
    if (greyFabric && greyFabric.quantity) {
      const totalYarnUsed = yarnUsages.reduce((sum, u) => sum + Number(u.quantity || 0), 0);
      if (Number(greyFabric.quantity) > totalYarnUsed) {
        return res.status(400).json({
          message: `Grey fabric quantity (${greyFabric.quantity} kg) cannot exceed total yarn usage (${totalYarnUsed} kg).`,
        });
      }
    }

    // Fetch old record to see if knitter_name_id changed
    const oldRecord = await prisma.knitting.findUnique({ where: { id } });

    // Delete old yarn usages and recreate in one batch
    await prisma.knittingYarnUsage.deleteMany({ where: { knitting_id: id } });

    await prisma.knitting.update({
      where: { id },
      data: {
        hf_code: primaryHfCode,
        dc_no: dc_no || '',
        knitter_name_id: Number(knitter_name_id),
        total_yarn_qty: Number(total_yarn_qty) || 0,
        loop_length: Number(loop_length),
        dia: Number(dia),
        count,
        gauge,
        date_given: new Date(date_given),
        fabric_description_id: Number(fabric_description_id),
        grey_fabric_weight: Number(grey_fabric_weight),
        received_weight: received_weight !== '' && received_weight != null ? Number(received_weight) : null,
        other_yarn_type,
        other_yarn_percentage: other_yarn_percentage ? Number(other_yarn_percentage) : null,
        no_of_rolls: fallbackRolls,
        date: new Date(date),
      },
    });

    await prisma.knittingYarnUsage.createMany({
      data: yarnUsages.map(usage => ({
        knitting_id: id,
        yarn_id: Number(usage.yarn_id),
        hf_code: usage.hf_code,
        quantity: Number(usage.quantity) || 0,
      })),
    });

    // Update or create grey fabric record
    if (greyFabric) {
      const existing = await prisma.greyFabric.findUnique({ where: { knittingId: id } });
      if (existing) {
        await prisma.greyFabric.update({
          where: { knittingId: id },
          data: {
            description: greyFabric.description || '',
            gauge: greyFabric.gauge || null,
            loopLength: greyFabric.loopLength ? Number(greyFabric.loopLength) : null,
            diameter: greyFabric.diameter ? Number(greyFabric.diameter) : null,
            gsm: greyFabric.gsm ? Number(greyFabric.gsm) : null,
            quantity: Number(greyFabric.quantity) || 0,
          },
        });
      } else {
        await prisma.greyFabric.create({
          data: {
            knittingId: id,
            description: greyFabric.description || '',
            gauge: greyFabric.gauge || null,
            loopLength: greyFabric.loopLength ? Number(greyFabric.loopLength) : null,
            diameter: greyFabric.diameter ? Number(greyFabric.diameter) : null,
            gsm: greyFabric.gsm ? Number(greyFabric.gsm) : null,
            quantity: Number(greyFabric.quantity) || 0,
          },
        });
      }
    }

    // Always sync so removed lots are deleted even when lots=[]
    await syncDyeingFromLots(id, lots, { hf_code: primaryHfCode, count, gauge, dia, no_of_rolls: fallbackRolls });

    await recalculateKnitterBalance(Number(knitter_name_id));
    if (oldRecord && oldRecord.knitter_name_id !== Number(knitter_name_id)) {
      await recalculateKnitterBalance(oldRecord.knitter_name_id);
    }

    const fresh = await prisma.knitting.findUnique({ where: { id }, include: INCLUDE });
    res.json(fresh);
  } catch (err) {
    if (err.code === 'P2002' && (err.meta?.target?.includes('dc_no') || err.message.includes('dc_no'))) {
      return res.status(400).json({ message: 'DC No must be unique. This DC No is already in use.' });
    }
    next(err);
  }
});

// DELETE /api/knitting/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const oldRecord = await prisma.knitting.findUnique({ where: { id: Number(req.params.id) } });
    if (!oldRecord) return res.status(404).json({ message: 'Record not found' });
    
    // Cascade deletes yarnUsages and lots via schema onDelete: Cascade
    await prisma.knitting.delete({ where: { id: Number(req.params.id) } });
    
    await recalculateKnitterBalance(oldRecord.knitter_name_id);
    res.json({ message: 'Knitting record deleted.' });
  } catch (err) {
    next(err);
  }
});

// GET /api/knitting/list/hf-codes
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

// GET /api/knitting/yarn-remaining/:hf_code — remaining stock for a given HF code
router.get('/yarn-remaining/:hf_code', async (req, res, next) => {
  try {
    const { hf_code } = req.params;
    const result = await prisma.$transaction(async (tx) => {
      const yarn = await tx.yarn.findFirst({ where: { hf_code } });
      if (!yarn) return null;
      const usedAgg = await tx.knittingYarnUsage.aggregate({
        _sum: { quantity: true },
        where: { hf_code },
      });
      const used = usedAgg._sum.quantity || 0;
      return {
        hf_code,
        total_weight: yarn.total_weight,
        used,
        remaining: yarn.total_weight - used,
      };
    });
    if (!result) return res.status(404).json({ message: 'Yarn not found.' });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/knitting/grey-fabric — list available grey fabric lots (optional ?knitterId=)
router.get('/grey-fabric', async (req, res, next) => {
  try {
    const { knitterId } = req.query;
    const where = { status: 'AVAILABLE' };
    if (knitterId) {
      where.knitterProgram = { knitterId: parseInt(knitterId, 10) };
    }
    const lots = await prisma.greyFabricLot.findMany({
      where,
      include: {
        knitterProgram: {
          include: { yarn: true, knitterName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(lots);
  } catch (err) {
    next(err);
  }
});

// GET /api/knitting/:id — placed AFTER all named routes so static paths take priority
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid id.' });
    const record = await prisma.knitting.findUnique({
      where: { id },
      include: INCLUDE,
    });
    if (!record) return res.status(404).json({ message: 'Knitting record not found.' });
    res.json(record);
  } catch (err) {
    next(err);
  }
});

// PUT /api/knitting/:id/grey-fabric — Update grey fabric specs
router.put('/:id/grey-fabric', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { description, gauge, loopLength, diameter, gsm, quantity } = req.body;

    // Check if knitting exists
    const knitting = await prisma.knitting.findUnique({
      where: { id },
      include: { yarnUsages: true, greyFabric: true },
    });

    if (!knitting) {
      return res.status(404).json({ message: 'Knitting record not found.' });
    }

    // Validate grey fabric quantity against total yarn usage
    if (quantity) {
      const totalYarnUsed = knitting.yarnUsages.reduce((sum, usage) => sum + Number(usage.quantity || 0), 0);
      if (Number(quantity) > totalYarnUsed) {
        return res.status(400).json({
          message: `Grey fabric quantity (${quantity} kg) cannot exceed total yarn usage (${totalYarnUsed} kg).`,
        });
      }
    }

    // Update or create grey fabric
    let greyFabric;
    if (knitting.greyFabric) {
      greyFabric = await prisma.greyFabric.update({
        where: { knittingId: id },
        data: {
          description: description !== undefined ? description : knitting.greyFabric.description,
          gauge: gauge !== undefined ? gauge : knitting.greyFabric.gauge,
          loopLength: loopLength !== undefined ? Number(loopLength) : knitting.greyFabric.loopLength,
          diameter: diameter !== undefined ? Number(diameter) : knitting.greyFabric.diameter,
          gsm: gsm !== undefined ? Number(gsm) : knitting.greyFabric.gsm,
          quantity: quantity !== undefined ? Number(quantity) : knitting.greyFabric.quantity,
        },
      });
    } else {
      greyFabric = await prisma.greyFabric.create({
        data: {
          knittingId: id,
          description: description || '',
          gauge: gauge || null,
          loopLength: loopLength ? Number(loopLength) : null,
          diameter: diameter ? Number(diameter) : null,
          gsm: gsm ? Number(gsm) : null,
          quantity: Number(quantity) || 0,
        },
      });
    }

    res.json({
      message: 'Grey fabric specs updated successfully.',
      data: greyFabric,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/knitting/stock?knitterId=<id> — yarn stock for a knitter
router.get('/stock', async (req, res, next) => {
  try {
    const { knitterId } = req.query;
    if (!knitterId) return res.status(400).json({ message: 'knitterId is required.' });
    const stocks = await prisma.knitterStock.findMany({
      where: { knitterId: parseInt(knitterId, 10) },
      include: { yarn: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(stocks);
  } catch (err) {
    next(err);
  }
});

// POST /api/knitting/issue — receive yarn from mill into knitter stock
router.post('/issue', async (req, res, next) => {
  try {
    const { knitterId, yarnId, received_weight } = req.body;
    if (!knitterId || !yarnId || !received_weight) {
      return res.status(400).json({ message: 'knitterId, yarnId and received_weight are required.' });
    }

    const existing = await prisma.knitterStock.findFirst({
      where: { knitterId: parseInt(knitterId, 10), yarnId: parseInt(yarnId, 10) },
    });

    let stock;
    if (existing) {
      stock = await prisma.knitterStock.update({
        where: { id: existing.id },
        data: {
          received_weight: { increment: parseFloat(received_weight) },
          remaining_weight: { increment: parseFloat(received_weight) },
        },
        include: { yarn: true },
      });
    } else {
      stock = await prisma.knitterStock.create({
        data: {
          knitterId: parseInt(knitterId, 10),
          yarnId: parseInt(yarnId, 10),
          received_weight: parseFloat(received_weight),
          remaining_weight: parseFloat(received_weight),
        },
        include: { yarn: true },
      });
    }

    res.status(201).json(stock);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
