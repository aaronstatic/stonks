import { DateTime } from "luxon";

export declare interface BaseTask {
    (now: DateTime): Promise<boolean>;
}