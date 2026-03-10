export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        console.log("Checking database seed status...");

        // Dynamically import the DB so we don't bleed edge runtime incompatibilities
        const { db } = await import("./db");
        const schema = await import("./db/schema");
        const { migrate } = await import("drizzle-orm/postgres-js/migrator");
        const bcrypt = (await import("bcryptjs")).default;

        try {
            console.log("Applying database migrations...");
            await migrate(db, { migrationsFolder: "./drizzle" });

            // 1. Check if an admin exists
            const existingAdmin = await db.query.admin.findFirst();
            if (existingAdmin) {
                console.log("Admin user already exists. Skipping seed.");
                return;
            }

            // 2. Hash default password and create admin
            const defaultPassword = process.env.ADMIN_SEED_PASSWORD;
            if (!defaultPassword) {
                console.warn("⚠️ ADMIN_SEED_PASSWORD is missing in .env.local. Admin profile not seeded.");
                return;
            }

            const passwordHash = await bcrypt.hash(defaultPassword, 10);

            await db.insert(schema.admin).values({
                passwordHash,
            });

            console.log(`✅ Admin seeded successfully!`);
            console.log(`🔑 Default Password: ${defaultPassword}`);
            console.log(`⚠️ Please change this as soon as possible.`);
        } catch (error) {
            console.error("Failed to seed admin user on startup:", error);
        }
    }
}
