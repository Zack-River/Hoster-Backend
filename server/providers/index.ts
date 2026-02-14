import type { IProviderAdapter } from "./types";
import { createMockProvider } from "./mock-provider";

type ChannelKey = "AIRBNB" | "BOOKING" | "EXPEDIA" | "TRIPADVISOR";

const providers = new Map<ChannelKey, IProviderAdapter>();

export function getProvider(channelKey: ChannelKey): IProviderAdapter {
  if (!providers.has(channelKey)) {
    providers.set(channelKey, createMockProvider(channelKey));
  }
  return providers.get(channelKey)!;
}

export type { IProviderAdapter } from "./types";
