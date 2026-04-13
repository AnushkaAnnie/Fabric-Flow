const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);

  // Prisma known errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      message: 'A record with this value already exists.',
      field: err.meta?.target,
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ message: 'Record not found.' });
  }

  if (err.code === 'P2003') {
    return res.status(400).json({ 
      message: 'Cannot delete: This record is linked to other processes.' 
    });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: err.message || 'Internal server error.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
