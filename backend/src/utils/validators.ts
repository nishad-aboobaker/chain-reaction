import DOMPurify from 'isomorphic-dompurify';

/**
 * Validate player name
 */
export function validatePlayerName(name: string): { valid: boolean; error?: string } {
    const trimmed = name.trim();

    if (!trimmed) {
        return { valid: false, error: 'Name cannot be empty' };
    }

    if (trimmed.length < 2 || trimmed.length > 20) {
        return { valid: false, error: 'Name must be 2-20 characters' };
    }

    // Only allow alphanumeric, spaces, dots, underscores, and hyphens
    if (!/^[a-zA-Z0-9\s._-]+$/.test(trimmed)) {
        return { valid: false, error: 'Name contains invalid characters' };
    }

    return { valid: true };
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
    return DOMPurify.sanitize(input.trim(), {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
    });
}

/**
 * Validate environment variables
 */
export function validateEnvironment(): void {
    const requiredVars = ['PORT', 'FRONTEND_URL'];
    const missing: string[] = [];

    for (const varName of requiredVars) {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    }

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Validate PORT is a number
    const port = parseInt(process.env.PORT || '', 10);
    if (isNaN(port) || port < 1 || port > 65535) {
        throw new Error('PORT must be a valid number between 1 and 65535');
    }

    // Validate FRONTEND_URL format
    const frontendUrl = process.env.FRONTEND_URL;
    if (frontendUrl && !frontendUrl.match(/^https?:\/\/.+/)) {
        throw new Error('FRONTEND_URL must be a valid HTTP/HTTPS URL');
    }
}

/**
 * Validate grid coordinates are within bounds
 */
export function validateGridCoordinates(
    row: number,
    col: number,
    maxRows: number,
    maxCols: number
): { valid: boolean; error?: string } {
    if (!Number.isInteger(row) || !Number.isInteger(col)) {
        return { valid: false, error: 'Coordinates must be integers' };
    }

    if (row < 0 || row >= maxRows || col < 0 || col >= maxCols) {
        return { valid: false, error: 'Coordinates out of bounds' };
    }

    return { valid: true };
}
