const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

const INCLUDE = { millName: true };

// GET /api/yarn
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = search
      ? { OR: [{ hf_code: { contains: search } }, { description: { contains: search } }] }
      : {};

    const [yarns, total] = await Promise.all([
      prisma.yarn.findMany({ where, include: INCLUDE, orderBy: { createdAt: 'desc' }, skip, take: Number(limit) }),
      prisma.yarn.count({ where }),
    ]);

    res.json({ data: yarns, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
});

// GET /api/yarn/hf/:hf_code
router.get('/hf/:hf_code', async (req, res, next) => {
  try {
    const yarn = await prisma.yarn.findFirst({
      where: { hf_code: req.params.hf_code },
      include: { millName: true },
    });
    if (!yarn) return res.status(404).json({ message: 'HF Code not found.' });
    res.json(yarn);
  } catch (err) { next(err); }
});

// GET /api/yarn/po/:po_no
router.get('/po/:po_no', async (req, res, next) => {
  try {
    const yarns = await prisma.yarn.findMany({
      where: { purchase_order_no: req.params.po_no },
      include: { millName: true },
    });
    res.json(yarns);
  } catch (err) { next(err); }
});

// GET /api/yarn/list/hf-codes — for dropdowns, includes remaining stock
router.get('/list/hf-codes', async (req, res, next) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const yarns = await tx.yarn.findMany({
        select: { id: true, hf_code: true, description: true, total_weight: true },
        orderBy: { hf_code: 'asc' },
      });
      return Promise.all(yarns.map(async (y) => {
        const usedAgg = await tx.knittingYarnUsage.aggregate({
          _sum: { quantity: true },
          where: { yarn_id: y.id },
        });
        const used = usedAgg._sum.quantity || 0;
        return { ...y, used, remaining: y.total_weight - used };
      }));
    });
    res.json(result);
  } catch (err) { next(err); }
});

// GET /api/yarn/:id
router.get('/:id', async (req, res, next) => {
  try {
    const yarn = await prisma.yarn.findUnique({
      where: { id: Number(req.params.id) },
      include: { millName: true },
    });
    if (!yarn) return res.status(404).json({ message: 'Yarn not found.' });
    res.json(yarn);
  } catch (err) { next(err); }
});

// POST /api/yarn
router.post('/', async (req, res, next) => {
  try {
    const {
      mill_name_id, description, hf_code, count, purchase_order_no, invoice_no, delivery_to,
      quality, no_of_bags, bag_weight, rate_per_kg, issued_date,
    } = req.body;

    const BAG_WEIGHT = bag_weight ? Number(bag_weight) : 60;
    const total_weight = Number(no_of_bags) * BAG_WEIGHT;
    const total_cost = total_weight * Number(rate_per_kg);
    const finalHfCode = (hf_code && hf_code.trim()) ? hf_code.trim() : `HF-${Date.now()}`;
    const hasInvoice = invoice_no && invoice_no.trim() !== '';

    const yarn = await prisma.yarn.create({
      data: {
        hf_code: finalHfCode,
        purchase_order_no: (purchase_order_no && purchase_order_no.trim()) ? purchase_order_no.trim() : '',
        invoice_no: invoice_no || '',
        delivery_to: delivery_to || '',
        status: hasInvoice ? 'Received' : 'Pending',
        mill_name_id: Number(mill_name_id),
        description,
        count,
        quality,
        no_of_bags: Number(no_of_bags),
        bag_weight: BAG_WEIGHT,
        total_weight,
        rate_per_kg: Number(rate_per_kg),
        total_cost,
        issued_date: new Date(issued_date),
      },
      include: INCLUDE,
    });

    res.status(201).json(yarn);
  } catch (err) { next(err); }
});

// PUT /api/yarn/:id
router.put('/:id', async (req, res, next) => {
  try {
    const {
      mill_name_id, description, hf_code, count, purchase_order_no, invoice_no, delivery_to,
      quality, no_of_bags, bag_weight, rate_per_kg, issued_date,
    } = req.body;

    // Fetch old state to detect invoice_no change
    const oldYarn = await prisma.yarn.findUnique({ where: { id: Number(req.params.id) } });

    const BAG_WEIGHT = bag_weight ? Number(bag_weight) : 60;
    const total_weight = Number(no_of_bags) * BAG_WEIGHT;
    const total_cost = total_weight * Number(rate_per_kg);
    const finalHfCode = (hf_code && hf_code.trim()) ? hf_code.trim() : oldYarn?.hf_code || '';
    const hasInvoice = invoice_no && invoice_no.trim() !== '';

    const yarn = await prisma.yarn.update({
      where: { id: Number(req.params.id) },
      data: {
        hf_code: finalHfCode,
        purchase_order_no: (purchase_order_no && purchase_order_no.trim()) ? purchase_order_no.trim() : '',
        invoice_no: invoice_no || '',
        delivery_to: delivery_to || '',
        status: hasInvoice ? 'Received' : 'Pending',
        mill_name_id: Number(mill_name_id),
        description,
        count,
        quality,
        no_of_bags: Number(no_of_bags),
        bag_weight: BAG_WEIGHT,
        total_weight,
        rate_per_kg: Number(rate_per_kg),
        total_cost,
        issued_date: new Date(issued_date),
      },
      include: INCLUDE,
    });

    // When invoice_no is newly added, credit yarn to knitter in KnittingYarnUsage summary
    // (The knitter receives this yarn — this is tracked via the delivery_to field)
    // No extra DB action needed: remaining yarn = total_weight - sum(knittingYarnUsage.quantity)
    // The invoice arrival simply confirms the yarn is physically available at the knitter.

    res.json(yarn);
  } catch (err) { next(err); }
});

// DELETE /api/yarn/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.yarn.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Yarn deleted.' });
  } catch (err) { next(err); }
});

// GET /api/yarn/stock/summary — per-HF-code stock summary with knitter
router.get('/stock/summary', async (req, res, next) => {
  try {
    const summary = await prisma.$transaction(async (tx) => {
      const yarns = await tx.yarn.findMany({
        include: { millName: true, yarnUsages: { include: { knitting: { include: { knitterName: true } } } } },
        orderBy: { hf_code: 'asc' },
      });
      return yarns.map(y => {
        const totalUsed = y.yarnUsages.reduce((s, u) => s + u.quantity, 0);
        const byKnitter = {};
        for (const u of y.yarnUsages) {
          const kName = u.knitting?.knitterName?.name || 'Unknown';
          byKnitter[kName] = (byKnitter[kName] || 0) + u.quantity;
        }
        return {
          id: y.id,
          hf_code: y.hf_code,
          description: y.description,
          delivery_to: y.delivery_to,
          total_weight: y.total_weight,
          invoice_no: y.invoice_no,
          status: y.status,
          used: totalUsed,
          remaining: y.total_weight - totalUsed,
          byKnitter,
        };
      });
    });
    res.json(summary);
  } catch (err) { next(err); }
});

module.exports = router;
