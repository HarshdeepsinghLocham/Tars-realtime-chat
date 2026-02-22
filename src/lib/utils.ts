/**
 * Format message timestamp for display.
 * - Today: time only (2:34 PM)
 * - Older: date + time (Feb 15, 2:34 PM)
 * - Different year: include year (Jan 3, 2024, 2:34 PM)
 */
export function formatMessageTime(creationTime: number): string {
    const d = new Date(creationTime);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (msgDate.getTime() === today.getTime()) {
        return d.toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    }
    const sameYear = d.getFullYear() === now.getFullYear();
    const datePart = sameYear
        ? d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
        : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    const timePart = d.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
    return `${datePart}, ${timePart}`;
}
