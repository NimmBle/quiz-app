import { loadEnvConfig } from "@next/env";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function main() {
    console.log("Seeding database...");

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("DATABASE_URL is missing in .env.local");
    }

    const client = postgres(connectionString);
    const db = drizzle(client, { schema });

    // 1. Check if an admin exists
    const existingAdmin = await db.query.admin.findFirst();
    if (existingAdmin) {
        console.log("Admin user already exists. Skipping seed.");
        process.exit(0);
    }

    // 2. Hash default password and create admin
    const defaultPassword = "[REDACTED]";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    await db.insert(schema.admin).values({
        passwordHash,
    });

    console.log(`✅ Admin seeded successfully!`);
    console.log(`🔑 Default Password: ${defaultPassword}`);
    console.log(`⚠️ Please change this as soon as possible.`);

    process.exit(0);
}

main().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
});
