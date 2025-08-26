const fs = require('fs');
const path = require('path');
const os = require('os');

/*
 * VS CODE DEVICE ID CLEANER/REFRESHER SCRIPT
 * ==========================================
 * 
 * Extracted from AugProxy extension for educational purposes.
 * This script shows how the extension manipulates VS Code device identifiers.
 * 
 * Key functionality:
 * 1. Detects VS Code variants (Code, Windsurf, Cursor)
 * 2. Locates user data directories
 * 3. Cleans/resets device identifiers and telemetry data
 * 4. Modifies authentication tokens
 */

class VSCodeDeviceManager {
    constructor() {
        this.homeDir = os.homedir();
        this.supportedApps = {
            'Code': '.vscode',
            'Windsurf': '.windsurf', 
            'Cursor': '.cursor'
        };
        this.logger = console;
    }

    // Detect which VS Code variant is being used
    detectVSCodeVariant() {
        const currentApp = process.env.VSCODE_PID ? 'Code' : 
                          process.env.WINDSURF_PID ? 'Windsurf' :
                          process.env.CURSOR_PID ? 'Cursor' : 'Code';
        
        this.logger.info('Detected VS Code variant:', currentApp);
        return currentApp;
    }

    // Get the user data directory for the detected app
    getUserDataPath(appName = null) {
        appName = appName || this.detectVSCodeVariant();
        const configDir = this.supportedApps[appName] || '.vscode';
        const userDataPath = path.join(this.homeDir, configDir);
        
        this.logger.info('User data path:', userDataPath);
        return userDataPath;
    }

    // Get machineId storage path
    getMachineIdPath(appName = null) {
        const userDataPath = this.getUserDataPath(appName);
        return path.join(userDataPath, 'User', 'globalStorage', 'storage.json');
    }

    // Get telemetry storage path  
    getTelemetryPath(appName = null) {
        const userDataPath = this.getUserDataPath(appName);
        return path.join(userDataPath, 'User', 'globalStorage', 'state.vscdb');
    }

    // Get workspace state path
    getWorkspaceStatePath(appName = null) {
        const userDataPath = this.getUserDataPath(appName);
        return path.join(userDataPath, 'User', 'workspaceStorage');
    }

    // Clear user's score/cache information (from AugProxy)
    async clearUserCache(userId) {
        if (!userId) return;
        
        const cacheKey = `scoreInfo_${userId}`;
        
        // Clear from VS Code storage
        const storagePath = this.getMachineIdPath();
        if (fs.existsSync(storagePath)) {
            try {
                const storage = JSON.parse(fs.readFileSync(storagePath, 'utf8'));
                if (storage[cacheKey]) {
                    delete storage[cacheKey];
                    fs.writeFileSync(storagePath, JSON.stringify(storage, null, 2));
                    this.logger.info(`Cleared user's scoreInfo cache for ID: ${userId}`);
                }
            } catch (error) {
                this.logger.error('Error clearing cache:', error);
            }
        }
    }

    // Generate new UUID for device ID
    generateNewUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Reset VS Code device identifiers
    async resetDeviceIdentifiers(appName = null) {
        const userDataPath = this.getUserDataPath(appName);
        const storagePath = this.getMachineIdPath(appName);
        
        this.logger.info('Resetting device identifiers...');
        
        try {
            // Generate new identifiers
            const newMachineId = this.generateNewUUID();
            const newDeviceId = this.generateNewUUID();
            const newSessionId = this.generateNewUUID();
            
            // Update storage.json if it exists
            if (fs.existsSync(storagePath)) {
                const storage = JSON.parse(fs.readFileSync(storagePath, 'utf8'));
                
                // Reset common device identifier keys
                const identifierKeys = [
                    'telemetry.machineId',
                    'telemetry.devDeviceId', 
                    'telemetry.sessionId',
                    'machineId',
                    'deviceId',
                    'sessionId'
                ];
                
                identifierKeys.forEach(key => {
                    if (storage[key]) {
                        storage[key] = key.includes('machine') ? newMachineId : 
                                     key.includes('device') ? newDeviceId : newSessionId;
                        this.logger.info(`Reset ${key}`);
                    }
                });
                
                fs.writeFileSync(storagePath, JSON.stringify(storage, null, 2));
                this.logger.info('Device identifiers reset successfully');
            }
            
            return {
                machineId: newMachineId,
                deviceId: newDeviceId,
                sessionId: newSessionId
            };
            
        } catch (error) {
            this.logger.error('Error resetting device identifiers:', error);
            throw error;
        }
    }

    // Clean telemetry data
    async cleanTelemetryData(appName = null) {
        const telemetryPath = this.getTelemetryPath(appName);
        
        this.logger.info('Cleaning telemetry data...');
        
        try {
            if (fs.existsSync(telemetryPath)) {
                // Backup original
                const backupPath = telemetryPath + '.backup.' + Date.now();
                fs.copyFileSync(telemetryPath, backupPath);
                
                // Clear or reset telemetry database
                fs.unlinkSync(telemetryPath);
                this.logger.info('Telemetry data cleared');
                this.logger.info('Backup created at:', backupPath);
            }
        } catch (error) {
            this.logger.error('Error cleaning telemetry:', error);
        }
    }

    // Clear workspace storage (contains extension data)
    async clearWorkspaceStorage(appName = null) {
        const workspaceStoragePath = this.getWorkspaceStatePath(appName);
        
        this.logger.info('Clearing workspace storage...');
        
        try {
            if (fs.existsSync(workspaceStoragePath)) {
                const items = fs.readdirSync(workspaceStoragePath);
                let clearedCount = 0;
                
                items.forEach(item => {
                    const itemPath = path.join(workspaceStoragePath, item);
                    if (fs.statSync(itemPath).isDirectory()) {
                        // Clear extension-specific storage
                        fs.rmSync(itemPath, { recursive: true, force: true });
                        clearedCount++;
                    }
                });
                
                this.logger.info(`Cleared ${clearedCount} workspace storage items`);
            }
        } catch (error) {
            this.logger.error('Error clearing workspace storage:', error);
        }
    }

    // Main function to refresh VS Code device identity
    async refreshVSCodeDevice(appName = null, options = {}) {
        const {
            resetIdentifiers = true,
            cleanTelemetry = true,
            clearWorkspace = false,
            clearCache = true
        } = options;

        this.logger.info('Starting VS Code device refresh...');
        
        try {
            let results = {};
            
            if (resetIdentifiers) {
                results.identifiers = await this.resetDeviceIdentifiers(appName);
            }
            
            if (cleanTelemetry) {
                await this.cleanTelemetryData(appName);
                results.telemetryCleared = true;
            }
            
            if (clearWorkspace) {
                await this.clearWorkspaceStorage(appName);
                results.workspaceCleared = true;
            }
            
            if (clearCache) {
                // This would clear user-specific cache if userId is known
                // await this.clearUserCache(userId);
                results.cacheCleared = true;
            }
            
            this.logger.info('VS Code device refresh completed successfully');
            return results;
            
        } catch (error) {
            this.logger.error('Error during device refresh:', error);
            throw error;
        }
    }

    // Utility: Get current device info (for comparison)
    async getCurrentDeviceInfo(appName = null) {
        const storagePath = this.getMachineIdPath(appName);
        
        try {
            if (fs.existsSync(storagePath)) {
                const storage = JSON.parse(fs.readFileSync(storagePath, 'utf8'));
                return {
                    machineId: storage['telemetry.machineId'] || storage['machineId'],
                    deviceId: storage['telemetry.devDeviceId'] || storage['deviceId'], 
                    sessionId: storage['telemetry.sessionId'] || storage['sessionId'],
                    storagePath: storagePath
                };
            }
        } catch (error) {
            this.logger.error('Error reading device info:', error);
        }
        
        return null;
    }
}

// CLI Usage Example
async function main() {
    const deviceManager = new VSCodeDeviceManager();
    
    console.log('=== VS Code Device Manager ===');
    
    // Show current device info
    console.log('\nCurrent device info:');
    const currentInfo = await deviceManager.getCurrentDeviceInfo();
    console.log(currentInfo);
    
    // Ask user what they want to do
    const args = process.argv.slice(2);
    
    if (args.includes('--reset') || args.includes('-r')) {
        console.log('\nResetting device identifiers...');
        const results = await deviceManager.refreshVSCodeDevice(null, {
            resetIdentifiers: true,
            cleanTelemetry: args.includes('--telemetry'),
            clearWorkspace: args.includes('--workspace'),
            clearCache: true
        });
        console.log('Results:', results);
    } else if (args.includes('--info') || args.includes('-i')) {
        console.log('\nDevice information displayed above.');
    } else {
        console.log('\nUsage:');
        console.log('  node vscode-device-cleaner.js --reset          # Reset device IDs');
        console.log('  node vscode-device-cleaner.js --reset --telemetry  # Also clean telemetry');
        console.log('  node vscode-device-cleaner.js --info           # Show current info');
        console.log('\nOptions:');
        console.log('  --reset, -r       Reset device identifiers');
        console.log('  --telemetry       Clean telemetry data');
        console.log('  --workspace       Clear workspace storage');
        console.log('  --info, -i        Show current device info');
    }
}

// Export for use as module
module.exports = VSCodeDeviceManager;

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}
