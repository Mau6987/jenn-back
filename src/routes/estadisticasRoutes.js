import express from "express"
import { estadisticasPersonales, top10Jugadores } from "../controllers/estadisticasController.js"

const router = express.Router()

// POST /api/estadisticas/personal
// Body: { idUser: number, periodo: "semanal" | "mensual" | "general" }
router.post("/personal", estadisticasPersonales)

// POST /api/estadisticas/top10
// Body: { periodo?: "semanal" | "mensual" | "general", carrera?: string, posicion?: string }
router.post("/top10", top10Jugadores)

export default router
