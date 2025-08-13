module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ message: 'AI Art Appraiser API', version: '1.0.0', status: 'running' }));
};

