import { mkdirSync, writeFileSync, readFileSync, accessSync } from 'fs'; // Corrected import
import * as path from 'path';

// Synchronous version for when you need blocking operations
class JsonDb {

    /**
     * Store an object as JSON to a file (synchronous)
     */
    static store<T>(filePath: string, data: T, options?: {
        createDirectory?: boolean;
        indent?: number;
    }): void {
        const { createDirectory = true, indent = 2 } = options || {};

        try {
            // Create directory if it doesn't exist
            if (createDirectory) {
                const directory = path.dirname(filePath);
                mkdirSync(directory, { recursive: true });
            }

            // Convert and write
            const jsonString = JSON.stringify(data, null, indent);
            writeFileSync(filePath, jsonString, 'utf8');

        } catch (error) {
            // Consider making error more specific or logging original error for debug
            throw new Error(`Failed to store data to ${filePath}: ${(error as Error).message}`);
        }
    }

    /**
     * Load and parse JSON from a file (synchronous)
     */
    static load<T = any>(filePath: string): T {
        try {
            const fileContent = readFileSync(filePath, 'utf8');
            return JSON.parse(fileContent) as T;

        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                console.log('File not found, throwing error for:', filePath); // Kept from original
                throw new Error("File not found ");
            }
            // Consider making error more specific or logging original error for debug
            throw new Error(`Failed to load data from ${filePath}: ${(error as Error).message}`);
        }
    }

    /**
     * Check if file exists (synchronous)
     */
    static exists(filePath: string): boolean {
        try {
            accessSync(filePath);
            return true;
        } catch {
            return false;
        }
    }
}
export { JsonDb };