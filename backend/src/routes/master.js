const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

const router = express.Router();

// All master routes require auth
router.use(auth);

/**
 * Supported entities:
 * mill-names, knitter-names, dyer-names, compacter-names,
 * colours, wash-types, fabric-descriptions
 */

const ENTITY_MAP = {
  'mill-names': 'millName',
  'knitter-names': 'knitterName',
  'dyer-names': 'dyerName',
  'compacter-names': 'compacterName',
  'colours': 'colour',
  'wash-types': 'washType',
  'fabric-descriptions': 'fabricDescription',
};

// GET /api/master/:entity  — list all
router.get('/:entity', async (req, res, next) => {
  try {
    const model = ENTITY_MAP[req.params.entity];
    if (!model) return res.status(404).json({ message: 'Unknown master entity.' });

    const records = await prisma[model].findMany({ orderBy: { name: 'asc' } });
    res.json(records);
  } catch (err) {
    next(err);
  }
});

// POST /api/master/:entity  — create
router.post('/:entity', async (req, res, next) => {
  try {
    const model = ENTITY_MAP[req.params.entity];
    if (!model) return res.status(404).json({ message: 'Unknown master entity.' });

    const { name, address_line1, address_line2, address_line3, state, pin_code, gstn, email } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required.' });
    }

    const isActor = ['millName', 'knitterName', 'dyerName', 'compacterName'].includes(model);
    const data = { name: name.trim() };
    if (isActor) {
      data.address_line1 = address_line1 ? address_line1.trim() : null;
      data.address_line2 = address_line2 ? address_line2.trim() : null;
      data.address_line3 = address_line3 ? address_line3.trim() : null;
      data.state = state ? state.trim() : null;
      data.pin_code = pin_code ? String(pin_code).trim() : null;
      data.gstn = gstn ? gstn.trim() : null;
      data.email = email ? email.trim() : null;
    }

    const record = await prisma[model].create({ data });
    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
});

// PUT /api/master/:entity/:id  — update
router.put('/:entity/:id', async (req, res, next) => {
  try {
    const model = ENTITY_MAP[req.params.entity];
    if (!model) return res.status(404).json({ message: 'Unknown master entity.' });

    const { name, address_line1, address_line2, address_line3, state, pin_code, gstn, email } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required.' });
    }

    const isActor = ['millName', 'knitterName', 'dyerName', 'compacterName'].includes(model);
    const data = { name: name.trim() };
    if (isActor) {
      data.address_line1 = address_line1 ? address_line1.trim() : null;
      data.address_line2 = address_line2 ? address_line2.trim() : null;
      data.address_line3 = address_line3 ? address_line3.trim() : null;
      data.state = state ? state.trim() : null;
      data.pin_code = pin_code ? String(pin_code).trim() : null;
      data.gstn = gstn ? gstn.trim() : null;
      data.email = email ? email.trim() : null;
    }

    const record = await prisma[model].update({
      where: { id: Number(req.params.id) },
      data,
    });
    res.json(record);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/master/:entity/:id  — delete
router.delete('/:entity/:id', async (req, res, next) => {
  try {
    const model = ENTITY_MAP[req.params.entity];
    if (!model) return res.status(404).json({ message: 'Unknown master entity.' });

    await prisma[model].delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
