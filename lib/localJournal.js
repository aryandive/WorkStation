const JOURNAL_KEY = 'ws_journal_entries';

/**
 * Checks if an error is a Storage Quota Exceeded error.
 * @param {Error} e - The error object caught from the try-catch block.
 * @returns {boolean} - True if the error is a quota exceeded error.
 */
function isQuotaExceededError(e) {
    return (
        e instanceof DOMException &&
        (e.code === 22 ||
            e.code === 1014 ||
            e.name === 'QuotaExceededError' ||
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
        (localStorage && localStorage.length !== 0)
    );
}

/**
 * Saves a single journal entry for a specific date.
 * @param {string} dateKey - The date in 'YYYY-M-D' format.
 * @param {object} entry - The journal entry object { title, content }.
 * @returns {boolean} True if successful, false otherwise.
 */
export function saveLocalJournal(dateKey, entry) {
    try {
        const allJournals = getLocalJournals();
        allJournals[dateKey] = entry;
        localStorage.setItem(JOURNAL_KEY, JSON.stringify(allJournals));
        return true;
    } catch (error) {
        if (isQuotaExceededError(error)) {
            console.error("CRITICAL: Local Storage is full. Cannot save journal.");
            
            // Dispatch a custom event so the UI can show a toast without importing UI logic here
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('ws-storage-full'));
            }
        } else {
            console.error("Failed to save journal to local storage:", error);
        }
        return false;
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
        // If JSON parse fails, it usually means data corruption. 
        // We return an empty object to prevent the app from crashing.
        console.error("Failed to parse journals from local storage:", error);
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