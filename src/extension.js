const vscode = require('vscode');

// Import our device manager from the existing file
const VSCodeDeviceManager = require('../vscode-device-cleaner');

/**
 * Main extension activation function
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('VS Code Learning Extension is now active!');

    // Create device manager instance
    const deviceManager = new VSCodeDeviceManager();

    // Register the main webview command
    let openWebviewCommand = vscode.commands.registerCommand('vscode-learning-extension.openWebview', () => {
        WebviewPanel.createOrShow(context.extensionUri, deviceManager);
    });

    // Register individual command handlers
    let showMessageCommand = vscode.commands.registerCommand('vscode-learning-extension.showMessage', () => {
        vscode.window.showInformationMessage('Hello from VS Code Learning Extension!');
    });

    let getWorkspaceInfoCommand = vscode.commands.registerCommand('vscode-learning-extension.getWorkspaceInfo', () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders) {
            const info = workspaceFolders.map(folder => ({
                name: folder.name,
                uri: folder.uri.toString()
            }));
            vscode.window.showInformationMessage(`Workspace: ${JSON.stringify(info, null, 2)}`);
        } else {
            vscode.window.showWarningMessage('No workspace folder is open');
        }
    });

    let deviceManagerCommand = vscode.commands.registerCommand('vscode-learning-extension.deviceManager', async () => {
        try {
            const currentInfo = await deviceManager.getCurrentDeviceInfo();
            vscode.window.showInformationMessage(`Current Device Info: ${JSON.stringify(currentInfo, null, 2)}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Error getting device info: ${error.message}`);
        }
    });

    // Add commands to subscriptions for proper cleanup
    context.subscriptions.push(
        openWebviewCommand,
        showMessageCommand,
        getWorkspaceInfoCommand,
        deviceManagerCommand
    );
}

/**
 * Webview Panel Manager Class
 */
class WebviewPanel {
    static currentPanel = undefined;

    constructor(panel, extensionUri, deviceManager) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._deviceManager = deviceManager;
        this._disposables = [];

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            message => this._handleMessage(message),
            null,
            this._disposables
        );
    }

    static createOrShow(extensionUri, deviceManager) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it
        if (WebviewPanel.currentPanel) {
            WebviewPanel.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(
            'learningExtension',
            'Learning Extension',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media'),
                    vscode.Uri.joinPath(extensionUri, 'src')
                ]
            }
        );

        WebviewPanel.currentPanel = new WebviewPanel(panel, extensionUri, deviceManager);
    }

    dispose() {
        WebviewPanel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    async _handleMessage(message) {
        switch (message.command) {
            case 'showInfo':
                vscode.window.showInformationMessage(message.text);
                break;
            
            case 'showWarning':
                vscode.window.showWarningMessage(message.text);
                break;
            
            case 'showError':
                vscode.window.showErrorMessage(message.text);
                break;
            
            case 'getWorkspaceInfo':
                const workspaceFolders = vscode.workspace.workspaceFolders;
                const workspaceInfo = workspaceFolders ? 
                    workspaceFolders.map(folder => ({
                        name: folder.name,
                        uri: folder.uri.toString()
                    })) : [];
                
                this._panel.webview.postMessage({
                    command: 'workspaceInfo',
                    data: workspaceInfo
                });
                break;
            
            case 'getCurrentDeviceInfo':
                try {
                    console.log('Extension: Getting device info...');
                    const deviceInfo = await this._deviceManager.getCurrentDeviceInfo();
                    console.log('Extension: Device info result:', deviceInfo);

                    if (deviceInfo) {
                        this._panel.webview.postMessage({
                            command: 'deviceInfo',
                            data: deviceInfo
                        });
                    } else {
                        // Handle case where no device info is found
                        const fallbackInfo = {
                            message: 'No device information found in VS Code storage',
                            storagePath: this._deviceManager.getMachineIdPath(),
                            variant: this._deviceManager.detectVSCodeVariant(),
                            userDataPath: this._deviceManager.getUserDataPath()
                        };
                        this._panel.webview.postMessage({
                            command: 'deviceInfo',
                            data: fallbackInfo
                        });
                    }
                } catch (error) {
                    console.error('Extension: Error getting device info:', error);
                    this._panel.webview.postMessage({
                        command: 'error',
                        data: { message: error.message }
                    });
                }
                break;
            
            case 'resetDeviceIds':
                try {
                    console.log('Extension: Resetting device identifiers...');
                    const result = await this._deviceManager.resetDeviceIdentifiers();
                    console.log('Extension: Reset result:', result);

                    if (result) {
                        this._panel.webview.postMessage({
                            command: 'deviceReset',
                            data: result
                        });
                        vscode.window.showInformationMessage('Device identifiers reset successfully!');
                    } else {
                        // Handle case where reset didn't return expected result
                        const message = 'Device reset completed, but no storage file was found to update';
                        this._panel.webview.postMessage({
                            command: 'deviceReset',
                            data: { message: message, timestamp: new Date().toISOString() }
                        });
                        vscode.window.showWarningMessage(message);
                    }
                } catch (error) {
                    console.error('Extension: Error resetting device IDs:', error);
                    this._panel.webview.postMessage({
                        command: 'error',
                        data: { message: error.message }
                    });
                    vscode.window.showErrorMessage(`Error resetting device IDs: ${error.message}`);
                }
                break;
            
            case 'openFile':
                try {
                    const uri = vscode.Uri.file(message.path);
                    const document = await vscode.workspace.openTextDocument(uri);
                    await vscode.window.showTextDocument(document);
                } catch (error) {
                    vscode.window.showErrorMessage(`Could not open file: ${error.message}`);
                }
                break;
        }
    }

    _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    _getHtmlForWebview(webview) {
        // Get the local path to main script run in the webview
        const scriptPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js');
        const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

        // Get the local path to css file
        const stylePathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css');
        const styleUri = webview.asWebviewUri(stylePathOnDisk);

        // Use a nonce to only allow specific scripts to be run
        const nonce = getNonce();

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleUri}" rel="stylesheet">
                <title>Learning Extension</title>
            </head>
            <body>
                <div class="container">
                    <header>
                        <h1>🎓 VS Code Learning Extension</h1>
                        <p>Explore VS Code extension capabilities with interactive examples</p>
                    </header>

                    <main>
                        <section class="button-grid">
                            <div class="button-group">
                                <h3>📢 Messages & Notifications</h3>
                                <button id="showInfo" class="btn btn-info">Show Info Message</button>
                                <button id="showWarning" class="btn btn-warning">Show Warning</button>
                                <button id="showError" class="btn btn-error">Show Error</button>
                            </div>

                            <div class="button-group">
                                <h3>📁 Workspace Operations</h3>
                                <button id="getWorkspace" class="btn btn-primary">Get Workspace Info</button>
                                <button id="openFile" class="btn btn-secondary">Open File Dialog</button>
                            </div>

                            <div class="button-group">
                                <h3>🔧 Device Management</h3>
                                <button id="getDeviceInfo" class="btn btn-info">Get Device Info</button>
                                <button id="resetDevice" class="btn btn-warning">Reset Device IDs</button>
                            </div>
                        </section>

                        <section class="output-section">
                            <h3>📋 Output</h3>
                            <div id="output" class="output-box">
                                <p>Click any button above to see the results here...</p>
                            </div>
                        </section>
                    </main>
                </div>

                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

function deactivate() {
    console.log('VS Code Learning Extension is now deactivated');
}

module.exports = {
    activate,
    deactivate
};
