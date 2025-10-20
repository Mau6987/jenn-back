import { Alcance } from "../models/Alcance.js"
import { Cuenta } from "../models/Cuenta.js"
import { Jugador } from "../models/Jugador.js"

// Crear un nuevo registro de alcance
export const crearAlcance = async (req, res) => {
  try {
    const { idUser, tiempodevuelo, velocidad, potencia, fecha, alcance } = req.body

    // Validar que el usuario existe
    const usuario = await Cuenta.findByPk(idUser)
    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" })
    }

    const nuevoAlcance = await Alcance.create({
      idUser,
      tiempodevuelo,
      velocidad,
      potencia,
      fecha,
      alcance,
      estado: "finalizado",
    })

    res.status(201).json({
      mensaje: "Registro de alcance creado exitosamente",
      data: nuevoAlcance,
    })
  } catch (error) {
    console.error("Error al crear alcance:", error)
    res.status(500).json({
      mensaje: "Error al crear el registro de alcance",
      error: error.message,
    })
  }
}

// Obtener todos los registros de alcance
export const obtenerAlcances = async (req, res) => {
  try {
    const alcances = await Alcance.findAll({
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
      mensaje: "Registros de alcance obtenidos exitosamente",
      data: alcances,
    })
  } catch (error) {
    console.error("Error al obtener alcances:", error)
    res.status(500).json({
      mensaje: "Error al obtener los registros de alcance",
      error: error.message,
    })
  }
}

// Obtener un registro de alcance por ID
export const obtenerAlcancePorId = async (req, res) => {
  try {
    const { id } = req.params

    const alcance = await Alcance.findByPk(id, {
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

    if (!alcance) {
      return res.status(404).json({ mensaje: "Registro de alcance no encontrado" })
    }

    res.status(200).json({
      mensaje: "Registro de alcance obtenido exitosamente",
      data: alcance,
    })
  } catch (error) {
    console.error("Error al obtener alcance:", error)
    res.status(500).json({
      mensaje: "Error al obtener el registro de alcance",
      error: error.message,
    })
  }
}

// Obtener registros de alcance por usuario
export const obtenerAlcancesPorUsuario = async (req, res) => {
  try {
    const { idUser } = req.params

    const alcances = await Alcance.findAll({
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
      mensaje: "Registros de alcance del usuario obtenidos exitosamente",
      data: alcances,
    })
  } catch (error) {
    console.error("Error al obtener alcances por usuario:", error)
    res.status(500).json({
      mensaje: "Error al obtener los registros de alcance del usuario",
      error: error.message,
    })
  }
}

// Actualizar un registro de alcance
export const actualizarAlcance = async (req, res) => {
  try {
    const { id } = req.params
    const { tiempodevuelo, velocidad, potencia, fecha, alcance } = req.body

    const alcanceExistente = await Alcance.findByPk(id)

    if (!alcanceExistente) {
      return res.status(404).json({ mensaje: "Registro de alcance no encontrado" })
    }

    await alcanceExistente.update({
      tiempodevuelo,
      velocidad,
      potencia,
      fecha,
      alcance,
    })

    res.status(200).json({
      mensaje: "Registro de alcance actualizado exitosamente",
      data: alcanceExistente,
    })
  } catch (error) {
    console.error("Error al actualizar alcance:", error)
    res.status(500).json({
      mensaje: "Error al actualizar el registro de alcance",
      error: error.message,
    })
  }
}

// Eliminar un registro de alcance
export const eliminarAlcance = async (req, res) => {
  try {
    const { id } = req.params

    const alcance = await Alcance.findByPk(id)

    if (!alcance) {
      return res.status(404).json({ mensaje: "Registro de alcance no encontrado" })
    }

    await alcance.destroy()

    res.status(200).json({
      mensaje: "Registro de alcance eliminado exitosamente",
    })
  } catch (error) {
    console.error("Error al eliminar alcance:", error)
    res.status(500).json({
      mensaje: "Error al eliminar el registro de alcance",
      error: error.message,
    })
  }
}

export const iniciarAlcance = async (req, res) => {
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

    const nuevoAlcance = await Alcance.create({
      idUser,
      fecha: new Date(),
      estado: "iniciado",
    })

    res.status(201).json({
      success: true,
      mensaje: "Prueba de alcance iniciada exitosamente",
      data: nuevoAlcance,
    })
  } catch (error) {
    console.error("Error al iniciar alcance:", error)
    res.status(500).json({
      success: false,
      mensaje: "Error al iniciar la prueba de alcance",
      error: error.message,
    })
  }
}

export const finalizarAlcance = async (req, res) => {
  try {
    const { id } = req.params
    const { tiempodevuelo, velocidad, potencia, alcance } = req.body

    const alcanceExistente = await Alcance.findByPk(id)

    if (!alcanceExistente) {
      return res.status(404).json({
        success: false,
        mensaje: "Registro de alcance no encontrado",
      })
    }

    if (alcanceExistente.estado === "finalizado") {
      return res.status(400).json({
        success: false,
        mensaje: "Esta prueba de alcance ya ha sido finalizada",
      })
    }

    await alcanceExistente.update({
      tiempodevuelo,
      velocidad,
      potencia,
      alcance,
      estado: "finalizado",
    })

    res.status(200).json({
      success: true,
      mensaje: "Prueba de alcance finalizada exitosamente",
      data: alcanceExistente,
    })
  } catch (error) {
    console.error("Error al finalizar alcance:", error)
    res.status(500).json({
      success: false,
      mensaje: "Error al finalizar la prueba de alcance",
      error: error.message,
    })
  }
}
