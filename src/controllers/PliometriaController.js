import { Pliometria } from "../models/Pliometria.js"
import { Cuenta } from "../models/Cuenta.js"
import { Jugador } from "../models/Jugador.js"

// Crear un nuevo registro de pliometría
export const crearPliometria = async (req, res) => {
  try {
    const { idUser, fecha, extensionizquierda, extensionderecha, movimiento } = req.body

    // Validar que el usuario existe
    const usuario = await Cuenta.findByPk(idUser)
    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" })
    }

    const nuevaPliometria = await Pliometria.create({
      idUser,
      fecha,
      extensionizquierda,
      extensionderecha,
      movimiento,
      estado: "finalizado",
    })

    res.status(201).json({
      mensaje: "Registro de pliometría creado exitosamente",
      data: nuevaPliometria,
    })
  } catch (error) {
    console.error("Error al crear pliometría:", error)
    res.status(500).json({
      mensaje: "Error al crear el registro de pliometría",
      error: error.message,
    })
  }
}

// Obtener todos los registros de pliometría
export const obtenerPliometrias = async (req, res) => {
  try {
    const pliometrias = await Pliometria.findAll({
      include: [
        {
          model: Cuenta,
          as: "cuenta",
          attributes: ["id", "usuario", "rol"],
        },
        {
          model: Jugador,
          as: "jugador",
          attributes: ["id", "nombre", "apellido", "posicion"],
        },
      ],
      order: [["fecha", "DESC"]],
    })

    res.status(200).json({
      mensaje: "Registros de pliometría obtenidos exitosamente",
      data: pliometrias,
    })
  } catch (error) {
    console.error("Error al obtener pliometrías:", error)
    res.status(500).json({
      mensaje: "Error al obtener los registros de pliometría",
      error: error.message,
    })
  }
}

// Obtener un registro de pliometría por ID
export const obtenerPliometriaPorId = async (req, res) => {
  try {
    const { id } = req.params

    const pliometria = await Pliometria.findByPk(id, {
      include: [
        {
          model: Cuenta,
          as: "cuenta",
          attributes: ["id", "usuario", "rol"],
        },
        {
          model: Jugador,
          as: "jugador",
          attributes: ["id", "nombre", "apellido", "posicion"],
        },
      ],
    })

    if (!pliometria) {
      return res.status(404).json({ mensaje: "Registro de pliometría no encontrado" })
    }

    res.status(200).json({
      mensaje: "Registro de pliometría obtenido exitosamente",
      data: pliometria,
    })
  } catch (error) {
    console.error("Error al obtener pliometría:", error)
    res.status(500).json({
      mensaje: "Error al obtener el registro de pliometría",
      error: error.message,
    })
  }
}

// Obtener registros de pliometría por usuario
export const obtenerPliometriasPorUsuario = async (req, res) => {
  try {
    const { idUser } = req.params

    const pliometrias = await Pliometria.findAll({
      where: { idUser },
      include: [
        {
          model: Cuenta,
          as: "cuenta",
          attributes: ["id", "usuario", "rol"],
        },
        {
          model: Jugador,
          as: "jugador",
          attributes: ["id", "nombre", "apellido", "posicion"],
        },
      ],
      order: [["fecha", "DESC"]],
    })

    res.status(200).json({
      mensaje: "Registros de pliometría del usuario obtenidos exitosamente",
      data: pliometrias,
    })
  } catch (error) {
    console.error("Error al obtener pliometrías por usuario:", error)
    res.status(500).json({
      mensaje: "Error al obtener los registros de pliometría del usuario",
      error: error.message,
    })
  }
}

// Actualizar un registro de pliometría
export const actualizarPliometria = async (req, res) => {
  try {
    const { id } = req.params
    const { fecha, extensionizquierda, extensionderecha, movimiento } = req.body

    const pliometriaExistente = await Pliometria.findByPk(id)

    if (!pliometriaExistente) {
      return res.status(404).json({ mensaje: "Registro de pliometría no encontrado" })
    }

    await pliometriaExistente.update({
      fecha,
      extensionizquierda,
      extensionderecha,
      movimiento,
    })

    res.status(200).json({
      mensaje: "Registro de pliometría actualizado exitosamente",
      data: pliometriaExistente,
    })
  } catch (error) {
    console.error("Error al actualizar pliometría:", error)
    res.status(500).json({
      mensaje: "Error al actualizar el registro de pliometría",
      error: error.message,
    })
  }
}

// Eliminar un registro de pliometría
export const eliminarPliometria = async (req, res) => {
  try {
    const { id } = req.params

    const pliometria = await Pliometria.findByPk(id)

    if (!pliometria) {
      return res.status(404).json({ mensaje: "Registro de pliometría no encontrado" })
    }

    await pliometria.destroy()

    res.status(200).json({
      mensaje: "Registro de pliometría eliminado exitosamente",
    })
  } catch (error) {
    console.error("Error al eliminar pliometría:", error)
    res.status(500).json({
      mensaje: "Error al eliminar el registro de pliometría",
      error: error.message,
    })
  }
}

export const iniciarPliometria = async (req, res) => {
  try {
    const { idUser } = req.body

    if (!idUser) {
      return res.status(400).json({
        success: false,
        mensaje: "idUser es requerido",
      })
    }

    // Validar que el usuario existe
    const usuario = await Cuenta.findByPk(idUser)
    if (!usuario) {
      return res.status(404).json({
        success: false,
        mensaje: "Usuario no encontrado",
      })
    }

    const nuevaPliometria = await Pliometria.create({
      idUser,
      fecha: new Date(),
      estado: "iniciado",
    })

    res.status(201).json({
      success: true,
      mensaje: "Prueba de pliometría iniciada exitosamente",
      data: nuevaPliometria,
    })
  } catch (error) {
    console.error("Error al iniciar pliometría:", error)
    res.status(500).json({
      success: false,
      mensaje: "Error al iniciar la prueba de pliometría",
      error: error.message,
    })
  }
}

export const finalizarPliometria = async (req, res) => {
  try {
    const { id } = req.params
    const { extensionizquierda, extensionderecha, movimiento } = req.body

    const pliometriaExistente = await Pliometria.findByPk(id)

    if (!pliometriaExistente) {
      return res.status(404).json({
        success: false,
        mensaje: "Registro de pliometría no encontrado",
      })
    }

    if (pliometriaExistente.estado === "finalizado") {
      return res.status(400).json({
        success: false,
        mensaje: "Esta prueba de pliometría ya ha sido finalizada",
      })
    }

    await pliometriaExistente.update({
      extensionizquierda,
      extensionderecha,
      movimiento,
      estado: "finalizado",
    })

    res.status(200).json({
      success: true,
      mensaje: "Prueba de pliometría finalizada exitosamente",
      data: pliometriaExistente,
    })
  } catch (error) {
    console.error("Error al finalizar pliometría:", error)
    res.status(500).json({
      success: false,
      mensaje: "Error al finalizar la prueba de pliometría",
      error: error.message,
    })
  }
}
