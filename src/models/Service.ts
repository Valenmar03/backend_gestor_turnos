import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IService extends Document {
  business: Types.ObjectId;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  category?: string; 
  color?: string;    
  isActive: boolean;
}

const serviceSchema = new Schema<IService>(
{
    business: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    durationMinutes: { type: Number, required: true, min: 5 },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, trim: true },
    color: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
},
{ timestamps: true }
);

export const Service: Model<IService> =
  mongoose.models.Service || mongoose.model<IService>('Service', serviceSchema);
