import { createMockProvider } from "./mock-provider";
const providers = new Map();
export function getProvider(channelKey) {
    if (!providers.has(channelKey)) {
        providers.set(channelKey, createMockProvider(channelKey));
    }
    return providers.get(channelKey);
}
