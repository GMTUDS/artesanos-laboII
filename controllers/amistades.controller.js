const { Amistad, Usuario } = require("../models");

exports.enviarSolicitud = async (req, res) => {
  const emisor_id = req.usuario.id;
  const { receptor_id } = req.body;

  if (!receptor_id) {
    return res.status(400).json({ error: "Falta el ID del destinatario." });
  }

  try {
    const solicitud = await Amistad.create({
      emisor_id,
      receptor_id,
      estado: "pendiente"
    });

    req.io.to(`usuario_${receptor_id}`).emit("nueva_solicitud", {
      emisor_id,
      mensaje: "Tienes una nueva solicitud de amistad."
    });

    res.status(201).json({ mensaje: "Solicitud enviada.", solicitud });
  } catch (error) {
    console.error("❌ Error al enviar solicitud:", error);
    res.status(500).json({ error: "No se pudo enviar la solicitud." });
  }
};

exports.obtenerSolicitudesPendientes = async (req, res) => {
  try {
    const solicitudes = await Amistad.findAll({
      where: {
        receptor_id: req.usuario.id,
        estado: "pendiente"
      },
      include: {
        model: Usuario,
        as: "Emisor",
        attributes: ["id_usuario", "nombre_usuario", "imagen_perfil"]
      }
    });

    res.json(solicitudes);
  } catch (error) {
    console.error("❌ Error al obtener solicitudes pendientes:", error);
    res.status(500).json({ error: "No se pudieron cargar las solicitudes." });
  }
};
