import { Op } from "sequelize"
import { Alcance } from "../models/Alcance.js"
import { Cuenta } from "../models/Cuenta.js"
import { Jugador } from "../models/Jugador.js"

// 📌 Función auxiliar para calcular rango de fechas
const calcularRangoFechas = (periodo) => {
  const ahora = new Date()
  let fechaInicio

  switch (periodo) {
    case "semanal":
      fechaInicio = new Date(ahora)
      fechaInicio.setDate(ahora.getDate() - 7)
      break
    case "mensual":
      fechaInicio = new Date(ahora)
      fechaInicio.setMonth(ahora.getMonth() - 1)
      break
    case "general":
    default:
      return null // Sin filtro de fecha
  }

  return { [Op.between]: [fechaInicio, ahora] }
}

// 📊 ENDPOINT 1: Estadísticas personales de alcance de un jugador
export const estadisticasAlcancePersonales = async (req, res) => {
  try {
    const { idUser, periodo } = req.body // periodo: "semanal" | "mensual" | "general"

    if (!idUser) {
      return res.status(400).json({
        success: false,
        message: "El campo idUser es requerido",
      })
    }

    // Construir filtros
    const filtros = {
      cuentaId: idUser,
      estado: "finalizado",
    }

    const rangoFechas = calcularRangoFechas(periodo)
    if (rangoFechas) {
      filtros.fecha = rangoFechas
    }

    // Obtener registros de alcance
    const alcances = await Alcance.findAll({
      where: filtros,
      include: [
        {
          model: Cuenta,
          as: "cuenta",
          include: [{ model: Jugador, as: "jugador" }],
        },
      ],
      order: [["fecha", "DESC"]],
    })

    if (alcances.length === 0) {
      return res.json({
        success: true,
        periodo: periodo || "general",
        data: {
          usuario: null,
          total_registros: 0,
          mayor_alcance: null,
          promedios: {
            alcance: "0.00",
            tiempodevuelo: "0.00",
            velocidad: "0.00",
            potencia: "0.00",
          },
        },
      })
    }

    // Calcular estadísticas
    let sumaAlcance = 0
    let sumaTiempoVuelo = 0
    let sumaVelocidad = 0
    let sumaPotencia = 0
    let mayorAlcance = alcances[0]

    alcances.forEach((a) => {
      sumaAlcance += a.alcance || 0
      sumaTiempoVuelo += a.tiempodevuelo || 0
      sumaVelocidad += a.velocidad || 0
      sumaPotencia += a.potencia || 0

      if (a.alcance > mayorAlcance.alcance) {
        mayorAlcance = a
      }
    })

    const totalRegistros = alcances.length

    const promedios = {
      alcance: (sumaAlcance / totalRegistros).toFixed(2),
      tiempodevuelo: (sumaTiempoVuelo / totalRegistros).toFixed(2),
      velocidad: (sumaVelocidad / totalRegistros).toFixed(2),
      potencia: (sumaPotencia / totalRegistros).toFixed(2),
    }

    // Información del usuario
    const cuenta = alcances[0].cuenta
    const usuario = {
      id: cuenta.id,
      usuario: cuenta.usuario,
      rol: cuenta.rol,
      jugador: cuenta.jugador || null,
    }

    res.json({
      success: true,
      periodo: periodo || "general",
      data: {
        usuario,
        total_registros: totalRegistros,
        mayor_alcance: {
          id: mayorAlcance.id,
          alcance: mayorAlcance.alcance,
          tiempodevuelo: mayorAlcance.tiempodevuelo,
          velocidad: mayorAlcance.velocidad,
          potencia: mayorAlcance.potencia,
          fecha: mayorAlcance.fecha,
        },
        promedios,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas de alcance personales",
      error: error.message,
    })
  }
}

// 📊 ENDPOINT 2: Top 10 jugadores con mejor alcance
export const top10Alcance = async (req, res) => {
  try {
    const { periodo, carrera, posicion } = req.body // Filtros opcionales

    // Construir filtros para alcances
    const filtrosAlcance = {
      estado: "finalizado",
    }

    const rangoFechas = calcularRangoFechas(periodo)
    if (rangoFechas) {
      filtrosAlcance.fecha = rangoFechas
    }

    // Construir filtros para jugadores
    const filtrosJugador = {}
    if (carrera) filtrosJugador.carrera = carrera
    if (posicion) filtrosJugador.posicion_principal = posicion

    // Obtener todos los alcances con filtros
    const alcances = await Alcance.findAll({
      where: filtrosAlcance,
      include: [
        {
          model: Cuenta,
          as: "cuenta",
          where: { rol: "jugador" }, // Solo jugadores
          include: [
            {
              model: Jugador,
              as: "jugador",
              where: filtrosJugador,
              required: true,
            },
          ],
        },
      ],
    })

    if (alcances.length === 0) {
      return res.json({
        success: true,
        periodo: periodo || "general",
        filtros: { carrera: carrera || "todas", posicion: posicion || "todas" },
        data: [],
      })
    }

    // Agrupar alcances por jugador
    const jugadoresMap = {}

    alcances.forEach((a) => {
      const cuentaId = a.cuentaId

      if (!jugadoresMap[cuentaId]) {
        jugadoresMap[cuentaId] = {
          cuenta: a.cuenta,
          alcances: [],
        }
      }

      jugadoresMap[cuentaId].alcances.push(a)
    })

    // Calcular estadísticas para cada jugador
    const jugadoresConEstadisticas = Object.values(jugadoresMap).map((j) => {
      const alcances = j.alcances

      let sumaAlcance = 0
      let sumaTiempoVuelo = 0
      let sumaVelocidad = 0
      let sumaPotencia = 0
      let mayorAlcance = alcances[0]

      alcances.forEach((a) => {
        sumaAlcance += a.alcance || 0
        sumaTiempoVuelo += a.tiempodevuelo || 0
        sumaVelocidad += a.velocidad || 0
        sumaPotencia += a.potencia || 0

        if (a.alcance > mayorAlcance.alcance) {
          mayorAlcance = a
        }
      })

      const totalRegistros = alcances.length

      const promedios = {
        alcance: (sumaAlcance / totalRegistros).toFixed(2),
        tiempodevuelo: (sumaTiempoVuelo / totalRegistros).toFixed(2),
        velocidad: (sumaVelocidad / totalRegistros).toFixed(2),
        potencia: (sumaPotencia / totalRegistros).toFixed(2),
      }

      return {
        usuario: {
          id: j.cuenta.id,
          usuario: j.cuenta.usuario,
          jugador: j.cuenta.jugador,
        },
        total_registros: totalRegistros,
        mayor_alcance: {
          id: mayorAlcance.id,
          alcance: mayorAlcance.alcance,
          tiempodevuelo: mayorAlcance.tiempodevuelo,
          velocidad: mayorAlcance.velocidad,
          potencia: mayorAlcance.potencia,
          fecha: mayorAlcance.fecha,
        },
        promedios,
        // Para ordenar
        _promedioAlcance: Number.parseFloat(promedios.alcance),
        _mayorAlcance: mayorAlcance.alcance,
      }
    })

    // Ordenar por promedio de alcance (descendente), luego por mayor alcance
    jugadoresConEstadisticas.sort((a, b) => {
      if (b._promedioAlcance !== a._promedioAlcance) {
        return b._promedioAlcance - a._promedioAlcance
      }
      return b._mayorAlcance - a._mayorAlcance
    })

    // Tomar top 10
    const top10 = jugadoresConEstadisticas.slice(0, 10).map((j) => {
      // Eliminar campos auxiliares
      delete j._promedioAlcance
      delete j._mayorAlcance
      return j
    })

    res.json({
      success: true,
      periodo: periodo || "general",
      filtros: {
        carrera: carrera || "todas",
        posicion: posicion || "todas",
      },
      data: top10,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener top 10 de alcance",
      error: error.message,
    })
  }
}
