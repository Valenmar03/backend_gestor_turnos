// controllers/auth.controller.ts
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { signToken } from "../utils/jwt";
import { Business } from "../models/Business";

export class AuthController {

    
    static async login(req: Request, res: Response) {
        const { email, password, businessId } = req.body as {
            email: string;
            password: string;
            businessId: string; // si tu login es multi-business. Si no, lo sacamos.
        };
        
        const user = await User.findOne({
            businessId,
            email: email.toLowerCase().trim(),
            isActive: true,
        });

        if (!user) return res.status(401).json({ message: "Credenciales inválidas" });

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return res.status(401).json({ message: "Credenciales inválidas" });
        
        user.lastLoginAt = new Date();
        await user.save();
        
        const token = signToken({
            sub: user._id.toString(),
            businessId: user.businessId.toString(),
            role: user.role,
        });

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                businessId: user.businessId,
            },
        });
    }

    static async registerOwner(req: Request, res: Response) {
        const { businessName, timezone, ownerName, email, password } = req.body as {
            businessName: string;
            timezone: string;
            ownerName: string;
            email: string;
            password: string;
        };

        const business = await Business.create({
            name: businessName,
            timezone,
            isActive: true,
            appointmentIntervalMin: 30,
            openingHours: {
            mon: { enabled: true, ranges: [{ startTime: "09:00", endTime: "18:00" }] },
            tue: { enabled: true, ranges: [{ startTime: "09:00", endTime: "18:00" }] },
            wed: { enabled: true, ranges: [{ startTime: "09:00", endTime: "18:00" }] },
            thu: { enabled: true, ranges: [{ startTime: "09:00", endTime: "18:00" }] },
            fri: { enabled: true, ranges: [{ startTime: "09:00", endTime: "18:00" }] },
            sat: { enabled: false, ranges: [] },
            sun: { enabled: false, ranges: [] },
            },
        });

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await User.create({
            businessId: business._id,
            name: ownerName,
            email: email.toLowerCase().trim(),
            passwordHash,
            role: "owner",
            isActive: true,
        });

        const token = signToken({
            sub: user._id.toString(),
            businessId: business._id.toString(),
            role: user.role,
        });

        res.status(201).json({
            token,
            business: { id: business._id, name: business.name },
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });
    }
}
