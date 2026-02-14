import db from "../db";
import { CalendarDay, Prisma } from "@prisma/client";

export class CalendarService {
  async getCalendarDays(listingId: string): Promise<CalendarDay[]> {
    return db.calendarDay.findMany({ where: { listingId } });
  }

  async upsertCalendarDay(data: any): Promise<CalendarDay> {
    const { listingId, date, status, source, note } = data;
    const dateObj = new Date(date);
    return db.calendarDay.upsert({
      where: {
        listingId_date: {
          listingId,
          date: dateObj,
        },
      },
      update: {
        status,
        source,
        note,
      },
      create: {
        listingId,
        date: dateObj,
        status,
        source,
        note,
      },
    });
  }

  async deleteCalendarDay(listingId: string, date: Date | string): Promise<void> {
    const dateObj = new Date(date);
    await db.calendarDay.delete({
      where: {
        listingId_date: {
          listingId,
          date: dateObj,
        },
      },
    });
  }
}

export const calendarService = new CalendarService();
