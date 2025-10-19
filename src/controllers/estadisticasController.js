import { Op } from "sequelize"
import { Prueba } from "../models/Prueba.js"
import { Cuenta } from "../models/Cuenta.js"
import { Jugador } from "../models/Jugador.js"
import { Entrenador } from "../models/Entrenador.js"
import { Tecnico } from "../models/Tecnico.js"

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

// 📌 Función auxiliar para calcular estadísticas por tipo
const calcularEstadisticasPorTipo = (pruebas) => {
  const tipos = ["manual", "secuencial", "aleatorio"]
  const estadisticasPorTipo = {}

  tipos.forEach((tipo) => {
    const pruebasTipo = pruebas.filter((p) => p.tipo === tipo)

    if (pruebasTipo.length === 0) {
      estadisticasPorTipo[tipo] = {
        cantidad_pruebas: 0,
        total_intentos: 0,
        total_aciertos: 0,
        total_errores: 0,
        porcentaje_acierto: "0.00",
        porcentaje_error: "0.00",
      }
      return
    }

    let totalIntentos = 0
    let totalAciertos = 0
    let totalErrores = 0

    pruebasTipo.forEach((p) => {
      const aciertos = p.cantidad_aciertos || 0
      const errores = p.cantidad_errores || 0
      const intentos = p.cantidad_intentos || aciertos + errores

      totalAciertos += aciertos
      totalErrores += errores
      totalIntentos += intentos
    })

    estadisticasPorTipo[tipo] = {
      cantidad_pruebas: pruebasTipo.length,
      total_intentos: totalIntentos,
      total_aciertos: totalAciertos,
      total_errores: totalErrores,
      porcentaje_acierto: totalIntentos > 0 ? ((totalAciertos / totalIntentos) * 100).toFixed(2) : "0.00",
      porcentaje_error: totalIntentos > 0 ? ((totalErrores / totalIntentos) * 100).toFixed(2) : "0.00",
    }
  })

  return estadisticasPorTipo
}

// 📌 Función auxiliar para encontrar la mejor prueba
const encontrarMejorPrueba = (pruebas) => {
  if (pruebas.length === 0) return null

  let mejorPrueba = null
  let mejorPorcentaje = -1

  pruebas.forEach((p) => {
    const intentos = p.cantidad_intentos || 0
    const aciertos = p.cantidad_aciertos || 0

    if (intentos > 0) {
      const porcentaje = (aciertos / intentos) * 100
      if (porcentaje > mejorPorcentaje) {
        mejorPorcentaje = porcentaje
        mejorPrueba = p
      }
    }
  })

  if (!mejorPrueba) return null

  const intentos = mejorPrueba.cantidad_intentos || 0
  const aciertos = mejorPrueba.cantidad_aciertos || 0
  const errores = mejorPrueba.cantidad_errores || 0

  return {
    id: mejorPrueba.id,
    tipo: mejorPrueba.tipo,
    fecha: mejorPrueba.fecha,
    intentos,
    aciertos,
    errores,
    porcentaje_acierto: intentos > 0 ? ((aciertos / intentos) * 100).toFixed(2) : "0.00",
    tiempo_inicio: mejorPrueba.tiempo_inicio,
    tiempo_fin: mejorPrueba.tiempo_fin,
  }
}

// 📊 ENDPOINT 1: Estadísticas personales de un usuario
export const estadisticasPersonales = async (req, res) => {
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
      estado: "finalizada",
    }

    const rangoFechas = calcularRangoFechas(periodo)
    if (rangoFechas) {
      filtros.fecha = rangoFechas
    }

    // Obtener pruebas
    const pruebas = await Prueba.findAll({
      where: filtros,
      include: [
        {
          model: Cuenta,
          as: "cuenta",
          include: [
            { model: Jugador, as: "jugador" },
            { model: Entrenador, as: "entrenador" },
            { model: Tecnico, as: "tecnico" },
          ],
        },
      ],
    })

    if (pruebas.length === 0) {
      return res.json({
        success: true,
        periodo: periodo || "general",
        data: {
          usuario: null,
          estadisticas_generales: {
            total_pruebas: 0,
            total_intentos: 0,
            total_aciertos: 0,
            total_errores: 0,
            porcentaje_acierto_total: "0.00",
            porcentaje_error_total: "0.00",
          },
          estadisticas_por_tipo: {},
          mejor_prueba: null,
        },
      })
    }

    // Calcular estadísticas generales
    let totalIntentos = 0
    let totalAciertos = 0
    let totalErrores = 0

    pruebas.forEach((p) => {
      const aciertos = p.cantidad_aciertos || 0
      const errores = p.cantidad_errores || 0
      const intentos = p.cantidad_intentos || aciertos + errores

      totalAciertos += aciertos
      totalErrores += errores
      totalIntentos += intentos
    })

    const estadisticasGenerales = {
      total_pruebas: pruebas.length,
      total_intentos: totalIntentos,
      total_aciertos: totalAciertos,
      total_errores: totalErrores,
      porcentaje_acierto_total: totalIntentos > 0 ? ((totalAciertos / totalIntentos) * 100).toFixed(2) : "0.00",
      porcentaje_error_total: totalIntentos > 0 ? ((totalErrores / totalIntentos) * 100).toFixed(2) : "0.00",
    }

    // Calcular estadísticas por tipo
    const estadisticasPorTipo = calcularEstadisticasPorTipo(pruebas)

    // Encontrar mejor prueba
    const mejorPrueba = encontrarMejorPrueba(pruebas)

    // Información del usuario
    const cuenta = pruebas[0].cuenta
    const usuario = {
      id: cuenta.id,
      usuario: cuenta.usuario,
      rol: cuenta.rol,
      jugador: cuenta.jugador || null,
      entrenador: cuenta.entrenador || null,
      tecnico: cuenta.tecnico || null,
    }

    res.json({
      success: true,
      periodo: periodo || "general",
      data: {
        usuario,
        estadisticas_generales: estadisticasGenerales,
        estadisticas_por_tipo: estadisticasPorTipo,
        mejor_prueba: mejorPrueba,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas personales",
      error: error.message,
    })
  }
}

// 📊 ENDPOINT 2: Top 10 jugadores con mejores estadísticas
export const top10Jugadores = async (req, res) => {
  try {
    const { periodo, carrera, posicion } = req.body // Filtros opcionales

    // Construir filtros para pruebas
    const filtrosPruebas = {
      estado: "finalizada",
    }

    const rangoFechas = calcularRangoFechas(periodo)
    if (rangoFechas) {
      filtrosPruebas.fecha = rangoFechas
    }

    // Construir filtros para jugadores
    const filtrosJugador = {}
    if (carrera) filtrosJugador.carrera = carrera
    if (posicion) filtrosJugador.posicion_principal = posicion

    // Obtener todas las pruebas con filtros
    const pruebas = await Prueba.findAll({
      where: filtrosPruebas,
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

    if (pruebas.length === 0) {
      return res.json({
        success: true,
        periodo: periodo || "general",
        filtros: { carrera: carrera || "todas", posicion: posicion || "todas" },
        data: [],
      })
    }

    // Agrupar pruebas por jugador
    const jugadoresMap = {}

    pruebas.forEach((p) => {
      const cuentaId = p.cuentaId

      if (!jugadoresMap[cuentaId]) {
        jugadoresMap[cuentaId] = {
          cuenta: p.cuenta,
          pruebas: [],
        }
      }

      jugadoresMap[cuentaId].pruebas.push(p)
    })

    // Calcular estadísticas para cada jugador
    const jugadoresConEstadisticas = Object.values(jugadoresMap).map((j) => {
      const pruebas = j.pruebas

      // Estadísticas generales
      let totalIntentos = 0
      let totalAciertos = 0
      let totalErrores = 0

      pruebas.forEach((p) => {
        const aciertos = p.cantidad_aciertos || 0
        const errores = p.cantidad_errores || 0
        const intentos = p.cantidad_intentos || aciertos + errores

        totalAciertos += aciertos
        totalErrores += errores
        totalIntentos += intentos
      })

      const estadisticasGenerales = {
        total_pruebas: pruebas.length,
        total_intentos: totalIntentos,
        total_aciertos: totalAciertos,
        total_errores: totalErrores,
        porcentaje_acierto_total: totalIntentos > 0 ? ((totalAciertos / totalIntentos) * 100).toFixed(2) : "0.00",
        porcentaje_error_total: totalIntentos > 0 ? ((totalErrores / totalIntentos) * 100).toFixed(2) : "0.00",
      }

      // Estadísticas por tipo
      const estadisticasPorTipo = calcularEstadisticasPorTipo(pruebas)

      // Mejor prueba
      const mejorPrueba = encontrarMejorPrueba(pruebas)

      return {
        usuario: {
          id: j.cuenta.id,
          usuario: j.cuenta.usuario,
          jugador: j.cuenta.jugador,
        },
        estadisticas_generales: estadisticasGenerales,
        estadisticas_por_tipo: estadisticasPorTipo,
        mejor_prueba: mejorPrueba,
        // Para ordenar
        _porcentajeAcierto: Number.parseFloat(estadisticasGenerales.porcentaje_acierto_total),
        _totalAciertos: totalAciertos,
      }
    })

    // Ordenar por porcentaje de acierto (descendente), luego por total de aciertos
    jugadoresConEstadisticas.sort((a, b) => {
      if (b._porcentajeAcierto !== a._porcentajeAcierto) {
        return b._porcentajeAcierto - a._porcentajeAcierto
      }
      return b._totalAciertos - a._totalAciertos
    })

    // Tomar top 10
    const top10 = jugadoresConEstadisticas.slice(0, 10).map((j) => {
      // Eliminar campos auxiliares
      delete j._porcentajeAcierto
      delete j._totalAciertos
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
      message: "Error al obtener top 10 jugadores",
      error: error.message,
    })
  }
}
