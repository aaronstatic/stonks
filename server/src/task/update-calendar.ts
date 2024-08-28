import { sendToDiscord } from "../lib/discord";
import db from "../lib/mongo";
import { sendNotification } from "../lib/pushover";
import { DateTime } from "luxon";

export default async function updateCalendar(now: DateTime): Promise<boolean> {
    const collection = db.collection("calendar");

    //Do ASX once a day at 10am Melbourne time
    const nowAU = now.setZone("Australia/Melbourne");

    if (nowAU.weekday < 6 && nowAU.hour == 10 && nowAU.minute == 0) {
        const calendarAU = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json');
        const eventsAU = await calendarAU.json();

        let todayEventTextAU = "ASX Market is open. Important Events Today:";
        let gotEventsAU = false;

        todayEventTextAU += "\n\n";

        for (const event of eventsAU) {
            if ((event.impact === 'High' || event.impact === "Medium") && event.country === 'AUD') {
                const date = DateTime.fromISO(event.date).toJSDate();

                //if in the next 24 hrs
                if (date > nowAU.toJSDate() && date < nowAU.plus({ days: 1 }).toJSDate()) {
                    //get time text in melbourne timezone
                    const time = DateTime.fromISO(event.date).setZone("Australia/Melbourne").toLocaleString(DateTime.TIME_SIMPLE);

                    let eventText = `${event.title}`;
                    if (event.forecast != "") {
                        eventText += ` - Forecast: ${event.forecast}`;
                    }
                    if (event.previous != "") {
                        eventText += ` Prev: ${event.previous}`;
                    }
                    eventText += "\n";

                    todayEventTextAU += `${time} - ${eventText}`;
                    gotEventsAU = true;
                }
            }
        }

        if (gotEventsAU) {
            await sendNotification(todayEventTextAU);
        }
    }

    //Do USA events once a day at pre-market open NY time
    now = now.setZone("America/New_York");
    if (now.weekday < 6 && now.hour == 4 && now.minute == 0) {
        const calendar = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json');
        const events = await calendar.json();

        let todayEventText = "Pre-Market is Open. Important Events Today:";
        let gotEvents = false;

        let todayEventNY = "**" + todayEventText + "**";

        todayEventText += "\n\n";
        todayEventNY += "\n\n";

        for (const event of events) {
            if ((event.impact === 'High' || event.impact === "Medium") && event.country === 'USD') {
                const date = DateTime.fromISO(event.date).toJSDate();

                //if in the next 24 hrs
                if (date > now.toJSDate() && date < now.plus({ days: 1 }).toJSDate()) {
                    //get time text in melbourne timezone
                    const time = DateTime.fromISO(event.date).setZone("Australia/Melbourne").toLocaleString(DateTime.TIME_SIMPLE);

                    let eventText = `${event.title}`;
                    if (event.forecast != "") {
                        eventText += ` - Forecast: ${event.forecast}`;
                    }
                    if (event.previous != "") {
                        eventText += ` Prev: ${event.previous}`;
                    }
                    eventText += "\n";

                    todayEventText += `${time} - ${eventText}`;
                    gotEvents = true;

                    //get time text in NY timezone
                    const timeNY = DateTime.fromISO(event.date).setZone("America/New_York").toLocaleString(DateTime.TIME_SIMPLE);
                    todayEventNY += `**${timeNY}**: ${eventText}`;
                }
            }
        }

        if (gotEvents) {
            await sendNotification(todayEventText);

            await sendToDiscord({
                cmd: "msg",
                channel: "macro",
                message: todayEventNY
            })
        } else {
            await sendToDiscord({
                cmd: "msg",
                channel: "macro",
                message: "Pre-market is open. No important events today"
            })
        }
    }

    return true;
}
