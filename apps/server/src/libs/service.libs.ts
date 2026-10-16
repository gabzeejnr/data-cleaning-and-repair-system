import { parseNumericValue } from "../utils/parsing.js";

const isNumber = (value: unknown) => parseNumericValue(value) !== null;

export { isNumber }