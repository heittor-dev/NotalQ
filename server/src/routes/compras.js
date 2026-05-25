const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/CompraController');

router.get('/', ctrl.listar.bind(ctrl));
router.get('/:id', ctrl.buscarPorId.bind(ctrl));
router.post('/', ctrl.criar.bind(ctrl));
router.put('/:id/receber', ctrl.receberCompra.bind(ctrl));
router.put('/:id/cancelar', ctrl.cancelar.bind(ctrl));

module.exports = router;
