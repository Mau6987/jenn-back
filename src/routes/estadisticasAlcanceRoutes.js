import express from "express"
import { estadisticasAlcancePersonales, top10Alcance } from "../controllers/estadisticasAlcanceController.js"

const router = express.Router()

// POST /api/estadisticas-alcance/personal - Estadísticas personales de alcance
router.post("/personal", estadisticasAlcancePersonales)

// POST /api/estadisticas-alcance/top10 - Top 10 jugadores con mejor alcance
router.post("/top10", top10Alcance)

export default router
