import express from "express"
import { estadisticasPliometriaPersonales, top10Pliometria } from "../controllers/estadisticasPliometriaController.js"

const router = express.Router()

// POST /api/estadisticas-pliometria/personal - Estadísticas personales de pliometría
router.post("/personal", estadisticasPliometriaPersonales)

// POST /api/estadisticas-pliometria/top10 - Top 10 jugadores con mejores promedios
router.post("/top10", top10Pliometria)

export default router
