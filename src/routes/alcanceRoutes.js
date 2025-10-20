import express from "express"
import {
  iniciarAlcance,
  finalizarAlcance,
  crearAlcance,
  obtenerAlcances,
  obtenerAlcancePorId,
  obtenerAlcancesPorUsuario,
  actualizarAlcance,
  eliminarAlcance,
} from "../controllers/alcanceController.js"

const router = express.Router()

router.post("/iniciar", iniciarAlcance)
router.put("/finalizar/:id", finalizarAlcance)

// Rutas CRUD para Alcance
router.post("/", crearAlcance)
router.get("/", obtenerAlcances)
router.get("/:id", obtenerAlcancePorId)
router.get("/usuario/:idUser", obtenerAlcancesPorUsuario)
router.put("/:id", actualizarAlcance)
router.delete("/:id", eliminarAlcance)

export default router
