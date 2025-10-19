import { DataTypes } from "sequelize"
import { sequelize } from "../config/database.js"
import { Cuenta } from "./Cuenta.js"
import { Jugador } from "./Jugador.js"

export const Alcance = sequelize.define(
  "alcances",
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
    tiempodevuelo: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    velocidad: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    potencia: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    alcance: {
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
    tableName: "alcances",
    timestamps: true,
  },
)

// Relaciones
Alcance.belongsTo(Cuenta, { foreignKey: "idUser", as: "cuenta" })
Alcance.belongsTo(Jugador, { foreignKey: "idUser", as: "jugador" })
