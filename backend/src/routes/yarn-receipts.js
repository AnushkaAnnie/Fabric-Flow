const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// POST: Create a new yarn receipt
router.post('/', auth, async (req, res, next) => {
  try {
    const { yarnId, quantity, dcNo, notes, receiptDate } = req.body;

    // Validation
    if (!yarnId || !quantity) {
      return res.status(400).json({
        error: 'Missing required fields: yarnId, quantity',
      });
    }

    if (typeof quantity !== 'number' || quantity <= 0) {
      return res.status(400).json({
        error: 'Quantity must be a positive number',
      });
    }

    // Check if yarn exists
    const yarn = await prisma.yarn.findUnique({
      where: { id: yarnId },
    });

    if (!yarn) {
      return res.status(404).json({
        error: 'Yarn not found',
      });
    }

    // Create the receipt
    const receipt = await prisma.yarnReceipt.create({
      data: {
        yarnId,
        quantity,
        dcNo: dcNo || null,
        notes: notes || null,
        receiptDate: receiptDate ? new Date(receiptDate) : new Date(),
      },
      include: {
        yarn: {
          select: {
            id: true,
            hf_code: true,
            description: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Yarn receipt created successfully',
      data: receipt,
    });
  } catch (error) {
    next(error);
  }
});

// GET: List all yarn receipts with optional filters
router.get('/', auth, async (req, res, next) => {
  try {
    const { yarnId, startDate, endDate } = req.query;

    const whereConditions = {};

    // Filter by yarnId if provided
    if (yarnId) {
      whereConditions.yarnId = parseInt(yarnId);
    }

    // Filter by date range if provided
    if (startDate || endDate) {
      whereConditions.receiptDate = {};
      if (startDate) {
        whereConditions.receiptDate.gte = new Date(startDate);
      }
      if (endDate) {
        whereConditions.receiptDate.lte = new Date(endDate);
      }
    }

    const receipts = await prisma.yarnReceipt.findMany({
      where: whereConditions,
      include: {
        yarn: {
          select: {
            id: true,
            hf_code: true,
            description: true,
            count: true,
            quality: true,
          },
        },
      },
      orderBy: { receiptDate: 'desc' },
    });

    res.json({
      data: receipts,
    });
  } catch (error) {
    next(error);
  }
});

// GET: Get a single receipt by ID
router.get('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const receipt = await prisma.yarnReceipt.findUnique({
      where: { id: parseInt(id) },
      include: {
        yarn: {
          select: {
            id: true,
            hf_code: true,
            description: true,
            count: true,
            quality: true,
          },
        },
      },
    });

    if (!receipt) {
      return res.status(404).json({
        error: 'Yarn receipt not found',
      });
    }

    res.json({
      data: receipt,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE: Delete a yarn receipt
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const receipt = await prisma.yarnReceipt.findUnique({
      where: { id: parseInt(id) },
    });

    if (!receipt) {
      return res.status(404).json({
        error: 'Yarn receipt not found',
      });
    }

    await prisma.yarnReceipt.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      message: 'Yarn receipt deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
