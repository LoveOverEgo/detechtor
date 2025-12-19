export function escapeHtml(text: string): string {
    if (!text) return '';

    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

export function truncatePath(path: string, maxLength: number = 30): string {
    if (path.length <= maxLength) return path;

    return '...' + path.substring(path.length - maxLength + 3);
};

export function truncateUrl(url: string, maxLength: number = 40): string {
    if (url.length <= maxLength) return url;

    return url.substring(0, maxLength - 3) + '...';
};

export function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}