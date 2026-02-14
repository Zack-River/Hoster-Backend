import db from "../db";
export class CalendarService {
    async getCalendarDays(listingId) {
        return db.calendarDay.findMany({ where: { listingId } });
    }
    async upsertCalendarDay(data) {
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
    async deleteCalendarDay(listingId, date) {
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
