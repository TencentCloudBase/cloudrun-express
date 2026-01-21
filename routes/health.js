const express = require('express');
const router = express.Router();

/* GET health check */
router.get('/', function(req, res, next) {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    framework: 'Express',
    version: process.env.npm_package_version || '1.0.0',
    node_version: process.version
  });
});

module.exports = router;
