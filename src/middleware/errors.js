export function notFound(_req, res) {
  res.status(404).json({ error: 'Route not found.' });
}

export function errorHandler(error, _req, res, _next) {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'Request body must contain valid JSON.' });
  }
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid request data.', details: error.message });
  }
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0];
    const message = field === 'email' ? 'An account with this email already exists.' : field === 'name' ? 'A record with this name already exists.' : 'A record with this value already exists.';
    return res.status(409).json({ error: message });
  }
  console.error(error);
  return res.status(500).json({ error: 'Internal server error.' });
}
