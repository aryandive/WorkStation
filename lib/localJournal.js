const JOURNAL_KEY = 'ws_journal_entries';

/**
 * Saves a single journal entry for a specific date.
 * @param {string} dateKey - The date in 'YYYY-M-D' format.
 * @param {object} entry - The journal entry object { title, content }.
 */
export function saveLocalJournal(dateKey, entry) {
    try {
        const allJournals = getLocalJournals();
        allJournals[dateKey] = entry;
        localStorage.setItem(JOURNAL_KEY, JSON.stringify(allJournals));
    } catch (error) {
        console.error("Failed to save journal to local storage:", error);
    }
}

/**
 * Retrieves a single journal entry for a specific date.
 * @param {string} dateKey - The date in 'YYYY-M-D' format.
 * @returns {object} The journal entry or an empty object.
 */
export function getLocalJournalByDate(dateKey) {
    try {
        const allJournals = getLocalJournals();
        return allJournals[dateKey] || {};
    } catch (error) {
        console.error("Failed to get journal from local storage:", error);
        return {};
    }
}

/**
 * Retrieves all journal entries.
 * @returns {object} An object with date keys and entry values.
 */
export function getLocalJournals() {
    try {
        const data = localStorage.getItem(JOURNAL_KEY);
        return data ? JSON.parse(data) : {};
    } catch (error) {
        console.error("Failed to get all journals from local storage:", error);
        return {};
    }
}

/**
 * Counts the total number of journal entries in local storage.
 * @returns {number} The total number of entries.
 */
export function countLocalJournals() {
    try {
        const allJournals = getLocalJournals();
        return Object.keys(allJournals).length;
    } catch (error) {
        console.error("Failed to count journals in local storage:", error);
        return 0;
    }
}