// 1 - Invocamos a Express
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');

// 2 - Para poder capturar los datos del formulario
app.use(express.urlencoded({ extended: false }));
app.use(express.json()); // Le decimos a Express que vamos a usar JSON

// 3 - Invocamos a dotenv
const dotenv = require('dotenv');
dotenv.config({ path: './env/.env' });

// 4 - Invocamos a bcryptjs
const bcryptjs = require('bcryptjs');

// 5 - Configura el motor de vistas
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 6 - Configura la carpeta pública para archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// 7 - Configura la base de datos
const db = require('./database/db');

// Verificar conexión a la base de datos
db.promise().query('SELECT 1')
    .then(() => console.log('Consulta de prueba ejecutada con éxito'))
    .catch(err => console.error('Error al ejecutar la consulta: ', err.message));

// 8 - Configuración de la sesión
const session = require('express-session');
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Cambia a true si usas HTTPS
}));

// Middleware para verificar autenticación
const isAuthenticated = (req, res, next) => {
    if (req.session.loggedin) {
        return next();
    }
    res.redirect('/admin/login'); // Redirige a login si no está autenticado
};

// 9 - Rutas para la página principal y páginas de cliente
app.get('/', (req, res) => {
    res.render('index'); // Renderiza el archivo index.ejs en la carpeta views
});

app.get('/cliente/about', (req, res) => {
    res.render('cliente/about'); // Renderiza el archivo about.ejs en la carpeta views/cliente
});

app.get('/cliente/contact', (req, res) => {
    res.render('cliente/contact'); // Renderiza el archivo contact.ejs en la carpeta views/cliente
});

app.get('/cliente/doctors', (req, res) => {
    res.render('cliente/doctors'); // Renderiza el archivo doctors.ejs en la carpeta views/cliente
});

app.get('/cliente/odontopediatria', (req, res) => {
    res.render('cliente/odontopediatria'); // Renderiza el archivo odontopediatria.ejs en la carpeta views/cliente
});

app.get('/cliente/services', (req, res) => {
    res.render('cliente/services'); // Renderiza el archivo services.ejs en la carpeta views/cliente
});

// 10 - Rutas de administrador
app.get('/admin/login', (req, res) => {
    res.render('admin/login'); // Renderiza el archivo login.ejs en la carpeta views/admin
});

app.get('/admin/dashboard', isAuthenticated, (req, res) => {
    res.render('admin/dashboard', { usuario: req.session.usuario }); // Asegúrate de pasar 'usuario' correctamente
});

app.get('/admin/pago', (req, res) => {
    // Supongamos que tienes una conexión a la base de datos
    const query = "SELECT fecha, tratamiento_realizado, lugar, saldo, abono, (saldo - abono) AS saldo_restante FROM pago";
    
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error en la base de datos');
        }

        // Pasar los pagos obtenidos a la vista
        res.render('admin/pago', { pagos: results });
    });
});


app.get('/admin/historial', isAuthenticated, (req, res) => {
    const citasQuery = `
        SELECT cita.*, paciente.nombre AS nombrePaciente, doctor.nombre AS nombreDoctor 
        FROM cita
        JOIN paciente ON cita.paciente_idPaciente = paciente.idPaciente
        JOIN doctor ON cita.doctor_iddoctor = doctor.iddoctor;
    `;

    const tiposervicioQuery = `
        SELECT * FROM tiposervicio;
    `;

    const doctoresQuery = `
        SELECT * FROM doctor;  /* Fetching all doctors */
    `;

    const historial_clinicoQuery = `
        SELECT * FROM historial_clinico;  /* Fetching clinical history */
    `;

    db.query(citasQuery, (errorCitas, resultadosCitas) => {
        if (errorCitas) {
            console.error('Error fetching citas:', errorCitas);
            return res.status(500).send('Internal Server Error');
        }

        db.query(tiposervicioQuery, (errorTipos, resultadosTipos) => {
            if (errorTipos) {
                console.error('Error fetching tiposervicio:', errorTipos);
                return res.status(500).send('Internal Server Error');
            }

            db.query(doctoresQuery, (errorDoctores, resultadosDoctores) => {
                if (errorDoctores) {
                    console.error('Error fetching doctores:', errorDoctores);
                    return res.status(500).send('Internal Server Error');
                }

                db.query(historial_clinicoQuery, (errorHistorial, resultadosHistorial) => {
                    if (errorHistorial) {
                        console.error('Error fetching historial_clinico:', errorHistorial);
                        return res.status(500).send('Internal Server Error');
                    }

                    // Pass the results to the EJS template
                    res.render('admin/historial', { 
                        cita: resultadosCitas, 
                        tiposervicio: resultadosTipos, 
                        doctores: resultadosDoctores, 
                        historial_clinico: resultadosHistorial 
                    });
                });
            });
        });
    });
});

app.get('/admin/inventario', isAuthenticated, (req, res) => {
    const query = "SELECT * FROM producto"; // Consulta para obtener los productos desde la base de datos
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error en la base de datos');
        }

        // Renderizamos la vista inventario.ejs y pasamos los resultados como la variable 'producto'
        res.render('admin/inventario', { producto: results });
    });
});


app.get('/admin/registro', (req, res) => {
    res.render('admin/registro');
});

app.get('/admin/compra', isAuthenticated, (req, res) => {
    // Consulta para obtener las compras de productos
    const query = "SELECT * FROM compraproducto";
    
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error en la base de datos');
        }

        // Pasa los resultados como la variable 'compraproducto' a la vista 'compra.ejs'
        res.render('admin/compra', { compraproducto: results });
    });
});

app.get('/admin/doctores', isAuthenticated, (req, res) => {
    const query = `
        SELECT 
            doctor.*, 
            genero.nombre AS genero, 
            especialidad.nombre AS especialidad
        FROM doctor
        LEFT JOIN genero ON doctor.genero_idGenero = genero.idGenero
        LEFT JOIN especialidad ON doctor.especialidad_idespecialidad = especialidad.idespecialidad
    `;

    db.query(query, (error, results) => {
        if (error) {
            console.error('Error al consultar doctores:', error);
            return res.status(500).send('Error al consultar doctores');
        }
        console.log('Doctores:', results); // Línea para depuración
        res.render('admin/doctores', { doctores: results });
    });
});

// 13 - Ruta para consultar usuarios con autenticación
app.get('/admin/usuarios', isAuthenticated, (req, res) => {
    db.query('SELECT * FROM usuario', (error, results) => {
        if (error) {
            console.error('Error al consultar usuarios:', error);
            return res.status(500).send('Error al consultar usuarios');
        }
        res.render('admin/usuarios', { usuarios: results });
    });
});

// Definición de rutas
app.get('/admin/usuariosinactivos', (req, res) => {
    db.query('SELECT * FROM usuario WHERE estadoUsuario_idestadoUsuario = 2', (error, results) => {
        if (error) {
            console.error('Error al obtener usuarios inactivos:', error.message);
            return res.status(500).send('Error al obtener usuarios inactivos.');
        }
        res.render('admin/usuariosinactivos', { usuarios: results });
    });
});

// 11 - CRUD Paciente
app.post('/admin/pacientes', async (req, res) => {
    const { 
        nombre, apellido, telefono, email, edad, fechaNacimiento, direccion, nit, dpi, tipoPaciente_idtipoPaciente, genero_idGenero,
        nombreEmergencia, numeroEmergencia, parentescoEmergencia 
    } = req.body;

    if (!nombre || !apellido || !telefono || !email || !edad || !fechaNacimiento || !direccion || !nit || !dpi || !tipoPaciente_idtipoPaciente || !genero_idGenero) {
        return res.status(400).json({ message: 'Todos los campos requeridos deben estar completos.' });
    }

    try {
        await db.promise().beginTransaction();

        const newPaciente = { 
            nombre, apellido, telefono, email, edad, fechaNacimiento, direccion, nit, dpi, tipoPaciente_idtipoPaciente, genero_idGenero 
        };
        const [pacienteResult] = await db.promise().query('INSERT INTO paciente SET ?', newPaciente);

        const newContactoEmergencia = {
            nombre: nombreEmergencia,
            numero: numeroEmergencia,
            parentesco: parentescoEmergencia
        };
        await db.promise().query('INSERT INTO contactoemergencia SET ?', newContactoEmergencia);

        await db.promise().commit();
        console.log('Paciente y contacto de emergencia registrados con éxito');
        res.redirect('/admin/pacientes');
    } catch (error) {
        console.error('Error al insertar los datos:', error);
        await db.promise().rollback();
        res.status(500).json({ message: 'Error al insertar los datos del paciente o contacto de emergencia.' });
    }
});

// 11 - Registro
app.post('/registro', async (req, res) => {
    const {
        usuario, password, rol, nombre, apellido, especialidad,
        telefono, email, dpi, fechaNacimiento, genero_idGenero, tipoSangre, domicilio
    } = req.body;
    

    // Validar datos (puedes agregar más validaciones aquí)
    if (!usuario || !password || !rol || !nombre || !apellido || !especialidad || !telefono || !email || !dpi || !fechaNacimiento || !genero_idGenero || !tipoSangre || !domicilio) {
        return res.status(400).send('Todos los campos son requeridos.');
    }

    // Hash del password
    try {
        const hashedPassword = await bcryptjs.hash(password, 10);

        // Iniciar una transacción
        db.beginTransaction((err) => {
            if (err) throw err;

            // Insertar en la tabla usuario
            db.query(
                'INSERT INTO usuario (user, password, rol_idrol, estadoUsuario_idestadoUsuario) VALUES (?, ?, ?, 1)',
                [usuario, hashedPassword, rol],
                (error, results) => {
                    if (error) {
                        return db.rollback(() => {
                            throw error;
                        });
                    }

                    const usuario_id = results.insertId;

                    // Insertar en la tabla doctor con los nuevos campos
                    db.query(
                        `INSERT INTO doctor 
                        (nombre, apellido, telefono, email, usuario_idusuario, especialidad_idespecialidad, dpi, fechaNacimiento, genero_idGenero, tipoSangre, domicilio) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [nombre, apellido, telefono, email, usuario_id, especialidad, dpi, fechaNacimiento, genero_idGenero, tipoSangre, domicilio],                    
                        (error) => {
                            if (error) {
                                return db.rollback(() => {
                                    throw error;
                                });
                            }

                            // Confirmar la transacción
                            db.commit((err) => {
                                if (err) {
                                    return db.rollback(() => {
                                        throw err;
                                    });
                                }
                                console.log('Doctor registrado con éxito');
                                res.redirect('/admin/login');
                            });
                        }
                    );
                }
            );
        });
    } catch (error) {
        console.error('Error al registrar el doctor:', error);
        res.status(500).send('Error al registrar el doctor.');
    }
});

// 12 - Autenticación
app.post('/auth', async (req, res) => {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
        return res.status(400).send('Por favor ingrese usuario y contraseña');
    }

    try {
        const [results] = await db.promise().query('SELECT * FROM usuario WHERE user = ?', [usuario]);

        if (!results.length || !(await bcryptjs.compare(password, results[0].password))) {
            return res.render('admin/login', {
                alert: true,
                alertTitle: "Error",
                alertMessage: "Usuario y/o contraseña incorrectos",
                alertIcon: "error",
                showConfirmButton: true,
                timer: false,
                ruta: 'login'
            });
        }

        req.session.loggedin = true;
        req.session.usuario = results[0].user;
        req.session.userId = results[0].idusuario;
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error('Error en la autenticación:', error);
        res.status(500).send('Error al autenticar el usuario');
    }
});

app.post('/admin/fichamedica/agregar', (req, res) => {
    const nuevaFichaData = req.body; // Asegúrate de que los datos estén bien estructurados
    const pacienteId = nuevaFichaData.pacienteId; // Asegúrate de pasar el ID del paciente

    // Insertar la nueva ficha médica
    const insertFichaQuery = 'INSERT INTO fichamedica SET ?';
    connection.query(insertFichaQuery, nuevaFichaData, (error, fichaResult) => {
        if (error) {
            return res.status(500).json({ message: 'Error al agregar la ficha médica: ' + error.message });
        }

        // Actualizar el paciente
        const pacienteUpdateQuery = 'UPDATE paciente SET fichaMedica_idfichaMedica = ? WHERE idPaciente = ?';
        connection.query(pacienteUpdateQuery, [fichaResult.insertId, pacienteId], (error) => {
            if (error) {
                return res.status(500).json({ message: 'Error al actualizar el paciente: ' + error.message });
            }
            res.status(201).json({ message: 'Ficha médica agregada y paciente actualizado exitosamente.' });
        });
    });
});

// 13 - Rutas para consultar tablas
// Ruta para consultar usuarios
app.get('/admin/usuarios', isAuthenticated, (req, res) => {
    db.query('SELECT * FROM usuario', (error, results) => {
        if (error) {
            console.error('Error al consultar usuarios:', error);
            return res.status(500).send('Error al consultar usuarios');
        }
        res.render('admin/usuarios', { usuarios: results }); // 'usuarios' es el nombre que usarás en la vista
    });
});

// Ruta para consultar doctores
app.get('/admin/doctores', isAuthenticated, (req, res) => {
    const query = `
        SELECT 
            doctor.*, 
            genero.nombre AS genero, 
            especialidad.nombre AS especialidad
        FROM doctor
        LEFT JOIN genero ON doctor.genero_idGenero = genero.idGenero
        LEFT JOIN especialidad ON doctor.especialidad_idespecialidad = especialidad.idespecialidad
    `;

    db.query(query, (error, results) => {
        if (error) {
            console.error('Error al consultar doctores:', error);
            return res.status(500).send('Error al consultar doctores');
        }
        console.log('Doctores:', results); // Línea para depuración
        res.render('admin/doctores', { doctores: results });
    });
});

app.get('/admin/citas', isAuthenticated, (req, res) => {
    const citasQuery = `
        SELECT cita.*, paciente.nombre AS nombrePaciente, doctor.nombre AS nombreDoctor 
        FROM cita
        JOIN paciente ON cita.paciente_idPaciente = paciente.idPaciente
        JOIN doctor ON cita.doctor_iddoctor = doctor.iddoctor;
    `;

    const pacientesQuery = `
        SELECT * FROM paciente;  -- Fetch all patients
    `;

    const doctoresQuery = `
        SELECT * FROM doctor;  -- Fetch all doctors
    `;

    db.query(citasQuery, (error, citas) => {
        if (error) {
            console.error('Error al consultar citas:', error);
            return res.status(500).send('Error al consultar citas');
        }

        db.query(pacientesQuery, (error, pacientes) => {
            if (error) {
                console.error('Error al consultar pacientes:', error);
                return res.status(500).send('Error al consultar pacientes');
            }

            db.query(doctoresQuery, (error, doctores) => {
                if (error) {
                    console.error('Error al consultar doctores:', error);
                    return res.status(500).send('Error al consultar doctores');
                }

                console.log('Citas:', citas);
                console.log('Pacientes:', pacientes);
                console.log('Doctores:', doctores);
                res.render('admin/citas', { citas: citas, pacientes: pacientes, doctores: doctores });
            });
        });
    });
});

// Ruta para consultar pacientes
app.get('/admin/pacientes', isAuthenticated, (req, res) => {
    db.query('SELECT * FROM paciente', (error, results) => {
        if (error) {
            console.error('Error al consultar pacientes:', error);
            return res.status(500).send('Error al consultar pacientes');
        }
        res.render('admin/pacientes', { pacientes: results }); // Cambié 'pacientes' a 'pacientes'
    });
});

app.get('/admin/archivados', (req, res) => {
    // Supongamos que estás obteniendo los pacientes archivados de la base de datos
    const query = "SELECT * FROM paciente WHERE idestado = '2'"; // Por ejemplo, estado 'archivado'
    
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error en la base de datos');
        }

        // Renderiza la vista y pasa la variable `pacientes` a la vista
        res.render('admin/archivados', { pacientes: results });
    });
});


// 14 - EDITS
app.get('/admin/doctores/:iddoctor', (req, res) => {
    const iddoctor = req.params.iddoctor;

    db.query('SELECT * FROM doctor WHERE iddoctor=?', [iddoctor], (error, results) => {
        if (error) {
            throw error;
        } else {
            res.render('doctor', { doctor: results[0] });
        }
    });
});

app.get('/admin/usuario/:idusuario', (req, res) => {
    const idusuario = req.params.idusuario;

    db.query('SELECT * FROM usuario WHERE idusuario=?', [idusuario], (error, results) => {
        if (error) {
            throw error;
        } else {
            res.render('usuario', { usuario: results[0] });
        }
    });
});

// Ruta para validar la contraseña del usuario
app.post('/admin/usuarios/validate-password', async (req, res) => {
    const { userId, password } = req.body;

    try {
        // Obtener el usuario por ID
        db.query('SELECT * FROM usuario WHERE idusuario = ?', [userId], async (error, results) => {
            if (error) {
                console.error('Error al obtener usuario:', error);
                return res.status(500).json({ valid: false });
            }

            const user = results[0];
            if (!user) {
                return res.status(404).json({ valid: false });
            }

            // Verificar la contraseña
            const passwordIsValid = await bcryptjs.compare(password, user.password);
            res.json({ valid: passwordIsValid });
        });
    } catch (error) {
        console.error('Error al validar la contraseña:', error);
        res.status(500).json({ valid: false });
    }
});

// 11 - Ingresar Nuevo Doctor
app.post('/adddoctores', async (req, res) => {
    const {
        usuario, password, rol, nombre, apellido, especialidad,
        telefono, email, dpi, fechaNacimiento, genero_idGenero, tipoSangre, domicilio
    } = req.body;
    

    // Validar datos (puedes agregar más validaciones aquí)
    if (!usuario || !password || !rol || !nombre || !apellido || !especialidad || !telefono || !email || !dpi || !fechaNacimiento || !genero_idGenero || !tipoSangre || !domicilio) {
        return res.status(400).send('Todos los campos son requeridos.');
    }

    // Hash del password
    try {
        const hashedPassword = await bcryptjs.hash(password, 10);

        // Iniciar una transacción
        db.beginTransaction((err) => {
            if (err) throw err;

            // Insertar en la tabla usuario
            db.query(
                'INSERT INTO usuario (user, password, rol_idrol, estadoUsuario_idestadoUsuario) VALUES (?, ?, ?, 1)',
                [usuario, hashedPassword, rol],
                (error, results) => {
                    if (error) {
                        return db.rollback(() => {
                            throw error;
                        });
                    }

                    const usuario_id = results.insertId;

                    // Insertar en la tabla doctor con los nuevos campos
                    db.query(
                        `INSERT INTO doctor 
                        (nombre, apellido, telefono, email, usuario_idusuario, especialidad_idespecialidad, dpi, fechaNacimiento, genero_idGenero, tipoSangre, domicilio) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [nombre, apellido, telefono, email, usuario_id, especialidad, dpi, fechaNacimiento, genero_idGenero, tipoSangre, domicilio],                    
                        (error) => {
                            if (error) {
                                return db.rollback(() => {
                                    throw error;
                                });
                            }

                            // Confirmar la transacción
                            db.commit((err) => {
                                if (err) {
                                    return db.rollback(() => {
                                        throw err;
                                    });
                                }
                                console.log('Doctor registrado con éxito');
                                res.redirect('/admin/login');
                            });
                        }
                    );
                }
            );
        });
    } catch (error) {
        console.error('Error al registrar el doctor:', error);
        res.status(500).send('Error al registrar el doctor.');
    }
});

// 14 - CRUDS
const doctores = require('./controllers/doctorCRUD');
app.post('/updatedoctor', doctores.updatedoctor);

const usuarios = require('./controllers/usuarioCRUD');
app.get('/admin/usuariosinactivos', usuarios.getInactiveUsers);
app.post('/updateusuario', usuarios.updateuser);
app.post('/inactivate/:idusuario', usuarios.inactivateUser);
app.post('/activate/:idusuario', usuarios.activateUser);

app.post('/admin/usuarios/activar/:id', (req, res) => {
    const userId = req.params.id;
    
    // Aquí se actualizaría el estado del usuario en la base de datos
    Usuario.update({ estadoUsuario_idestadoUsuario: 1 }, { where: { idusuario: userId } })
        .then(result => {
            res.send({ success: true, message: "Usuario activado exitosamente." });
        })
        .catch(err => {
            console.error('Error al activar usuario:', err);
            res.status(500).send({ success: false, message: "Error al activar el usuario." });
        });
});

// Iniciar el servidor
app.listen(3000, () => {
    console.log('Servidor en ejecución en http://localhost:3000');
});
