import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { User, hashPassword } from "../models/User";

async function main() {
  await connectDB();

  const email = process.env.SYS_ADMIN_EMAIL;
  const password = process.env.SYS_ADMIN_PASSWORD;
  const name = process.env.SYS_ADMIN_NAME || "System Admin";
  const phone = process.env.SYS_ADMIN_PHONE

  if (!email || !password || !phone) {
    throw new Error("Faltan SYS_ADMIN_EMAIL, SYS_ADMIN_PASSWORD o SYS_ADMIN_PHONE en el .env");
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    console.log("SYS_ADMIN ya existe:", existing.email);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await hashPassword(password);

  const user = await User.create({
    name,
    email: email.toLowerCase().trim(),
    passwordHash,
    role: "SYS_ADMIN",
    isActive: true,
    isBookable: false,
    phone: phone
  });

  console.log("SYS_ADMIN creado:", {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    phone: user.phone
  });

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
