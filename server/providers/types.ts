export interface ExternalListing {
  externalListingId: string;
  name: string;
}

export interface ExternalReservation {
  externalReservationId: string;
  externalListingId: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  status: "INQUIRY" | "CONFIRMED" | "CANCELED" | "CHECKED_IN" | "CHECKED_OUT" | "PENDING" | "REJECTED";
  totalAmount?: string;
  currency?: string;
}

export interface ExternalMessage {
  externalThreadId: string;
  externalListingId: string;
  externalReservationId?: string;
  guestName: string;
  channelMessageId: string;
  direction: "INBOUND" | "OUTBOUND";
  body: string;
  sentAt: Date;
}

export interface SyncResult {
  listings: ExternalListing[];
  reservations: ExternalReservation[];
  messages: ExternalMessage[];
  newCursor: string;
}

export interface IProviderAdapter {
  listListings(userId: string): Promise<ExternalListing[]>;
  listReservations(userId: string, sinceCursor: string | null): Promise<{ reservations: ExternalReservation[]; newCursor: string }>;
  listMessages(userId: string, sinceCursor: string | null): Promise<{ messages: ExternalMessage[]; newCursor: string }>;
  pushCalendarBlock(externalListingId: string, dateRange: { start: string; end: string }, block: boolean): Promise<boolean>;
  sendMessage(externalThreadId: string, body: string): Promise<{ channelMessageId: string; success: boolean }>;
}
