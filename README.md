# 🎓 VS Code Learning Extension

A comprehensive learning extension that demonstrates VS Code extension development with webviews, commands, and API usage. This extension serves as an educational tool for understanding how VS Code extensions work with interactive webview interfaces and backend communication.

## 📋 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Usage](#-usage)
- [Development Setup](#-development-setup)
- [Extension Structure](#-extension-structure)
- [API Examples](#-api-examples)
- [Testing](#-testing)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### 🌐 Interactive Webview Interface
- Clean, responsive HTML interface with VS Code theming
- Real-time communication between webview and extension backend
- Multiple functional buttons demonstrating different capabilities
- Live output display with syntax highlighting and timestamps

### 📢 Message & Notification System
- **Info Messages**: Display informational notifications
- **Warning Messages**: Show warning alerts to users
- **Error Messages**: Present error notifications with proper styling
- All messages appear both in VS Code's notification system and the webview output

### 📁 Workspace Operations
- **Workspace Information**: Get details about currently open workspace folders
- **File Operations**: Open files programmatically through the extension
- **Path Resolution**: Demonstrate proper file path handling in VS Code extensions

### 🔧 Device Management Integration
- **Device Information**: Display current VS Code device identifiers
- **Device Reset**: Reset VS Code device IDs and telemetry data
- **Multi-Platform Support**: Works with VS Code, Cursor, and Windsurf
- **Safe Operations**: Includes confirmation dialogs for destructive operations

### 🎨 Modern UI/UX
- VS Code native theming integration
- Responsive design that works on different screen sizes
- Loading states and visual feedback
- Keyboard shortcuts for common operations
- Smooth animations and transitions

## 🚀 Installation

### Prerequisites
- VS Code version 1.74.0 or higher
- Node.js 16.x or higher
- npm or yarn package manager

### Development Installation

1. **Clone or download this repository**:
   ```bash
   git clone <repository-url>
   cd vscode-learning-extension
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Open in VS Code**:
   ```bash
   code .
   ```

4. **Launch Extension Development Host**:
   - Press `F5` or go to Run → Start Debugging
   - This opens a new VS Code window with your extension loaded

### Package Installation (Alternative)

1. **Package the extension**:
   ```bash
   npm install -g vsce
   vsce package
   ```

2. **Install the .vsix file**:
   - Open VS Code
   - Go to Extensions view (Ctrl+Shift+X)
   - Click "..." → "Install from VSIX..."
   - Select the generated .vsix file

## 📖 Usage

### Opening the Extension

1. **Command Palette Method**:
   - Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
   - Type "Learning: Open Learning Extension"
   - Press Enter

2. **Explorer Context Menu**:
   - Right-click in the Explorer panel
   - Select "Open Learning Extension"

### Using the Interface

#### Message & Notification Buttons
- **Show Info Message**: Demonstrates `vscode.window.showInformationMessage()`
- **Show Warning**: Demonstrates `vscode.window.showWarningMessage()`
- **Show Error**: Demonstrates `vscode.window.showErrorMessage()`

#### Workspace Operation Buttons
- **Get Workspace Info**: Retrieves and displays current workspace folder information
- **Open File Dialog**: Attempts to open the package.json file in the editor

#### Device Management Buttons
- **Get Device Info**: Shows current VS Code device identifiers and storage paths
- **Reset Device IDs**: Generates new device identifiers (requires confirmation)

### Keyboard Shortcuts
- `Ctrl/Cmd + Enter`: Get workspace information
- `Ctrl/Cmd + I`: Show info message

## 🛠 Development Setup

### Project Structure
```
vscode-learning-extension/
├── .vscode/
│   ├── launch.json          # Debug configuration
│   └── tasks.json           # Build tasks
├── media/
│   ├── main.css            # Webview styles
│   └── main.js             # Webview JavaScript
├── src/
│   └── extension.js        # Main extension code
├── package.json            # Extension manifest
├── vscode-device-cleaner.js # Device management utility
├── test-extension.js       # Testing script
└── README.md              # This file
```

### Key Files Explained

#### `package.json`
The extension manifest that defines:
- Extension metadata (name, version, description)
- VS Code engine compatibility
- Activation events and commands
- Menu contributions and keybindings

#### `src/extension.js`
Main extension entry point containing:
- `activate()` function - called when extension starts
- `deactivate()` function - called when extension stops
- Command registration and handlers
- Webview panel management
- Message communication logic

#### `media/main.css`
Webview stylesheet featuring:
- VS Code theme integration
- Responsive button layouts
- Output formatting styles
- Loading animations

#### `media/main.js`
Webview client-side JavaScript handling:
- VS Code API communication
- Button event handlers
- Output display management
- Keyboard shortcuts

### Building and Testing

1. **Run the test script**:
   ```bash
   node test-extension.js
   ```

2. **Launch in debug mode**:
   - Press `F5` in VS Code
   - Or use Run → Start Debugging

3. **Test individual components**:
   ```bash
   # Test device manager
   node vscode-device-cleaner.js --info
   
   # Check syntax
   node -c src/extension.js
   ```

### Adding New Features

1. **Add a new command** in `package.json`:
   ```json
   {
     "command": "your-extension.newCommand",
     "title": "New Command",
     "category": "Learning"
   }
   ```

2. **Register the command** in `src/extension.js`:
   ```javascript
   let newCommand = vscode.commands.registerCommand('your-extension.newCommand', () => {
     // Your command logic here
   });
   context.subscriptions.push(newCommand);
   ```

3. **Add webview button** in the HTML template
4. **Handle the message** in the webview message handler

## 🧪 Testing

### Automated Testing
Run the included test script to verify extension structure:
```bash
node test-extension.js
```

### Manual Testing Checklist
- [ ] Extension activates without errors
- [ ] Webview opens and displays correctly
- [ ] All buttons respond to clicks
- [ ] Messages appear in both webview and VS Code notifications
- [ ] Workspace information is retrieved correctly
- [ ] Device management functions work (with caution)
- [ ] Keyboard shortcuts function properly
- [ ] Extension deactivates cleanly

### Testing in Different Environments
- Test with different VS Code themes (light/dark)
- Test with different workspace configurations
- Test with multiple workspace folders
- Test keyboard shortcuts in different contexts

### Device Management Testing
The device management buttons have enhanced error handling:

**Get Device Info Button:**
- If VS Code storage exists: Shows actual device identifiers
- If no storage found: Shows VS Code configuration details instead
- Check browser console (F12) for debug messages

**Reset Device IDs Button:**
- Shows confirmation dialog before proceeding
- If storage exists: Generates new device identifiers
- If no storage found: Shows informative warning message
- All operations are logged to console for debugging

**Troubleshooting Device Management:**
1. Open VS Code Developer Tools (`Help → Toggle Developer Tools`)
2. Check console for messages starting with "Extension:" and "Webview:"
3. If no device storage is found, this is normal for fresh VS Code installations
4. The extension will still show useful configuration information

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow VS Code extension best practices
- Maintain backward compatibility with VS Code 1.74.0+
- Add tests for new functionality
- Update documentation for new features
- Use semantic versioning for releases

## 📚 Learning Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Webview API Guide](https://code.visualstudio.com/api/extension-guides/webview)
- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
- [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for educational purposes to demonstrate VS Code extension development
- Incorporates device management functionality for learning about VS Code internals
- Designed to serve as a comprehensive example for extension developers

---

**Happy Learning! 🎓**

For questions, issues, or contributions, please visit the [GitHub repository](https://github.com/trongnguyenbinh/vscode-learning-extension).
