export function calculateStreaks(entries) {
    if (!entries || entries.length === 0) return { current: 0, best: 0 };

    // Get today's local midnight date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayNum = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));

    // Map entries to unique local day numbers, sorted descending
    const entryDays = [...new Set(entries.map(entry => {
        // Parse the date strictly treating it as yyyy-mm-dd
        // We know entry.date format is usually 'YYYY-MM-DD'
        let d;
        if (typeof entry.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
            const [y, m, day] = entry.date.split('-').map(Number);
            d = new Date(y, m - 1, day);
        } else {
            d = new Date(entry.date);
        }
        d.setHours(0, 0, 0, 0); // Normalize to local midnight
        return Math.floor(d.getTime() / (1000 * 60 * 60 * 24)); // Calculate day number
    }))].sort((a, b) => b - a); // Sorted newest to oldest

    if (entryDays.length === 0) return { current: 0, best: 0 };

    let current = 0;
    let best = 0;

    // Calculate current streak
    let prevDay = todayNum;

    // Check if the most recent entry is today or yesterday
    if (entryDays[0] === todayNum || entryDays[0] === todayNum - 1) {
        current = 1;
        prevDay = entryDays[0];

        for (let i = 1; i < entryDays.length; i++) {
            if (entryDays[i] === prevDay - 1) {
                current++;
                prevDay = entryDays[i];
            } else {
                break;
            }
        }
    } else {
        // Most recent entry is older than yesterday
        current = 0;
    }

    // Calculate best streak
    let currentSequence = 1;
    best = 1;
    for (let i = 1; i < entryDays.length; i++) {
        if (entryDays[i] === entryDays[i - 1] - 1) {
            currentSequence++;
            best = Math.max(best, currentSequence);
        } else {
            currentSequence = 1;
        }
    }

    return { current, best };
}
