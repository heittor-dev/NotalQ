const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/FornecedorController');

router.get('/', ctrl.listar.bind(ctrl));
router.get('/:id', ctrl.buscarPorId.bind(ctrl));
router.post('/', ctrl.criar.bind(ctrl));
router.put('/:id', ctrl.atualizar.bind(ctrl));
router.delete('/:id', ctrl.deletar.bind(ctrl));

module.exports = router;
