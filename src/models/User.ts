import mongoose, { Schema, Types } from "mongoose";

export type UserRole =
  | "owner"
  | "admin"
  | "receptionist"
  | "professional"
  | "viewer";

export interface IUser {
  businessId: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;

  professionalId?: Types.ObjectId;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ["owner", "admin", "receptionist", "professional", "viewer"],
      index: true,
    },
    isActive: { type: Boolean, default: true, index: true },
    professionalId: { type: Schema.Types.ObjectId, ref: "Professional" },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

UserSchema.index({ businessId: 1, email: 1 }, { unique: true });

export const User = mongoose.model<IUser>("User", UserSchema);
