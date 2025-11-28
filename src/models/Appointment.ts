import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed';

export interface IAppointment extends Document {
  business: Types.ObjectId;
  service: Types.ObjectId;
  professional: Types.ObjectId;
  client: Types.ObjectId;
  start: Date;
  end: Date;
  status: AppointmentStatus;
  notes?: string;
  source?: 'manual' | 'online';
}

const appointmentSchema = new Schema<IAppointment>(
  {
    business: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    professional: {
      type: Schema.Types.ObjectId,
      ref: 'Professional',
      required: true
    },
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'confirmed'
    },
    notes: { type: String, trim: true },
    source: { type: String, enum: ['manual', 'online'], default: 'manual' }
  },
  { timestamps: true }
);

export const Appointment: Model<IAppointment> =
  mongoose.models.Appointment ||
  mongoose.model<IAppointment>('Appointment', appointmentSchema);
