import { DateTime } from 'luxon';
import { sendNotification } from '../lib/pushover';

export default async function testTask(now: DateTime): Promise<boolean> {
    await sendNotification("Testing 123", "64b95a3cf39e602119a91ca3");

    return true;
}