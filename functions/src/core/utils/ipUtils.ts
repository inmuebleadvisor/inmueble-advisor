import { CallableRequest } from "firebase-functions/v2/https";

/**
 * Extracts the client's IP address from a Firebase Callable Request.
 * Prioritizes standard proxy headers (X-Forwarded-For) and Cloudflare headers.
 * 
 * Rules for Meta CAPI:
 * - Must be IPv4 or IPv6.
 * - Must NOT be hashed.
 * - Must represent the actual client, not the load balancer.
 * 
 * @param request The CallableRequest object from the cloud function.
 * @param data Optional data object to check for manual overrides (e.g. 'clientIp').
 * @returns The extracted IP address string or undefined if not found.
 */
export const extractClientIp = (request: CallableRequest, data?: any): string | undefined => {
    // 1. Try Cloudflare Header (common if behind CF)
    const cfIp = request.rawRequest.headers['cf-connecting-ip'];
    if (cfIp && typeof cfIp === 'string') {
        return cfIp.trim();
    }

    // 2. Try X-Forwarded-For (Standard for Load Balancers/Firebase Hosting)
    // Format: "client, proxy1, proxy2"
    const forwardedFor = request.rawRequest.headers['x-forwarded-for'];
    if (forwardedFor) {
        const ips = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor).split(',');
        if (ips.length > 0) {
            return ips[0].trim(); // First IP is the client
        }
    }

    // 3. Try standard connection IP
    if (request.rawRequest.ip) {
        return request.rawRequest.ip;
    }

    // 4. Fallback: Check explicit data payload (e.g. sent from Client SDK via ipify)
    // Note: This is less secure as it can be spoofed, but valid fallback for server-to-server calls.
    if (data) {
        if (data.clientIp) return data.clientIp;
        if (data.ip) return data.ip;
    }

    return undefined;
};
