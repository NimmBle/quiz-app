"use server";

import { db } from "@/db";
import { createAdminSession, verifyPassword } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginAction(prevState: unknown, formData: FormData) {
    const password = formData.get("password") as string;

    if (!password) {
        return { error: "Моля, въведете парола." };
    }

    try {
        // We only have 1 admin user, so we just get the first row
        const adminRecord = await db.query.admin.findFirst();

        if (!adminRecord) {
            return { error: "Грешка: Не е намерен администраторски профил." };
        }

        const isValid = await verifyPassword(password, adminRecord.passwordHash);

        if (!isValid) {
            return { error: "Грешна парола." };
        }

        await createAdminSession();
        // Redirect must be outside the try/catch or it will be caught
    } catch (error) {
        console.error("Login error:", error);
        return { error: "Възникна системна грешка." };
    }

    redirect("/admin/dashboard");
}
