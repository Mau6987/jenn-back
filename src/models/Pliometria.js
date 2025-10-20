import { DataTypes } from "sequelize"
import { sequelize } from "../config/database.js"
import { Cuenta } from "./Cuenta.js"
import { Jugador } from "./Jugador.js"

export const Pliometria = sequelize.define(
  "pliometrias",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    idUser: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "cuentas",
        key: "id",
      },
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    extensionizquierda: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    extensionderecha: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    movimiento: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    estado: {
      type: DataTypes.ENUM("iniciado", "finalizado"),
      allowNull: false,
      defaultValue: "iniciado",
    },
  },
  {
    tableName: "pliometrias",
    timestamps: true,
  },
)

