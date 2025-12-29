import mongoose, { Schema, Document, Model } from 'mongoose';

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type DaySchedule = {
  enabled: boolean;
  startTime: string; // "09:00"
  endTime: string;   // "20:00"
};

export type OpeningHours = Record<DayKey, DaySchedule>;

export interface IBusiness extends Document {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  timezone: string;
  isActive: boolean;

  appointmentIntervalMin: number;
  openingHours: OpeningHours;
}


const dayScheduleSchema = new Schema(
  {
    enabled: { type: Boolean, default: true },
    startTime: { type: String, default: "09:00" },
    endTime: { type: String, default: "20:00" }
  },
  { _id: false }
);

const openingHoursSchema = new Schema(
  {
    mon: { type: dayScheduleSchema, default: () => ({ enabled: true, startTime: "09:00", endTime: "20:00" }) },
    tue: { type: dayScheduleSchema, default: () => ({ enabled: true, startTime: "09:00", endTime: "20:00" }) },
    wed: { type: dayScheduleSchema, default: () => ({ enabled: true, startTime: "09:00", endTime: "20:00" }) },
    thu: { type: dayScheduleSchema, default: () => ({ enabled: true, startTime: "09:00", endTime: "20:00" }) },
    fri: { type: dayScheduleSchema, default: () => ({ enabled: true, startTime: "09:00", endTime: "20:00" }) },
    sat: { type: dayScheduleSchema, default: () => ({ enabled: true, startTime: "10:00", endTime: "14:00" }) },
    sun: { type: dayScheduleSchema, default: () => ({ enabled: false, startTime: "09:00", endTime: "20:00" }) }
  },
  { _id: false }
);

const businessSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },

    timezone: { type: String, default: "America/Argentina/Buenos_Aires" },
    isActive: { type: Boolean, default: true },

    appointmentIntervalMin: { type: Number, default: 30, min: 5 },
    openingHours: { type: openingHoursSchema, default: () => ({}) }
  },
  { timestamps: true }
);


export const Business: Model<IBusiness> =
  mongoose.models.Business || mongoose.model<IBusiness>('Business', businessSchema);
