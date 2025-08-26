// VS Code Learning Extension - Webview JavaScript

(function () {
    const vscode = acquireVsCodeApi();

    // Get output container
    const outputContainer = document.getElementById('output');

    // Utility function to add output to the display
    function addOutput(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const outputItem = document.createElement('div');
        outputItem.className = `output-item ${type}`;

        const timestampDiv = document.createElement('div');
        timestampDiv.className = 'timestamp';
        timestampDiv.textContent = timestamp;

        const messageDiv = document.createElement('div');

        if (typeof message === 'object') {
            messageDiv.innerHTML = `<div class="json-output">${JSON.stringify(message, null, 2)}</div>`;
        } else {
            messageDiv.textContent = message;
        }

        outputItem.appendChild(timestampDiv);
        outputItem.appendChild(messageDiv);

        // Clear initial message if it exists
        if (outputContainer.children.length === 1 &&
            outputContainer.children[0].textContent.includes('Click any button')) {
            outputContainer.innerHTML = '';
        }

        outputContainer.appendChild(outputItem);
        outputContainer.scrollTop = outputContainer.scrollHeight;
    }

    // Utility function to show loading state
    function showLoading(buttonId, text = 'Loading...') {
        const button = document.getElementById(buttonId);
        const originalText = button.textContent;
        button.innerHTML = `<span class="loading"></span>${text}`;
        button.disabled = true;

        return () => {
            button.textContent = originalText;
            button.disabled = false;
        };
    }

    // Custom confirmation dialog for webview
    function showConfirmDialog(message) {
        return new Promise((resolve) => {
            // Create modal overlay
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            `;

            // Create dialog box
            const dialog = document.createElement('div');
            dialog.style.cssText = `
                background-color: var(--vscode-editor-background);
                border: 1px solid var(--vscode-panel-border);
                border-radius: 8px;
                padding: 20px;
                max-width: 400px;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
            `;

            // Create message
            const messageEl = document.createElement('p');
            messageEl.textContent = message;
            messageEl.style.cssText = `
                margin: 0 0 20px 0;
                color: var(--vscode-foreground);
                line-height: 1.5;
            `;

            // Create button container
            const buttonContainer = document.createElement('div');
            buttonContainer.style.cssText = `
                display: flex;
                gap: 10px;
                justify-content: flex-end;
            `;

            // Create OK button
            const okButton = document.createElement('button');
            okButton.textContent = 'OK';
            okButton.style.cssText = `
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
            `;

            // Create Cancel button
            const cancelButton = document.createElement('button');
            cancelButton.textContent = 'Cancel';
            cancelButton.style.cssText = `
                background-color: var(--vscode-button-secondaryBackground);
                color: var(--vscode-button-secondaryForeground);
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
            `;

            // Add event listeners
            okButton.addEventListener('click', () => {
                document.body.removeChild(overlay);
                resolve(true);
            });

            cancelButton.addEventListener('click', () => {
                document.body.removeChild(overlay);
                resolve(false);
            });

            // Handle escape key
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    document.body.removeChild(overlay);
                    document.removeEventListener('keydown', handleEscape);
                    resolve(false);
                }
            };
            document.addEventListener('keydown', handleEscape);

            // Assemble dialog
            buttonContainer.appendChild(cancelButton);
            buttonContainer.appendChild(okButton);
            dialog.appendChild(messageEl);
            dialog.appendChild(buttonContainer);
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            // Focus OK button
            okButton.focus();
        });
    }

    // Message handlers from extension
    window.addEventListener('message', event => {
        const message = event.data;
        console.log('Webview: Received message from extension:', message);

        switch (message.command) {
            case 'workspaceInfo':
                if (message.data.length > 0) {
                    addOutput('Workspace Information:', 'info');
                    addOutput(message.data, 'info');
                } else {
                    addOutput('No workspace folders are currently open', 'warning');
                }
                break;

            case 'deviceInfo':
                if (message.data) {
                    if (message.data.message) {
                        // Handle fallback info case
                        addOutput('Device Information Status:', 'warning');
                        addOutput(message.data.message, 'warning');
                        addOutput('VS Code Configuration:', 'info');
                        addOutput(message.data, 'info');
                    } else {
                        // Handle normal device info case
                        addOutput('Current Device Information:', 'success');
                        addOutput(message.data, 'info');
                    }
                } else {
                    addOutput('No device information found', 'warning');
                }
                break;

            case 'deviceReset':
                if (message.data.message) {
                    // Handle warning case where no storage file was found
                    addOutput('Device Reset Status:', 'warning');
                    addOutput(message.data.message, 'warning');
                } else {
                    // Handle successful reset case
                    addOutput('Device identifiers reset successfully!', 'success');
                    addOutput('New Device Identifiers:', 'success');
                    addOutput(message.data, 'success');
                }
                break;

            case 'error':
                addOutput(`Error: ${message.data.message}`, 'error');
                break;
        }
    });

    // Button event handlers
    document.addEventListener('DOMContentLoaded', () => {
        // Message buttons
        document.getElementById('showInfo').addEventListener('click', () => {
            vscode.postMessage({
                command: 'showInfo',
                text: 'This is an information message from the webview!'
            });
            addOutput('Sent info message to VS Code', 'info');
        });

        document.getElementById('showWarning').addEventListener('click', () => {
            vscode.postMessage({
                command: 'showWarning',
                text: 'This is a warning message from the webview!'
            });
            addOutput('Sent warning message to VS Code', 'warning');
        });

        document.getElementById('showError').addEventListener('click', () => {
            vscode.postMessage({
                command: 'showError',
                text: 'This is an error message from the webview!'
            });
            addOutput('Sent error message to VS Code', 'error');
        });

        // Workspace buttons
        document.getElementById('getWorkspace').addEventListener('click', () => {
            const stopLoading = showLoading('getWorkspace', 'Getting workspace info...');

            vscode.postMessage({
                command: 'getWorkspaceInfo'
            });

            addOutput('Requesting workspace information...', 'info');

            // Stop loading after a short delay (the response will come via message)
            setTimeout(stopLoading, 1000);
        });

        document.getElementById('openFile').addEventListener('click', () => {
            // For demo purposes, try to open the package.json file
            const packageJsonPath = './package.json';

            vscode.postMessage({
                command: 'openFile',
                path: packageJsonPath
            });

            addOutput(`Attempting to open file: ${packageJsonPath}`, 'info');
        });

        // Device management buttons
        document.getElementById('getDeviceInfo').addEventListener('click', () => {
            console.log('Webview: Get Device Info button clicked');
            const stopLoading = showLoading('getDeviceInfo', 'Getting device info...');

            vscode.postMessage({
                command: 'getCurrentDeviceInfo'
            });
            console.log('Webview: Sent getCurrentDeviceInfo message to extension');

            addOutput('Requesting current device information...', 'info');

            // Stop loading after a short delay
            setTimeout(stopLoading, 2000); // Increased timeout
        });

        document.getElementById('resetDevice').addEventListener('click', async () => {
            console.log('Webview: Reset Device button clicked');

            // Show confirmation dialog (smart fallback)
            try {
                addOutput('Starting device reset...', 'info');

                const stopLoading = showLoading('resetDevice', 'Resetting device IDs...');

                vscode.postMessage({
                    command: 'resetDeviceIds'
                });
                console.log('Webview: Sent resetDeviceIds message to extension');

                addOutput('Resetting device identifiers...', 'warning');

                // Stop loading after a delay
                setTimeout(stopLoading, 3000); // Increased timeout
            } catch (error) {
                console.error('Webview: Error showing confirmation dialog:', error);
                addOutput('Error showing confirmation dialog', 'error');
            }
        });
    });


    // Add some initial helpful information
    setTimeout(() => {
        addOutput('🎓 Welcome to the VS Code Learning Extension!', 'info');
        addOutput('This extension demonstrates various VS Code API capabilities:', 'info');
        addOutput('• Message notifications (info, warning, error)', 'info');
        addOutput('• Workspace operations and file handling', 'info');
        addOutput('• Device management and identifier operations', 'info');
        addOutput('• Webview communication patterns', 'info');
        addOutput('Click any button above to explore these features!', 'success');
    }, 500);

    // Handle keyboard shortcuts
    document.addEventListener('keydown', (event) => {
        // Ctrl/Cmd + Enter to get workspace info
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            document.getElementById('getWorkspace').click();
        }

        // Ctrl/Cmd + I to show info message
        if ((event.ctrlKey || event.metaKey) && event.key === 'i') {
            document.getElementById('showInfo').click();
        }
    });

    // Add keyboard shortcut hints
    setTimeout(() => {
        addOutput('💡 Keyboard shortcuts:', 'info');
        addOutput('• Ctrl/Cmd + Enter: Get workspace info', 'info');
        addOutput('• Ctrl/Cmd + I: Show info message', 'info');
    }, 1000);

})();
