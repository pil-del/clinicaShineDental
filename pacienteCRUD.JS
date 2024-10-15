const db = require('../database/db'); // Ajusta la ruta según tu estructura

exports.getPacientes = (req, res) => {
    db.query('SELECT * FROM paciente', (error, results) => {
        if (error) {
            console.error('Error al obtener los pacientes:', error.message);
            return res.status(500).json({ message: 'Error al obtener los pacientes.' });
        }
        res.json(results);
    });
};

exports.getPacienteById = (req, res) => {
    const { idPaciente } = req.params;
    
    db.query('SELECT * FROM paciente WHERE idPaciente = ?', [idPaciente], (error, results) => {
        if (error) {
            console.error('Error al obtener el paciente:', error.message);
            return res.status(500).json({ message: 'Error al obtener el paciente.' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Paciente no encontrado.' });
        }
        res.json(results[0]);
    });
};

exports.updatePaciente = (req, res) => {
    const { idPaciente, nombre, apellido, telefono, email, fechaRegistro, historialMedico, observaciones, tipoPaciente_idtipoPaciente } = req.body;

    if (!idPaciente) {
        return res.status(400).json({ message: 'El campo idPaciente es obligatorio.' });
    }

    const updateData = {
        ...(nombre && { nombre }),
        ...(apellido && { apellido }),
        ...(telefono && { telefono }),
        ...(email && { email }),
        ...(fechaRegistro && { fechaRegistro }),
        ...(historialMedico && { historialMedico }),
        ...(observaciones && { observaciones }),
        ...(tipoPaciente_idtipoPaciente && { tipoPaciente_idtipoPaciente })
    };

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'No se proporcionaron campos válidos para actualizar.' });
    }

    db.query('UPDATE paciente SET ? WHERE idPaciente = ?', [updateData, idPaciente], (error, results) => {
        if (error) {
            console.error('Error al actualizar el paciente:', error.message);
            return res.status(500).json({ message: 'Error al actualizar el paciente.' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Paciente no encontrado.' });
        }

        res.json({ message: 'Paciente actualizado exitosamente.' });
    });
};