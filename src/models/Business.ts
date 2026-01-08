import mongoose, { Schema, Document, Model } from "mongoose";

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type TimeRange = {
  startTime: string; // "08:00"
  endTime: string;   // "13:00"
};

export type DaySchedule = {
  enabled: boolean;
  ranges: TimeRange[]; // 0..n (para almuerzo usás 2)
};

export type OpeningHours = Record<DayKey, DaySchedule>;

export interface IBusiness extends Document {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  timezone: string;
  isActive: boolean;
  ownerUserId: mongoose.Types.ObjectId;
  appointmentIntervalMin: number;
  openingHours: OpeningHours;
}

/** ===== Schemas ===== */

const timeRangeSchema = new Schema(
  {
    startTime: { type: String, required: true },
    endTime: { type: String, required: true }
  },
  { _id: false }
);

const dayScheduleSchema = new Schema(
  {
    enabled: { type: Boolean, default: true },
    ranges: {
      type: [timeRangeSchema],
      default: [
        { startTime: "08:00", endTime: "13:00" },
        { startTime: "14:00", endTime: "19:00" }
      ]
    }
  },
  { _id: false }
);

// helper defaults por día
const defaultWeekRange = () => ({
  enabled: true,
  ranges: [
    { startTime: "08:00", endTime: "13:00" },
    { startTime: "14:00", endTime: "19:00" }
  ]
});

const defaultSaturday = () => ({
  enabled: true,
  ranges: [{ startTime: "10:00", endTime: "14:00" }]
});

const defaultSunday = () => ({
  enabled: false,
  ranges: []
});

const openingHoursSchema = new Schema(
  {
    mon: { type: dayScheduleSchema, default: defaultWeekRange },
    tue: { type: dayScheduleSchema, default: defaultWeekRange },
    wed: { type: dayScheduleSchema, default: defaultWeekRange },
    thu: { type: dayScheduleSchema, default: defaultWeekRange },
    fri: { type: dayScheduleSchema, default: defaultWeekRange },
    sat: { type: dayScheduleSchema, default: defaultSaturday },
    sun: { type: dayScheduleSchema, default: defaultSunday }
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

    ownerUserId: { type: Schema.Types.ObjectId, ref: "User", index: true },

    appointmentIntervalMin: { type: Number, default: 30, min: 5 },
    openingHours: { type: openingHoursSchema, default: () => ({}) }
  },
  { timestamps: true }
);

export const Business: Model<IBusiness> =
  mongoose.models.Business || mongoose.model<IBusiness>("Business", businessSchema);
