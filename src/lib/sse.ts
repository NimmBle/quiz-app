type SSEClient = {
    id: string;
    controller: ReadableStreamDefaultController;
};

// Global map to hold SSE clients per quizId.
// Using globalThis prevents hot-reloads in dev from wiping the map.
const globalForSse = globalThis as unknown as {
    sseClients: Map<number, Set<SSEClient>>;
};

const clients = globalForSse.sseClients || new Map<number, Set<SSEClient>>();
globalForSse.sseClients = clients;

export function addSSEClient(quizId: number, client: SSEClient) {
    if (!clients.has(quizId)) {
        clients.set(quizId, new Set());
    }
    clients.get(quizId)!.add(client);
    broadcastPresenceUpdate(quizId);
}

export function removeSSEClient(quizId: number, clientId: string) {
    const quizClients = clients.get(quizId);
    if (quizClients) {
        for (const client of quizClients) {
            if (client.id === clientId) {
                quizClients.delete(client);
                broadcastPresenceUpdate(quizId);
                break;
            }
        }
    }
}

export function getLiveClientCount(quizId: number) {
    return clients.get(quizId)?.size || 0;
}

function broadcastPresenceUpdate(quizId: number) {
    const count = getLiveClientCount(quizId);
    broadcastToQuiz(quizId, "presence_update", { count });
}

export function broadcastToQuiz(quizId: number, eventName: string, data: unknown) {
    const quizClients = clients.get(quizId);
    if (!quizClients) return;

    const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
    const encoder = new TextEncoder();

    for (const client of quizClients) {
        try {
            client.controller.enqueue(encoder.encode(payload));
        } catch (e) {
            // If a client is dead, we catch the error but let the stream close naturally elsewhere
            console.error(`Failed to broadcast to client ${client.id}`, e);
        }
    }
}
