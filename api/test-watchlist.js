import { createClient } from '@vercel/kv';
//Triggering a new deployment
export default async function handler(request, response) {
    console.log("[TEST] Watchlist test endpoint initiated.");

    const kv_url = process.env.KV_REST_API_URL;
    const kv_token = process.env.KV_REST_API_TOKEN;

    if (!kv_url || !kv_token) {
        const errorMessage = "CRITICAL: Environment variables KV_REST_API_URL or KV_REST_API_TOKEN are missing.";
        console.error(errorMessage);
        return response.status(500).json({ step: "env_check", success: false, message: errorMessage });
    }
    console.log("[TEST] Environment variables found.");

    let kv;
    try {
        kv = createClient({ url: kv_url, token: kv_token });
        console.log("[TEST] KV client created successfully.");
    } catch (error) {
        const errorMessage = "CRITICAL: Failed to create KV client.";
        console.error(errorMessage, error);
        return response.status(500).json({ step: "client_creation", success: false, message: errorMessage, error: error.message });
    }

    try {
        console.log("[TEST] Attempting to read from database with key: user:main_watchlist");
        const watchlist = await kv.lrange('user:main_watchlist', 0, -1);
        console.log("[TEST] Successfully read from database. Data:", watchlist);
        return response.status(200).json({ step: "db_read", success: true, data: watchlist || [] });
    } catch (error) {
        const errorMessage = "CRITICAL: Failed to read from database.";
        console.error(errorMessage, error);
        return response.status(500).json({ step: "db_read", success: false, message: errorMessage, error: error.message });
    }
}
