const db = require('../database/db');

// Function to update a user
exports.updateuser = (req, res) => {
    const { idusuario, username, rol_idrol, estadoUsuario_idestadoUsuario } = req.body;

    if (!idusuario) {
        return res.status(400).json({ success: false, message: 'El campo idusuario es obligatorio.' });
    }

    // Construct the update object with the fields provided
    const updateData = {
        ...(username && { username }),
        ...(rol_idrol && { rol_idrol }),
        ...(estadoUsuario_idestadoUsuario !== undefined && { estadoUsuario_idestadoUsuario })
    };

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ success: false, message: 'No se proporcionaron campos válidos para actualizar.' });
    }

    db.query('UPDATE usuario SET ? WHERE idusuario = ?', [updateData, idusuario], (error, results) => {
        if (error) {
            console.error('Error al actualizar el usuario:', error.message);
            return res.status(500).json({ success: false, message: 'Error al actualizar el usuario.' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        }

        res.json({ success: true, message: 'Usuario actualizado exitosamente.' });
    });
};

// Function to get inactive users
exports.getInactiveUsers = (req, res) => {
    db.query('SELECT * FROM usuario WHERE estadoUsuario_idestadoUsuario = 2', (error, results) => {
        if (error) {
            console.error('Error al obtener usuarios inactivos:', error.message);
            return res.status(500).json({ success: false, message: 'Error al obtener usuarios inactivos.' });
        }
        res.render('admin/usuariosinactivos', { usuarios: results });
    });
};

// Function to inactivate a user
exports.inactivateUser = (req, res) => {
    const idusuario = req.params.idusuario;

    if (!idusuario) {
        return res.status(400).json({ success: false, message: 'El campo idusuario es obligatorio.' });
    }

    db.query('UPDATE usuario SET estadoUsuario_idestadoUsuario = 2 WHERE idusuario = ?', [idusuario], (error, results) => {
        if (error) {
            console.error('Error al inactivar el usuario:', error.message);
            return res.status(500).json({ success: false, message: 'Error al inactivar el usuario.' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        }

        res.json({ success: true, message: 'Usuario inactivado exitosamente.' });
    });
};

// Function to activate a user
exports.activateUser = (req, res) => {
    const idusuario = req.params.idusuario;

    if (!idusuario) {
        return res.status(400).json({ success: false, message: 'El campo idusuario es obligatorio.' });
    }

    db.query('UPDATE usuario SET estadoUsuario_idestadoUsuario = 1 WHERE idusuario = ?', [idusuario], (error, results) => {
        if (error) {
            console.error('Error al activar el usuario:', error.message);
            return res.status(500).json({ success: false, message: 'Error al activar el usuario.' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        }

        res.json({ success: true, message: 'Usuario activado exitosamente.' });
    });
};
