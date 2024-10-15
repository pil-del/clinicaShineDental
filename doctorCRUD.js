const connection = require('../database/db');

exports.updatedoctor = (req, res) => {

    const iddoctor = req.body.iddoctor;
    const nombre = req.body.nombre;
    const apellido = req.body.apellido;
    const especialidad = req.body.especialidad;
    const telefono = req.body.telefono;
    const email = req.body.email;
    const observacion = req.body.observacion;
    const domicilio = req.body.domicilio;

    // Actualizamos los campos que son editables
    const dataToUpdate = {
        nombre: nombre,
        apellido: apellido,
        especialidad_idespecialidad: especialidad,
        telefono: telefono,
        email: email,
        observacion: observacion,
        domicilio: domicilio
    };

    connection.query('UPDATE doctor SET ? WHERE iddoctor = ?', [dataToUpdate, iddoctor], (error, results) => {
        if (error) {
            console.log(error);
        } else {
            res.redirect('/admin/doctores');
        }
    });
};
