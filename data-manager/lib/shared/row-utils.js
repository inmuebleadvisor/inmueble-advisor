
import { cleanStr, cleanNum, cleanPhone, cleanEmail, parsePipes, parseHitos } from './normalization.js';

/**
 * Retrieves the first non-empty value from a row checking multiple keys.
 * @param {object} row - The data row.
 * @param {string[]} keys - List of keys to check in order.
 * @returns {any|undefined} - The found value or undefined.
 */
export const getValue = (row, keys) => {
    if (!row || !keys) return undefined;
    for (const key of keys) {
        const val = row[key];
        if (val !== undefined && val !== null && val !== '') {
            return val;
        }
    }
    return undefined;
};

export const getStr = (row, keys) => cleanStr(getValue(row, keys));
export const getNum = (row, keys) => cleanNum(getValue(row, keys));
export const getPhone = (row, keys) => cleanPhone(getValue(row, keys));
export const getEmail = (row, keys) => cleanEmail(getValue(row, keys));
export const getPipes = (row, keys) => parsePipes(getValue(row, keys));
export const getHitos = (row, keys) => parseHitos(getValue(row, keys));
