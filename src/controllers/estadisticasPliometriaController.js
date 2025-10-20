import { Op } from "sequelize"
import { Pliometria } from "../models/Pliometria.js"
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

// 📊 ENDPOINT 1: Estadísticas personales de pliometría de un jugador
export const estadisticasPliometriaPersonales = async (req, res) => {
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

    // Obtener registros de pliometría
    const pliometrias = await Pliometria.findAll({
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

    if (pliometrias.length === 0) {
      return res.json({
        success: true,
        periodo: periodo || "general",
        data: {
          usuario: null,
          total_registros: 0,
          promedios: {
            extensionizquierda: "0.00",
            extensionderecha: "0.00",
            movimiento: "0.00",
          },
        },
      })
    }

    // Calcular estadísticas
    let sumaExtensionIzq = 0
    let sumaExtensionDer = 0
    let sumaMovimiento = 0

    pliometrias.forEach((p) => {
      sumaExtensionIzq += p.extensionizquierda || 0
      sumaExtensionDer += p.extensionderecha || 0
      sumaMovimiento += p.movimiento || 0
    })

    const totalRegistros = pliometrias.length

    const promedios = {
      extensionizquierda: (sumaExtensionIzq / totalRegistros).toFixed(2),
      extensionderecha: (sumaExtensionDer / totalRegistros).toFixed(2),
      movimiento: (sumaMovimiento / totalRegistros).toFixed(2),
    }

    // Información del usuario
    const cuenta = pliometrias[0].cuenta
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
        promedios,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas de pliometría personales",
      error: error.message,
    })
  }
}

// 📊 ENDPOINT 2: Top 10 jugadores con mejores promedios de pliometría
export const top10Pliometria = async (req, res) => {
  try {
    const { periodo, carrera, posicion } = req.body // Filtros opcionales

    // Construir filtros para pliometrías
    const filtrosPliometria = {
      estado: "finalizado",
    }

    const rangoFechas = calcularRangoFechas(periodo)
    if (rangoFechas) {
      filtrosPliometria.fecha = rangoFechas
    }

    // Construir filtros para jugadores
    const filtrosJugador = {}
    if (carrera) filtrosJugador.carrera = carrera
    if (posicion) filtrosJugador.posicion_principal = posicion

    // Obtener todas las pliometrías con filtros
    const pliometrias = await Pliometria.findAll({
      where: filtrosPliometria,
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

    if (pliometrias.length === 0) {
      return res.json({
        success: true,
        periodo: periodo || "general",
        filtros: { carrera: carrera || "todas", posicion: posicion || "todas" },
        data: [],
      })
    }

    // Agrupar pliometrías por jugador
    const jugadoresMap = {}

    pliometrias.forEach((p) => {
      const cuentaId = p.cuentaId

      if (!jugadoresMap[cuentaId]) {
        jugadoresMap[cuentaId] = {
          cuenta: p.cuenta,
          pliometrias: [],
        }
      }

      jugadoresMap[cuentaId].pliometrias.push(p)
    })

    // Calcular estadísticas para cada jugador
    const jugadoresConEstadisticas = Object.values(jugadoresMap).map((j) => {
      const pliometrias = j.pliometrias

      let sumaExtensionIzq = 0
      let sumaExtensionDer = 0
      let sumaMovimiento = 0

      pliometrias.forEach((p) => {
        sumaExtensionIzq += p.extensionizquierda || 0
        sumaExtensionDer += p.extensionderecha || 0
        sumaMovimiento += p.movimiento || 0
      })

      const totalRegistros = pliometrias.length

      const promedios = {
        extensionizquierda: (sumaExtensionIzq / totalRegistros).toFixed(2),
        extensionderecha: (sumaExtensionDer / totalRegistros).toFixed(2),
        movimiento: (sumaMovimiento / totalRegistros).toFixed(2),
      }

      // Calcular promedio general (suma de los 3 promedios)
      const promedioGeneral =
        (Number.parseFloat(promedios.extensionizquierda) +
          Number.parseFloat(promedios.extensionderecha) +
          Number.parseFloat(promedios.movimiento)) /
        3

      return {
        usuario: {
          id: j.cuenta.id,
          usuario: j.cuenta.usuario,
          jugador: j.cuenta.jugador,
        },
        total_registros: totalRegistros,
        promedios,
        // Para ordenar
        _promedioGeneral: promedioGeneral,
      }
    })

    // Ordenar por promedio general (descendente)
    jugadoresConEstadisticas.sort((a, b) => {
      return b._promedioGeneral - a._promedioGeneral
    })

    // Tomar top 10
    const top10 = jugadoresConEstadisticas.slice(0, 10).map((j) => {
      // Eliminar campos auxiliares
      delete j._promedioGeneral
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
      message: "Error al obtener top 10 de pliometría",
      error: error.message,
    })
  }
}
