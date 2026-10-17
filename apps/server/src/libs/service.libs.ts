import { parseNumericValue } from "../utils/index.js";

const isNumber = (value: unknown) => parseNumericValue(value) !== null;

export { isNumber }