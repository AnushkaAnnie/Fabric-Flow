const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// GET /api/search?q=XYZ (searches both hf_code and lot_no)
router.get('/', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ yarn: null, fabric: null, knitting: [], dyeing: [], compacting: [] });

    // Initially assume it's an HF Code
    let hf_code_query = q;

    // Check if it's a lot_no by checking Dyeing (since lot_no is created there)
    const dyeCheck = await prisma.dyeing.findUnique({ where: { lot_no: q } });
    if (dyeCheck) {
      if (dyeCheck.source_type === 'INHOUSE_FABRIC') {
        const fabricCode = dyeCheck.fabric_code || dyeCheck.hf_code;
        const fabric = await prisma.inhouseKnittedFabric.findUnique({ where: { fabric_code: fabricCode } });
        const dyeings = await prisma.dyeing.findMany({
          where: { source_type: 'INHOUSE_FABRIC', fabric_code: fabricCode },
          include: { dyerName: true, washType: true, colour: true }
        });
        const compactings = await prisma.compacting.findMany({
          where: { lot_no: { in: dyeings.map(dyeing => dyeing.lot_no) } },
          include: { compacterName: true, colour: true }
        });
        return res.json({ yarn: null, fabric, knitting: [], dyeing: dyeings, compacting: compactings });
      }
      hf_code_query = dyeCheck.hf_code;
    }

    const fabric = await prisma.inhouseKnittedFabric.findUnique({ where: { fabric_code: q } });
    if (fabric) {
      const dyeings = await prisma.dyeing.findMany({
        where: { source_type: 'INHOUSE_FABRIC', fabric_code: fabric.fabric_code },
        include: { dyerName: true, washType: true, colour: true }
      });
      const compactings = await prisma.compacting.findMany({
        where: { lot_no: { in: dyeings.map(dyeing => dyeing.lot_no) } },
        include: { compacterName: true, colour: true }
      });
      return res.json({ yarn: null, fabric, knitting: [], dyeing: dyeings, compacting: compactings });
    }

    let yarn = await prisma.yarn.findFirst({
      where: { hf_code: hf_code_query },
      include: { millName: true }
    });

    if (!yarn) {
       return res.json({ yarn: null, fabric: null, knitting: [], dyeing: [], compacting: [] });
    }

    // We have the Yarn. Now get all downstream processes for this hf_code
    const knittings = await prisma.knitting.findMany({
      where: { hf_code: yarn.hf_code },
      include: { knitterName: true, fabricDescription: true }
    });

    const dyeings = await prisma.dyeing.findMany({
      where: { hf_code: yarn.hf_code },
      include: { dyerName: true, washType: true, colour: true }
    });

    const compactings = await prisma.compacting.findMany({
      where: { hf_code: yarn.hf_code },
      include: { compacterName: true, colour: true }
    });

    res.json({
      yarn,
      fabric: null,
      knitting: knittings,
      dyeing: dyeings,
      compacting: compactings
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
