const express = require('express');
const router = express.Router();
const citasController = require('./citasController');

// Definir la ruta para obtener las citas
router.get('/citas', citasController.obtenerCitas);

module.exports = router;
