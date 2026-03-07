import { NextRequest } from "next/server";
import { db } from "@/db";
import { quizzes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { addSSEClient, removeSSEClient } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const slug = (await params).slug;

    const quiz = await db.query.quizzes.findFirst({
        where: eq(quizzes.slug, slug),
    });

    if (!quiz) {
        return new Response("Quiz not found", { status: 404 });
    }

    const clientId = crypto.randomUUID();

    const stream = new ReadableStream({
        start(controller) {
            addSSEClient(quiz.id, { id: clientId, controller });

            // Send initial connection event
            controller.enqueue(new TextEncoder().encode(`event: connected\ndata: ${JSON.stringify({ id: clientId })}\n\n`));

            // Keep connection alive with pings every 15s to prevent timeouts
            const interval = setInterval(() => {
                try {
                    controller.enqueue(new TextEncoder().encode(`event: ping\ndata: "ping"\n\n`));
                } catch {
                    clearInterval(interval);
                }
            }, 15000);

            request.signal.addEventListener("abort", () => {
                clearInterval(interval);
                removeSSEClient(quiz.id, clientId);
            });
        },
        cancel() {
            removeSSEClient(quiz.id, clientId);
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no", // Disables buffering on Nginx/Railway proxies
        },
    });
}
