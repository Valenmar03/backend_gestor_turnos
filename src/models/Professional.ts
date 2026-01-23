import mongoose, { Schema, Document, Model, Types } from "mongoose";

interface IWorkingHours {
  dayOfWeek: number; // 0=Domingo ... 6=Sábado
  startTime: string; // "09:00"
  endTime: string;   // "18:00"
}

interface ITimeOff {
  start: Date;
  end: Date;
  reason?: string;
}

export interface IProfessional extends Document {
  business: Types.ObjectId;

  userId: Types.ObjectId;

  services: Types.ObjectId[];
  color?: string;
  workingHours: IWorkingHours[];
  timeOff: ITimeOff[];
  allowOverlap: boolean;
}

const workingHoursSchema = new Schema<IWorkingHours>(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { _id: false }
);

const timeOffSchema = new Schema<ITimeOff>(
  {
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    reason: { type: String, trim: true },
  },
  { _id: true }
);

const professionalSchema = new Schema<IProfessional>(
  {
    business: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    services: [{ type: Schema.Types.ObjectId, ref: "Service" }],
    color: { type: String, trim: true },
    workingHours: { type: [workingHoursSchema], default: [] },
    timeOff: { type: [timeOffSchema], default: [] },
    allowOverlap: { type: Boolean, default: false },
  },
  { timestamps: true }
);

professionalSchema.index({ business: 1, userId: 1 }, { unique: true });

export const Professional: Model<IProfessional> =
  mongoose.models.Professional ||
  mongoose.model<IProfessional>("Professional", professionalSchema);
