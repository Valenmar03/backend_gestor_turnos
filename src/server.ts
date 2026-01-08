import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db";

import businessRoutes from "./routes/businessRoutes";
import servicesRoutes from "./routes/serviceRoutes";
import professionalRoutes from "./routes/professionalRoutes";
import clientRoutes from "./routes/clientRoutes";
import appointmentRoutes from "./routes/appointmentRoutes";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";


dotenv.config();
connectDB();

const app = express();

app.use(
    cors({
        origin: ["http://localhost:5173"],
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: false,
    })
);

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// ROUTES
app.use("/api/business", businessRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/professionals", professionalRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

export default app;
