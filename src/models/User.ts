import mongoose, { Schema, Model, Document } from "mongoose";
import bcrypt from "bcryptjs";

export const USER_ROLES = [
  "SYS_ADMIN",
  "OWNER",
  "BADMIN",
  "PROFESSIONAL",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface IUser extends Document {
  // SYS_ADMIN no requiere business
  businessId?: mongoose.Types.ObjectId;

  role: UserRole;

  name: string;
  email: string;
  passwordHash: string;

  isActive: boolean;
  lastLoginAt?: Date;

  // profesional visible en agenda
  isBookable: boolean;

  comparePassword(plain: string): Promise<boolean>;
}

/** ===== Schema ===== */
const userSchema = new Schema<IUser>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      index: true,
    },

    role: {
      type: String,
      enum: USER_ROLES,
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLoginAt: {
      type: Date,
    },

    isBookable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);


userSchema.pre("validate", function () {
  if (this.role !== "SYS_ADMIN" && !this.businessId) {
    // Esto hace que falle la validación de Mongoose como corresponde
    this.invalidate(
      "businessId",
      "businessId es obligatorio para OWNER, BADMIN y PROFESSIONAL"
    );
  }
});



userSchema.methods.comparePassword = async function (plain: string) {
  return bcrypt.compare(plain, this.passwordHash);
};

export async function hashPassword(plain: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);
