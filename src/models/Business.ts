import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBusiness extends Document {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  timezone: string; 
  isActive: boolean;
}

const businessSchema = new Schema<IBusiness>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    timezone: {
      type: String,
      required: true,
      default: 'America/Argentina/Buenos_Aires',
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Business: Model<IBusiness> =
  mongoose.models.Business || mongoose.model<IBusiness>('Business', businessSchema);
