import { JsonDb } from './db'; // Assuming 'db.ts' or 'db.js' exports JsonDb correctly
import * as fs from 'fs/promises'; // Used for async cleanup in some suites
import * as fsSync from 'fs'; // Used for sync cleanup
import * as path from 'path';

describe('JsonDb Tests - Synchronous Operations', () => {
    const testDir = './test-data-sync'; // Renamed for clarity if multiple testDirs are used across suites
    const testFile = path.join(testDir, 'db.json');

    // Synchronous cleanup function
    function cleanupTestDirectorySync() {
        try {
            // fsSync.rmSync is available in Node.js v14.14.0+
            // The 'force: true' option helps ignore errors if the path doesn't exist.
            fsSync.rmSync(testDir, { recursive: true, force: true });
        } catch (error) {
            // Fallback or log if needed, though 'force: true' should handle non-existence.
            // console.warn(`Could not cleanup test directory ${testDir}:`, error);
        }
    }

    beforeEach(() => {
        cleanupTestDirectorySync(); // Ensures a clean state before each test
    });

    afterEach(() => {
        cleanupTestDirectorySync(); // Cleans up after each test
    });

    it('should store data and create directory if it does not exist, then load it synchronously', () => {
        const data = { sync: true, timestamp: Date.now(), message: 'Hello from sync test' };
        
        // testDir does not exist at this point due to cleanup.
        // JsonDb.store should create it because createDirectory defaults to true.
        JsonDb.store(testFile, data);
        
        // Verify directory and file were created
        expect(fsSync.existsSync(testDir)).toBe(true);
        expect(fsSync.existsSync(testFile)).toBe(true);

        const loaded = JsonDb.load<typeof data>(testFile);
        expect(loaded).toEqual(data);
    });

    it('should check file existence synchronously', () => {
        expect(JsonDb.exists(testFile)).toBe(false);
        
        JsonDb.store(testFile, { test: true, status: 'exists' });
        
        expect(JsonDb.exists(testFile)).toBe(true);
    });

    it('should throw a specific error when loading a non-existent file synchronously', () => {
        const nonExistentFile = path.join(testDir, 'nonexistent-file.json');
        // Note: The console.log within JsonDb.load for 'ENOENT' will appear during this test.
        expect(() => JsonDb.load(nonExistentFile))
            .toThrow(`File not found ${nonExistentFile}`);
    });

    it('should handle complex objects (arrays and nested objects) synchronously', () => {
        const complexData = {
            users: [
                { id: 1, name: 'User One', active: true },
                { id: 2, name: 'User Two', active: false }
            ],
            metadata: {
                created: new Date().toISOString(),
                version: '2.0.1',
                description: 'Test data for complex objects'
            },
            status: null
        };

        JsonDb.store(testFile, complexData);
        const loaded = JsonDb.load<typeof complexData>(testFile);

        expect(loaded).toEqual(complexData); // Deep equality check
        expect(loaded.users).toHaveLength(2);
        expect(loaded.metadata.version).toBe('2.0.1');
    });

    it('should use specified indentation when storing data', () => {
        const data = { simple: true };
        JsonDb.store(testFile, data, { indent: 4 }); // Specify 4 spaces for indentation

        const fileContent = fsSync.readFileSync(testFile, 'utf-8');
        // Expecting:
        // {
        //     "simple": true
        // }
        expect(fileContent).toBe(JSON.stringify(data, null, 4));

        // Check default indentation (2 spaces)
        const testFileDefaultIndent = path.join(testDir, 'db-default-indent.json');
        JsonDb.store(testFileDefaultIndent, data); // No indent option, uses default 2
        const fileContentDefault = fsSync.readFileSync(testFileDefaultIndent, 'utf-8');
        expect(fileContentDefault).toBe(JSON.stringify(data, null, 2));
    });

    it('should not create directory if createDirectory option is false and directory does not exist', () => {
        const noCreateDir = path.join(testDir, 'noCreate', 'db.json');
        // testDir itself is cleaned up, so 'noCreate' subdir also won't exist.
        expect(() => JsonDb.store(noCreateDir, { test: "data" }, { createDirectory: false }))
            .toThrow(); // This will throw because mkdirSync won't be called for path.dirname(noCreateDir)
                       // and writeFileSync will fail with ENOENT.
    });

});

describe('JsonDb - Edge Cases & Performance', () => {
    const testDir = './test-data-edge-cases'; // Separate directory for this suite
    
    // Asynchronous cleanup for this suite
    async function cleanupTestDirectoryAsync() {
        try {
            await fs.rm(testDir, { recursive: true, force: true });
        } catch (error) {
            // console.warn(`Could not cleanup async test directory ${testDir}:`, error);
        }
    }

    beforeEach(async () => {
        await cleanupTestDirectoryAsync();
    });

    afterEach(async () => {
        await cleanupTestDirectoryAsync();
    });

    it('should handle large objects efficiently within reasonable time limits (synchronous I/O)', () => {
        const largeData = {
            items: Array.from({ length: 1000 }, (_, i) => ({
                id: i,
                name: `Item ${i}`,
                description: `Description for item ${i}. `.repeat(5) + `Test string. `.repeat(5),
                tags: [`tagA-${i}`, `tagB-${i}`, `tagC-${i}`, `tagD-${i}`],
                details: {
                    price: Math.random() * 100,
                    stock: Math.floor(Math.random() * 1000),
                    isActive: i % 3 === 0,
                    nestedInfo: {
                        code: `CODE-${i}-${Date.now()}`,
                        notes: `Some notes for item ${i}.`
                    }
                },
                createdAt: new Date(Date.now() - Math.random() * 1000000000).toISOString(),
                updatedAt: new Date().toISOString()
            }))
        };

        const filePath = path.join(testDir, 'large-data.json');
        
        const startTimeStore = Date.now();
        JsonDb.store(filePath, largeData);
        const storeTime = Date.now() - startTimeStore;
        
        const startTimeLoad = Date.now();
        const loaded = JsonDb.load<typeof largeData>(filePath);
        const loadTime = Date.now() - startTimeLoad;
        
        expect(loaded.items).toHaveLength(1000);
        expect(loaded.items[0].id).toBe(0);
        expect(loaded.items[999].id).toBe(999);

        console.log(`Large object store time: ${storeTime}ms`);
        console.log(`Large object load time: ${loadTime}ms`);

        // Performance thresholds can be adjusted based on typical environment performance.
        // Synchronous operations can be slow for very large files.
        expect(storeTime).toBeLessThan(5000); // e.g., 5 seconds
        expect(loadTime).toBeLessThan(5000);   // e.g., 5 seconds
    });

    it('should correctly handle empty object and empty array', () => {
        const emptyObjectFile = path.join(testDir, 'empty-object.json');
        const emptyArrayFile = path.join(testDir, 'empty-array.json');

        JsonDb.store(emptyObjectFile, {});
        let loadedObject = JsonDb.load(emptyObjectFile);
        expect(loadedObject).toEqual({});

        JsonDb.store(emptyArrayFile, []);
        let loadedArray = JsonDb.load(emptyArrayFile);
        expect(loadedArray).toEqual([]);
    });
});

// Renamed for consistency with the class name
describe('JsonDb - Integration Tests', () => {
    const appDir = './test-data-app'; // Separate directory for this suite
    const usersFile = path.join(appDir, 'users.json');
    const configFile = path.join(appDir, 'config.json'); // Example of another file

    // Asynchronous cleanup for this suite
    async function cleanupTestDirectoryAsync() {
        try {
            await fs.rm(appDir, { recursive: true, force: true });
        } catch (error) {
            // console.warn(`Could not cleanup integration test directory ${appDir}:`, error);
        }
    }
    
    beforeEach(async () => {
        await cleanupTestDirectoryAsync();
    });

    afterEach(async () => {
        await cleanupTestDirectoryAsync();
    });

    it('should simulate a complete application workflow: managing users and config', () => {
        // 1. Initial application config
        const initialConfig = { theme: 'dark', notifications: true, version: '1.0.0' };
        JsonDb.store(configFile, initialConfig);

        // 2. Load config and verify
        let loadedConfig = JsonDb.load<typeof initialConfig>(configFile);
        expect(loadedConfig.theme).toBe('dark');

        // 3. Initialize users
        const user1 = {
            id: 'user-001',
            name: 'Alice Johnson',
            email: 'alice.j@example.com',
            role: 'admin',
            joinedAt: new Date().toISOString()
        };
        JsonDb.store(usersFile, [user1]);

        // 4. Load users, add another user, and save
        let currentUsers = JsonDb.load<typeof user1[]>(usersFile);
        const user2 = {
            id: 'user-002',
            name: 'Bob Williams',
            email: 'bob.w@example.com',
            role: 'editor',
            joinedAt: new Date().toISOString()
        };
        currentUsers.push(user2);
        JsonDb.store(usersFile, currentUsers);

        // 5. Update application config
        loadedConfig.version = '1.0.1';
        loadedConfig.notifications = false;
        JsonDb.store(configFile, loadedConfig);

        // 6. Verify final state
        const finalUsers = JsonDb.load<typeof user1[]>(usersFile);
        expect(finalUsers).toHaveLength(2);
        expect(finalUsers.find(u => u.id === 'user-001')?.name).toBe('Alice Johnson');
        expect(finalUsers.find(u => u.id === 'user-002')?.role).toBe('editor');

        const finalConfig = JsonDb.load<typeof initialConfig>(configFile);
        expect(finalConfig.version).toBe('1.0.1');
        expect(finalConfig.notifications).toBe(false);

        // 7. Test exists for one of the files
        expect(JsonDb.exists(usersFile)).toBe(true);
        expect(JsonDb.exists(configFile)).toBe(true);
    });
});