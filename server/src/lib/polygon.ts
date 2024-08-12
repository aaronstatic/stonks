import { restClient } from "@polygon.io/client-js";

const polygon = restClient(process.env.POLYGON_API_KEY);

export default polygon;

