const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Helper: Calculate remaining grey fabric for a knitting
async function calculateRemainingGreyFabric(knittingId) {
  const greyFabric = await prisma.greyFabric.findUnique({
    where: { knittingId },
  });

  if (!greyFabric) {
    return { available: 0, issued: 0 };
  }

  // Sum all dyeing lots for this knitting
  const issuedResult = await prisma.dyeingLot.aggregate({
    _sum: { weight: true },
    where: { knittingId },
  });

  const issued = issuedResult._sum.weight || 0;
  const available = greyFabric.quantity - issued;

  return { available, issued, total: greyFabric.quantity };
}

// POST: Create a new dyeing order with lots
router.post('/', auth, async (req, res, next) => {
  try {
    const { dcNo, dyerName, issueDate, notes, lots } = req.body;

    // Validation
    if (!dcNo || !dyerName || !lots || lots.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields: dcNo, dyerName, lots',
      });
    }

    // Validate all lots
    for (const lot of lots) {
      if (!lot.knittingId || !lot.colour || !lot.weight) {
        return res.status(400).json({
          error: 'Each lot requires knittingId, colour, and weight',
        });
      }

      // Check if knitting exists
      const knitting = await prisma.knitting.findUnique({
        where: { id: lot.knittingId },
      });

      if (!knitting) {
        return res.status(404).json({
          error: `Knitting with ID ${lot.knittingId} not found`,
        });
      }

      // Check if grey fabric exists for this knitting
      const greyFabric = await prisma.greyFabric.findUnique({
        where: { knittingId: lot.knittingId },
      });

      if (!greyFabric) {
        return res.status(409).json({
          error: `Knitting ID ${lot.knittingId} does not have grey fabric specs defined`,
        });
      }

      // Validate weight against available grey fabric
      const remaining = await calculateRemainingGreyFabric(lot.knittingId);
      if (lot.weight > remaining.available) {
        return res.status(409).json({
          error: `Insufficient grey fabric for Knitting ID ${lot.knittingId}. Available: ${remaining.available} kg, Requested: ${lot.weight} kg`,
        });
      }
    }

    // Create dyeing order and lots in a transaction
    const order = await prisma.dyeingOrder.create({
      data: {
        dcNo,
        dyerName,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        notes: notes || null,
        lots: {
          create: lots.map(lot => ({
            knittingId: lot.knittingId,
            colour: lot.colour,
            weight: Number(lot.weight),
          })),
        },
      },
      include: {
        lots: {
          include: {
            knitting: {
              include: {
                fabricDescription: true,
                greyFabric: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      message: 'Dyeing order created successfully',
      data: order,
    });
  } catch (error) {
    if (error.code === 'P2002' && error.meta?.target?.includes('dcNo')) {
      return res.status(400).json({
        error: 'DC No must be unique. This DC No is already in use.',
      });
    }
    next(error);
  }
});

// GET: List all dyeing orders with filters
router.get('/', auth, async (req, res, next) => {
  try {
    const { dyerName, dcNo, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const whereConditions = {};

    if (dyerName) {
      whereConditions.dyerName = { contains: dyerName };
    }

    if (dcNo) {
      whereConditions.dcNo = { contains: dcNo };
    }

    const [orders, total] = await Promise.all([
      prisma.dyeingOrder.findMany({
        where: whereConditions,
        include: {
          lots: {
            include: {
              knitting: {
                select: {
                  id: true,
                  hf_code: true,
                  dc_no: true,
                },
              },
            },
          },
        },
        orderBy: { issueDate: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.dyeingOrder.count({ where: whereConditions }),
    ]);

    // Add lot count to each order
    const ordersWithCount = orders.map(order => ({
      ...order,
      lotCount: order.lots.length,
    }));

    res.json({
      data: ordersWithCount,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    next(error);
  }
});

// GET: Get a specific dyeing order with full details
router.get('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.dyeingOrder.findUnique({
      where: { id: parseInt(id) },
      include: {
        lots: {
          include: {
            knitting: {
              include: {
                fabricDescription: true,
                greyFabric: true,
                yarnUsages: {
                  include: {
                    yarn: {
                      select: {
                        id: true,
                        hf_code: true,
                        description: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        error: 'Dyeing order not found',
      });
    }

    res.json({
      data: order,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
