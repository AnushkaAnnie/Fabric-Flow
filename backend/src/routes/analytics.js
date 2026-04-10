const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// GET /api/analytics
router.get('/', async (req, res, next) => {
  try {
    // Basic overall stats
    const totalYarnRecords = await prisma.yarn.count();
    const totalKnittingRecords = await prisma.knitting.count();
    const totalDyeingRecords = await prisma.dyeing.count();
    const totalCompactingRecords = await prisma.compacting.count();

    // Sums
    const yarnAgg = await prisma.yarn.aggregate({
      _sum: { total_weight: true, total_cost: true }
    });
    
    const knittingAgg = await prisma.knitting.aggregate({
      _sum: { yarn_quantity: true, grey_fabric_weight: true }
    });

    const dyeingAgg = await prisma.dyeing.aggregate({
      _sum: { initial_weight: true, final_weight: true }
    });

    const compactingAgg = await prisma.compacting.aggregate({
      _sum: { initial_weight: true, final_weight: true },
      _avg: { process_loss: true }
    });

    res.json({
      counts: {
        yarn: totalYarnRecords,
        knitting: totalKnittingRecords,
        dyeing: totalDyeingRecords,
        compacting: totalCompactingRecords
      },
      sums: {
        totalYarnWeight: yarnAgg._sum.total_weight || 0,
        totalYarnCost: yarnAgg._sum.total_cost || 0,
        totalGreyFabric: knittingAgg._sum.grey_fabric_weight || 0,
        totalDyedFabric: dyeingAgg._sum.final_weight || 0,
        totalCompactedFabric: compactingAgg._sum.final_weight || 0,
      },
      averages: {
        avgProcessLoss: compactingAgg._avg.process_loss || 0
      }
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
