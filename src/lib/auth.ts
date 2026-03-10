import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const secretKey = process.env.JWT_SECRET || "default_super_secret_key_for_quiz";
const key = new TextEncoder().encode(secretKey);

async function hashPassword(password: string) {
    return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
    return await bcrypt.compare(password, hash);
}

// --- Admin Auth ---

export async function createAdminSession() {
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
    const session = await new SignJWT({ role: "admin" })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("1d")
        .sign(key);

    const cookieStore = await cookies();
    cookieStore.set("admin_session", session, {
        expires,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
    });
}

export async function getAdminSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get("admin_session")?.value;
    if (!session) return null;

    try {
        const { payload } = await jwtVerify(session, key, { algorithms: ["HS256"] });
        return payload;
    } catch {
        return null;
    }
}

export async function destroyAdminSession() {
    const cookieStore = await cookies();
    cookieStore.delete("admin_session");
}

// --- Player Auth ---

type PlayerSessionPayload = {
    playerId: number;
    quizId: number;
    teamId: number | null;
    isCaptain: boolean;
};

export async function createPlayerSession(payload: PlayerSessionPayload) {
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const session = await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(key);

    const cookieStore = await cookies();
    cookieStore.set(`player_session_${payload.quizId}`, session, {
        expires,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
    });
}

export async function getPlayerSession(quizId: number): Promise<PlayerSessionPayload | null> {
    const cookieStore = await cookies();
    const session = cookieStore.get(`player_session_${quizId}`)?.value;
    if (!session) return null;

    try {
        const { payload } = await jwtVerify(session, key, { algorithms: ["HS256"] });
        return payload as PlayerSessionPayload;
    } catch {
        return null;
    }
}

async function destroyPlayerSession(quizId: number) {
    const cookieStore = await cookies();
    cookieStore.delete(`player_session_${quizId}`);
}
