import { DateTime } from 'luxon';
import { sendToDiscord } from '../lib/discord';

export default async function testDiscord(now: DateTime): Promise<boolean> {
    await sendToDiscord({
        cmd: "msg",
        message: "Testing 123",
        channel: "test"
    });

    return true;
}