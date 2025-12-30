import { DataTypes } from "sequelize";
import { sequelize } from "../db/index.js";
import bcrypt from "bcrypt";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    avatarUrl: {
      type: DataTypes.STRING(2048),
      allowNull: true,
    },
    provider: {
      type: DataTypes.ENUM("local", "google", "facebook", "instagram"),
      allowNull: false,
      defaultValue: "local",
    },
    providerId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phoneNo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM("admin", "shop_owner", "shop_manager", "shop_worker"),
      defaultValue: "shop_owner",
    },
    status: {
      type: DataTypes.ENUM("active", "invited", "disabled"),
      defaultValue: "active",
    },
    refreshTokens: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    refreshTokenExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // ✅ REMOVED: socialId, socialProvider (DB me nahi hai)

    passwordResetToken: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "passwordResetToken",
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "passwordResetExpires",
    },
    avatar: {
      type: DataTypes.STRING(2048),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    timezone: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: "Asia/Kolkata",
    },
    language: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "en",
    },
    notificationPreferences: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    twoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    twoFactorSecret: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "users",
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (!user.password) return;

        if (user.password && !user.password.startsWith("social_")) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password") && user.password && !user.password.startsWith("social_")) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
    },
  }
);

// Instance method (safe)
User.prototype.isPasswordCorrect = async function (password) {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

export { User };
