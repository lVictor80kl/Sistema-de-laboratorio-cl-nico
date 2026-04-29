"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
/**
 * Matrix Agent Chat - Extensión para VS Code/Antigravity
 * Panel lateral de chat con Matrix Agent
 */
// Estado global
let currentPanel;
let extensionContext;
// Mensaje de bienvenida
const WELCOME_MESSAGE = `👋 ¡Hola! Soy **Matrix Agent**.

Puedo ayudarte con:
- 📝 Escribir y editar código
- 🐛 Depurar errores
- 📖 Explicar código
- 🔧 Refactorizar
- 💡 Responder preguntas

**Cómo usar:**
1. Escribe tu pregunta abajo
2. Presiona Enter o haz clic en Enviar
3. Puedes seleccionar código y preguntarme sobre él

¡Pregúntame lo que necesites!`;
/**
 * Obtiene el HTML para el panel de chat
 */
function getChatWebviewContent() {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Matrix Agent Chat</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        :root {
            --bg-primary: #1e1e1e;
            --bg-secondary: #252526;
            --bg-tertiary: #2d2d30;
            --text-primary: #cccccc;
            --text-secondary: #858585;
            --accent: #0078d4;
            --accent-hover: #1a8cde;
            --user-msg-bg: #094771;
            --bot-msg-bg: #2d2d30;
            --border: #3c3c3c;
            --success: #4ec9b0;
            --error: #f14c4c;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: var(--bg-primary);
            color: var(--text-primary);
            height: 100vh;
            display: flex;
            flex-direction: column;
            margin: 0;
            padding: 0;
        }
        
        .chat-header {
            background-color: var(--bg-secondary);
            padding: 12px 16px;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .chat-header h2 {
            font-size: 14px;
            font-weight: 600;
        }
        
        .status-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: var(--success);
        }
        
        .chat-container {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        
        .message {
            max-width: 95%;
            padding: 12px 16px;
            border-radius: 8px;
            line-height: 1.5;
            font-size: 13px;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        
        .message.user {
            background-color: var(--user-msg-bg);
            align-self: flex-end;
            border-bottom-right-radius: 2px;
        }
        
        .message.bot {
            background-color: var(--bot-msg-bg);
            align-self: flex-start;
            border-bottom-left-radius: 2px;
        }
        
        .message.error {
            background-color: rgba(241, 76, 76, 0.2);
            border: 1px solid var(--error);
        }
        
        .message .sender {
            font-size: 11px;
            font-weight: 600;
            margin-bottom: 4px;
            opacity: 0.8;
        }
        
        .message pre {
            background-color: var(--bg-primary);
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
            margin: 8px 0;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 12px;
        }
        
        .message code {
            background-color: var(--bg-primary);
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 12px;
        }
        
        .input-container {
            background-color: var(--bg-secondary);
            padding: 12px;
            border-top: 1px solid var(--border);
        }
        
        .input-wrapper {
            display: flex;
            gap: 8px;
            align-items: flex-end;
        }
        
        .code-toggle {
            background-color: var(--bg-tertiary);
            border: 1px solid var(--border);
            color: var(--text-primary);
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
        }
        
        .code-toggle:hover {
            background-color: var(--accent);
        }
        
        .code-toggle.active {
            background-color: var(--accent);
        }
        
        textarea {
            flex: 1;
            background-color: var(--bg-tertiary);
            border: 1px solid var(--border);
            color: var(--text-primary);
            padding: 10px 12px;
            border-radius: 4px;
            resize: none;
            font-family: inherit;
            font-size: 13px;
            min-height: 40px;
            max-height: 150px;
            outline: none;
            transition: border-color 0.2s;
        }
        
        textarea:focus {
            border-color: var(--accent);
        }
        
        textarea::placeholder {
            color: var(--text-secondary);
        }
        
        .send-button {
            background-color: var(--accent);
            border: none;
            color: white;
            padding: 10px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: background-color 0.2s;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .send-button:hover {
            background-color: var(--accent-hover);
        }
        
        .send-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .typing-indicator {
            display: flex;
            gap: 4px;
            padding: 12px 16px;
            background-color: var(--bot-msg-bg);
            border-radius: 8px;
            align-self: flex-start;
        }
        
        .typing-indicator span {
            width: 8px;
            height: 8px;
            background-color: var(--text-secondary);
            border-radius: 50%;
            animation: typing 1.4s infinite;
        }
        
        .typing-indicator span:nth-child(2) {
            animation-delay: 0.2s;
        }
        
        .typing-indicator span:nth-child(3) {
            animation-delay: 0.4s;
        }
        
        @keyframes typing {
            0%, 60%, 100% {
                transform: translateY(0);
                opacity: 0.4;
            }
            30% {
                transform: translateY(-4px);
                opacity: 1;
            }
        }
        
        .toolbar {
            display: flex;
            gap: 8px;
            margin-bottom: 8px;
            flex-wrap: wrap;
        }
        
        .toolbar button {
            background-color: var(--bg-tertiary);
            border: 1px solid var(--border);
            color: var(--text-primary);
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
            transition: all 0.2s;
        }
        
        .toolbar button:hover {
            background-color: var(--accent);
            border-color: var(--accent);
        }
        
        .code-preview {
            background-color: var(--bg-primary);
            border: 1px solid var(--border);
            padding: 8px;
            border-radius: 4px;
            margin-bottom: 8px;
            max-height: 100px;
            overflow: auto;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 11px;
            white-space: pre-wrap;
            color: var(--text-secondary);
        }
        
        .hidden {
            display: none;
        }
        
        /* Scrollbar styling */
        .chat-container::-webkit-scrollbar {
            width: 8px;
        }
        
        .chat-container::-webkit-scrollbar-track {
            background: var(--bg-primary);
        }
        
        .chat-container::-webkit-scrollbar-thumb {
            background: var(--border);
            border-radius: 4px;
        }
        
        .chat-container::-webkit-scrollbar-thumb:hover {
            background: var(--text-secondary);
        }
    </style>
</head>
<body>
    <div class="chat-header">
        <div class="status-indicator"></div>
        <h2>Matrix Agent</h2>
    </div>
    
    <div class="chat-container" id="chatContainer">
        <!-- Mensajes se agregarán aquí -->
    </div>
    
    <div class="input-container">
        <div class="toolbar">
            <button id="btnSelection" class="code-toggle" title="Incluir código seleccionado">
                📋 + Código
            </button>
            <button id="btnFile" class="code-toggle" title="Incluir archivo actual">
                📄 Archivo
            </button>
            <button id="btnClear" class="code-toggle" title="Limpiar chat">
                🗑️ Limpiar
            </button>
        </div>
        <div id="codePreview" class="code-preview hidden"></div>
        <div class="input-wrapper">
            <textarea 
                id="messageInput" 
                placeholder="Pregúntame cualquier cosa..."
                rows="1"
            ></textarea>
            <button id="sendButton" class="send-button">
                <span>Enviar</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
            </button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const chatContainer = document.getElementById('chatContainer');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const btnSelection = document.getElementById('btnSelection');
        const btnFile = document.getElementById('btnFile');
        const btnClear = document.getElementById('btnClear');
        const codePreview = document.getElementById('codePreview');
        
        let selectedCode = '';
        let currentFileContent = '';
        let isLoading = false;
        
        // Mensaje de bienvenida
        addMessage('bot', 'Matrix Agent', \`${WELCOME_MESSAGE}\`);
        
        // Función para agregar mensajes al chat
        function addMessage(type, sender, content) {
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${type}\`;
            
            if (type === 'bot') {
                messageDiv.innerHTML = \`
                    <div class="sender">${sender}</div>
                    <div class="content">\${formatContent(content)}</div>
                \`;
            } else {
                messageDiv.textContent = content;
            }
            
            chatContainer.appendChild(messageDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        
        // Función para formatear contenido (detectar código)
        function formatContent(content) {
            // Detectar bloques de código
            const codeBlockRegex = /` ``(w + ) ?  : ;
    n([s, S] *  ?  : ) `` `/g;
            let formatted = content.replace(codeBlockRegex, (match, lang, code) => {
                return \`<pre><code>\${escapeHtml(code.trim())}</code></pre>\`;
            });
            
            // Detectar código inline
            formatted = formatted.replace(/\`([^\`]+)\`/g, '<code>$1</code>');
            
            // Detectar negrita
            formatted = formatted.replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>');
            
            // Detectar enlaces
            formatted = formatted.replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, '<a href="$2" target="_blank">$1</a>');
            
            // Convertir saltos de línea
            formatted = formatted.replace(/\\n/g, '<br>');
            
            return formatted;
        }
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        // Mostrar indicador de carga
        function showTypingIndicator() {
            const indicator = document.createElement('div');
            indicator.id = 'typingIndicator';
            indicator.className = 'typing-indicator';
            indicator.innerHTML = '<span></span><span></span><span></span>';
            chatContainer.appendChild(indicator);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        
        // Ocultar indicador de carga
        function hideTypingIndicator() {
            const indicator = document.getElementById('typingIndicator');
            if (indicator) {
                indicator.remove();
            }
        }
        
        // Función para enviar mensaje
        function sendMessage() {
            const message = messageInput.value.trim();
            if (!message || isLoading) return;
            
            // Agregar mensaje del usuario
            addMessage('user', 'Tú', message);
            
            // Construir prompt completo
            let fullPrompt = message;
            if (selectedCode) {
                fullPrompt = \`Código seleccionado:\\n\\\`\\\`\\\`\\n\${selectedCode}\\n\\\`\\\`\\\`\\n\\nPregunta: \${message}\`;
            }
            if (currentFileContent) {
                fullPrompt = \`Contenido del archivo:\\n\\\`\\\`\\\`\\n\${currentFileContent}\\n\\\`\\\`\\\`\\n\\n\${fullPrompt}\`;
            }
            
            // Limpiar input
            messageInput.value = '';
            selectedCode = '';
            currentFileContent = '';
            codePreview.classList.add('hidden');
            codePreview.textContent = '';
            
            // Mostrar indicador de carga
            isLoading = true;
            showTypingIndicator();
            
            // Enviar al backend
            vscode.postMessage({
                type: 'chat',
                prompt: fullPrompt
            });
        }
        
        // Event Listeners
        sendButton.addEventListener('click', sendMessage);
        
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // Auto-resize textarea
        messageInput.addEventListener('input', () => {
            messageInput.style.height = 'auto';
            messageInput.style.height = Math.min(messageInput.scrollHeight, 150) + 'px';
        });
        
        // Botón de selección de código
        btnSelection.addEventListener('click', () => {
            vscode.postMessage({ type: 'getSelection' });
        });
        
        // Botón de archivo actual
        btnFile.addEventListener('click', () => {
            vscode.postMessage({ type: 'getFileContent' });
        });
        
        // Botón de limpiar
        btnClear.addEventListener('click', () => {
            chatContainer.innerHTML = '';
            addMessage('bot', 'Matrix Agent', 'Chat limpiado. ¿En qué puedo ayudarte?');
        });
        
        // Recibir mensajes de la extensión
        window.addEventListener('message', (event) => {
            const message = event.data;
            
            if (message.type === 'selection') {
                if (message.content) {
                    selectedCode = message.content;
                    codePreview.textContent = '📋 Código seleccionado:\\n' + selectedCode;
                    codePreview.classList.remove('hidden');
                    btnSelection.classList.add('active');
                }
            }
            
            if (message.type === 'fileContent') {
                if (message.content) {
                    currentFileContent = message.content;
                    codePreview.textContent = '📄 ' + message.fileName + ':\n' + currentFileContent;
                    codePreview.classList.remove('hidden');
                    btnFile.classList.add('active');
                }
            }
            
            if (message.type === 'response') {
                hideTypingIndicator();
                isLoading = false;
                
                if (message.error) {
                    addMessage('error', 'Error', message.content);
                } else {
                    addMessage('bot', 'Matrix Agent', message.content);
                }
            }
        });
        
        // Solicitar selección inicial
        vscode.postMessage({ type: 'ready' });
    </script>
</body>
</html>`;
}
/**
 * Activación de la extensión
 */
function activate(context) {
    extensionContext = context;
    // Registrar comando para abrir chat
    const disposable = vscode.commands.registerCommand('matrixAgentChat.open', () => {
        showChatPanel();
    });
    context.subscriptions.push(disposable);
    // Registrar view
    vscode.window.registerWebviewViewProvider('matrixAgentChatView', new MatrixAgentChatViewProvider(context));
    // Mostrar notificación de activación
    vscode.window.showInformationMessage('Matrix Agent Chat activado. Usa Ctrl+Shift+P y busca "Matrix Agent" para abrir.');
}
/**
 * Mostrar panel de chat
 */
function showChatPanel() {
    if (currentPanel) {
        currentPanel.reveal(vscode.ViewColumn.Beside, true);
        return;
    }
    currentPanel = vscode.window.createWebviewPanel('matrixAgentChat', 'Matrix Agent', {
        viewColumn: vscode.ViewColumn.Beside,
        preserveFocus: true
    }, {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: []
    });
    currentPanel.webview.html = getChatWebviewContent();
    // Manejar mensajes del WebView
    currentPanel.webview.onDidReceiveMessage(async (message) => {
        await handleWebviewMessage(message, currentPanel);
    });
    currentPanel.onDidDispose(() => {
        currentPanel = undefined;
    });
}
/**
 * Manejar mensajes del WebView
 */
async function handleWebviewMessage(message, panel) {
    switch (message.type) {
        case 'getSelection':
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const selection = editor.document.getText(editor.selection);
                panel.webview.postMessage({
                    type: 'selection',
                    content: selection
                });
            }
            break;
        case 'getFileContent':
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                const content = activeEditor.document.getText();
                const fileName = path.basename(activeEditor.document.fileName);
                panel.webview.postMessage({
                    type: 'fileContent',
                    content: content,
                    fileName: fileName
                });
            }
            break;
        case 'chat':
            try {
                // Aquí puedes conectar con tu API de Matrix Agent
                // Por ahora, simulamos una respuesta
                const response = await simulateMatrixAgentResponse(message.prompt);
                panel.webview.postMessage({
                    type: 'response',
                    content: response
                });
            }
            catch (error) {
                panel.webview.postMessage({
                    type: 'response',
                    error: true,
                    content: `Error: ${error.message || 'No se pudo conectar con Matrix Agent'}`
                });
            }
            break;
    }
}
/**
 * Simular respuesta de Matrix Agent
 * NOTA: Reemplazar con la llamada real a tu API de Matrix Agent
 */
async function simulateMatrixAgentResponse(prompt) {
    // Este es un placeholder. Debes implementar la conexión real a tu API.
    // Por ejemplo:
    // const response = await fetch('http://localhost:3000/api/chat', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ prompt })
    // });
    // return await response.text();
    return `📝 **Prompt recibido:**\n\nHe recibido tu mensaje. Para conectarte con Matrix Agent, necesitas configurar la URL de la API en el archivo \`extension.ts\`.\n\n**Configuración necesaria:**\n1. Implementa la conexión HTTP a tu servidor de Matrix Agent\n2. Reemplaza esta función con tu llamada real a la API\n\n\`\`\`typescript\nasync function callMatrixAgentAPI(prompt: string) {\n    const response = await fetch('TU_URL_DE_API', {\n        method: 'POST',\n        headers: { 'Content-Type': 'application/json' },\n        body: JSON.stringify({ prompt })\n    });\n    return await response.json();\n}\n\`\`\`\n\nTu mensaje fue:\n> ${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}`;
}
/**
 * Provider para la vista en el activity bar
 */
class MatrixAgentChatViewProvider {
    constructor(context) {
        this.context = context;
    }
    resolveWebviewView(webviewView) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: []
        };
        webviewView.webview.html = getChatWebviewContent();
        webviewView.webview.onDidReceiveMessage(async (message) => {
            await handleWebviewMessage(message, {
                webview: webviewView.webview
            });
        });
    }
}
// Esta línea es necesaria para que el módulo se exporte correctamente
function createWebviewFromView(view) {
    return {
        webview: view.webview,
        reveal: () => view.show(),
        dispose: () => { }
    };
}
/**
 * Desactivación de la extensión
 */
function deactivate() {
    if (currentPanel) {
        currentPanel.dispose();
    }
}
//# sourceMappingURL=extension.js.map