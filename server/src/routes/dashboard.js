const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/DashboardController');

// Obter estatísticas do dashboard
router.get('/', dashboardController.obterEstatisticas);

module.exports = router;
