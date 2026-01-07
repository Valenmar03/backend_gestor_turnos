// controllers/users.controller.ts
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { User, UserRole } from "../models/User";


export class UserController {

    static async listUsers(req: Request, res: Response) {
        const businessId = req.auth!.businessId;
        
        const users = await User.find({ businessId })
        .select("_id name email role isActive lastLoginAt createdAt")
        .sort({ createdAt: -1 });
        
        res.json(users);
    }

    static async createUser(req: Request, res: Response) {
    const businessId = req.auth!.businessId;
    
    const { name, email, role, password, professionalId } = req.body as {
        name: string;
        email: string;
        role: UserRole;
        password: string;
        professionalId?: string;
    };

    const passwordHash = await bcrypt.hash(password, 10);
    
    const user = await User.create({
        businessId,
        name,
        email: email.toLowerCase().trim(),
        role,
        passwordHash,
        professionalId: professionalId ? new Types.ObjectId(professionalId) : undefined,
        isActive: true,
    });

    res.status(201).json({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
    });
    }

    static async updateUser(req: Request, res: Response) {
        const businessId = req.auth!.businessId;
        const { id } = req.params;
        
        const patch = req.body as Partial<{
            name: string;
            role: UserRole;
            isActive: boolean;
            professionalId?: string | null;
        }>;

        const user = await User.findOne({ _id: id, businessId });
        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
        
        if (typeof patch.name === "string") user.name = patch.name;
        if (typeof patch.role === "string") user.role = patch.role;
        if (typeof patch.isActive === "boolean") user.isActive = patch.isActive;
        
        if ("professionalId" in patch) {
            user.professionalId = patch.professionalId
            ? new Types.ObjectId(patch.professionalId)
            : undefined;
            }
            
            await user.save();
            
            res.json({
                id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
        });
    }

    static async adminResetPassword(req: Request, res: Response) {
        const businessId = req.auth!.businessId;
        const { id } = req.params;
        const { newPassword } = req.body as { newPassword: string };

        const user = await User.findOne({ _id: id, businessId });
        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
        
        user.passwordHash = await bcrypt.hash(newPassword, 10);
        await user.save();
        
        res.json({ ok: true });
        }

}