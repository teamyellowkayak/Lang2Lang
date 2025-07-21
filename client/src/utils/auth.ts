// client/src/utils/auth.ts

import { API_BASE_URL } from '../config'; 
const PASSWORD_STORAGE_KEY = "lang2lang_access_password";

/**
 * Attempts to authenticate the user with the provided password against the backend.
 * If successful, stores the password in localStorage.
 * @param password The password entered by the user.
 * @returns {boolean} True if authentication was successful, false otherwise.
 */
export async function authenticateApp(password: string): Promise<boolean> {
    console.log("authenticateApp: Starting authentication attempt with provided password.");
    try {
        const response = await callApiWithAuth("/api/languages", {
            method: "GET",
            authPasswordOverride: password, // This is the password we are testing
        });

        if (response.ok) {
            localStorage.setItem(PASSWORD_STORAGE_KEY, password);
            console.log("authenticateApp: Authentication successful. Password stored in localStorage.");
            return true;
        } else {
            console.error(`authenticateApp: Authentication failed with status ${response.status}: ${response.statusText}`);
            localStorage.removeItem(PASSWORD_STORAGE_KEY);
            return false;
        }
    } catch (error) {
        console.error("authenticateApp: Error during authentication process:", error);
        localStorage.removeItem(PASSWORD_STORAGE_KEY);
        return false;
    }
}

interface CallApiOptions extends RequestInit {
    authPasswordOverride?: string;
}

export async function callApiWithAuth(url: string, options: CallApiOptions = {}): Promise<Response> {
    const fullUrl = `${API_BASE_URL}${url}`; 
    console.log(`callApiWithAuth: Initiating request to ${fullUrl}`);
    const storedPassword = localStorage.getItem(PASSWORD_STORAGE_KEY);
    const passwordToUse = options.authPasswordOverride || storedPassword;

    if (!passwordToUse) {
        console.error("callApiWithAuth: No password available for this request.");
        throw new Error("Authentication required. No access password available.");
    }

    const headers = {
        ...options.headers,
        "x-access-password": passwordToUse,
    };

    console.log("callApiWithAuth: Headers being sent:", headers); // <-- CHECK THIS LOG!
    console.log("callApiWithAuth: Password being used (first 5 chars):", passwordToUse.substring(0, 5) + '...'); // Don't log full password

    const response = await fetch(fullUrl, { ...options, headers });

    if (response.status === 401) {
        console.error("callApiWithAuth: Received 401 Unauthorized. Clearing stored password.");
        localStorage.removeItem(PASSWORD_STORAGE_KEY);
        throw new Error("Unauthorized: Access password rejected.");
    }

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`callApiWithAuth: API call to ${url} failed with status ${response.status}:`, errorText);
        throw new Error(`API call failed: ${errorText || response.statusText}`);
    }

    console.log(`callApiWithAuth: Request to ${url} successful.`);
    return response;
}

export function logout(): void {
    console.log("logout: Clearing password from localStorage and reloading.");
    localStorage.removeItem(PASSWORD_STORAGE_KEY);
    window.location.reload();
}