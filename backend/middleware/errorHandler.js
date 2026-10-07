const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  
  // Don't expose stack traces in production
  const isDev = process.env.NODE_ENV === 'development';
  
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  if (err.message?.includes('not found')) {
    return res.status(404).json({ error: err.message });
  }

  if (err.message?.includes('Unauthorized') || err.message?.includes('not authorized')) {
    return res.status(403).json({ error: err.message });
  }

  return res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(isDev && { stack: err.stack }),
  });
};

module.exports = errorHandler;
