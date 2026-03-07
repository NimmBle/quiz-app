import { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    const filename = (await params).filename;
    // We use a specific 'data/uploads' folder to safely mount a Railway Volume
    const filePath = path.join(process.cwd(), "data", "uploads", filename);

    try {
        const fileBuffer = await readFile(filePath);

        const ext = path.extname(filename).toLowerCase();
        let mime = "image/jpeg";
        if (ext === ".png") mime = "image/png";
        else if (ext === ".gif") mime = "image/gif";
        else if (ext === ".svg") mime = "image/svg+xml";
        else if (ext === ".webp") mime = "image/webp";

        return new Response(fileBuffer, {
            headers: {
                "Content-Type": mime,
                "Cache-Control": "public, max-age=31536000, immutable", // Cache heavily
            },
        });
    } catch (error) {
        return new Response("Image not found", { status: 404 });
    }
}
