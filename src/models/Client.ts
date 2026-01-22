import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IClient extends Document {
  business: Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  isActive: boolean;
}

const clientSchema = new Schema<IClient>(
  {
    business: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    notes: { type: String, trim: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

clientSchema.index(
  { business: 1, email: 1 },
  { unique: true, sparse: true }
);


export const Client: Model<IClient> =
  mongoose.models.Client || mongoose.model<IClient>('Client', clientSchema);
