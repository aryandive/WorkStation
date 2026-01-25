// lib/api-error.js
import { NextResponse } from 'next/server';

/**
 * Standardized Error Codes for consistent frontend handling.
 */
export const ERROR_CODES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AUTH_REQUIRED: 'AUTH_REQUIRED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    PAYMENT_FAILED: 'PAYMENT_FAILED',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
};

/**
 * Custom Error class to throw known, safe-to-expose errors.
 * Usage: throw new APIError('Plan ID is required', 400, ERROR_CODES.VALIDATION_ERROR);
 */
export class APIError extends Error {
    constructor(message, status = 500, code = ERROR_CODES.INTERNAL_ERROR) {
        super(message);
        this.status = status;
        this.code = code;
        this.name = 'APIError';
    }
}

/**
 * Centralized error handler for API Routes.
 * Catches both known APIErrors and unexpected system errors.
 * * @param {Error} error - The caught error object.
 * @returns {NextResponse} - A standardized JSON response.
 */
export function handleAPIError(error) {
    // 1. If it's a known error we threw intentionally
    if (error instanceof APIError) {
        return NextResponse.json(
            {
                success: false,
                error: {
                    message: error.message,
                    code: error.code,
                },
            },
            { status: error.status }
        );
    }

    // 2. If it's an unexpected system error (Crash, DB down, etc.)
    console.error('💥 UNEXPECTED SERVER ERROR:', error); // Replace with Sentry/Logger later

    return NextResponse.json(
        {
            success: false,
            error: {
                message: 'An unexpected error occurred. Please try again later.',
                code: ERROR_CODES.INTERNAL_ERROR,
                // In dev mode, we can leak the real error for easier debugging
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
        },
        { status: 500 }
    );
}