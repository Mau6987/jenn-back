import express from "express"
import {
  iniciarPliometria,
  finalizarPliometria,
  crearPliometria,
  obtenerPliometrias,
  obtenerPliometriaPorId,
  obtenerPliometriasPorUsuario,
  actualizarPliometria,
  eliminarPliometria,
} from "../controllers/PliometriaController.js"

const router = express.Router()

router.post("/iniciar", iniciarPliometria)
router.put("/finalizar/:id", finalizarPliometria)

// Rutas CRUD para Pliometría
router.post("/", crearPliometria)
router.get("/", obtenerPliometrias)
router.get("/:id", obtenerPliometriaPorId)
router.get("/usuario/:idUser", obtenerPliometriasPorUsuario)
router.put("/:id", actualizarPliometria)
router.delete("/:id", eliminarPliometria)

export default router
