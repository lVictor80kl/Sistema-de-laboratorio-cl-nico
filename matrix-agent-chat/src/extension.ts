import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Matrix Agent Chat - Extensión para VS Code/Antigravity
 * Panel lateral de chat con Matrix Agent
 */

// Estado global
let currentPanel: vscode.WebviewPanel | undefined;
let extensionContext: vscode.ExtensionContext | undefined;

/**
 * Activación de la extensión
 */
export function activate(context: vscode.ExtensionContext) {
    extensionContext = context;
    
    // Registrar comando para abrir chat
    const disposable = vscode.commands.registerCommand('matrixAgentChat.open', () => {
        showChatPanel(context);
    });
    
    context.subscriptions.push(disposable);
    
    // Registrar view en activity bar
    vscode.window.registerWebviewViewProvider(
        'matrixAgentChatView',
        new MatrixAgentChatViewProvider(context)
    );
    
    // Mostrar notificación de activación
    vscode.window.showInformationMessage('Matrix Agent Chat activado. Presiona Ctrl+Shift+P y busca "Matrix Agent" para abrir.');
}

/**
 * Mostrar panel de chat
 */
function showChatPanel(context: vscode.ExtensionContext) {
    if (currentPanel) {
        currentPanel.reveal(vscode.ViewColumn.Beside, true);
        return;
    }
    
    currentPanel = vscode.window.createWebviewPanel(
        'matrixAgentChat',
        'Matrix Agent',
        {
            viewColumn: vscode.ViewColumn.Beside,
            preserveFocus: true
        },
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );
    
    // Cargar el HTML
    currentPanel.webview.html = getChatWebviewContent(currentPanel.webview, context);
    
    // Manejar mensajes del WebView
    currentPanel.webview.onDidReceiveMessage(async (message) => {
        await handleWebviewMessage(message, currentPanel!);
    });
    
    currentPanel.onDidDispose(() => {
        currentPanel = undefined;
    });
}

/**
 * Obtener el HTML para el panel de chat
 */
function getChatWebviewContent(webview: vscode.Webview, context: vscode.ExtensionContext): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Matrix Agent Chat</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
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
        }
        .chat-header {
            background-color: var(--bg-secondary);
            padding: 12px 16px;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .chat-header h2 { font-size: 14px; font-weight: 600; }
        .status-indicator {
            width: 8px; height: 8px; border-radius: 50%;
            background-color: var(--success);
        }
        .chat-container {
            flex: 1; overflow-y: auto; padding: 16px;
            display: flex; flex-direction: column; gap: 16px;
        }
        .message {
            max-width: 95%; padding: 12px 16px;
            border-radius: 8px; line-height: 1.5;
            font-size: 13px; white-space: pre-wrap; word-wrap: break-word;
        }
        .message.user {
            background-color: var(--user-msg-bg);
            align-self: flex-end; border-bottom-right-radius: 2px;
        }
        .message.bot {
            background-color: var(--bot-msg-bg);
            align-self: flex-start; border-bottom-left-radius: 2px;
        }
        .message.error {
            background-color: rgba(241, 76, 76, 0.2);
            border: 1px solid var(--error);
        }
        .message pre {
            background-color: var(--bg-primary); padding: 10px;
            border-radius: 4px; overflow-x: auto;
            margin: 8px 0; font-family: 'Consolas', 'Monaco', monospace; font-size: 12px;
        }
        .message code {
            background-color: var(--bg-primary); padding: 2px 6px;
            border-radius: 3px; font-family: 'Consolas', 'Monaco', monospace; font-size: 12px;
        }
        .input-container {
            background-color: var(--bg-secondary); padding: 12px;
            border-top: 1px solid var(--border);
        }
        .input-wrapper { display: flex; gap: 8px; align-items: flex-end; }
        .code-toggle {
            background-color: var(--bg-tertiary); border: 1px solid var(--border);
            color: var(--text-primary); padding: 8px 12px;
            border-radius: 4px; cursor: pointer; font-size: 12px;
            transition: all 0.2s;
        }
        .code-toggle:hover, .code-toggle.active { background-color: var(--accent); }
        textarea {
            flex: 1; background-color: var(--bg-tertiary);
            border: 1px solid var(--border); color: var(--text-primary);
            padding: 10px 12px; border-radius: 4px; resize: none;
            font-family: inherit; font-size: 13px;
            min-height: 40px; max-height: 150px; outline: none;
        }
        textarea:focus { border-color: var(--accent); }
        textarea::placeholder { color: var(--text-secondary); }
        .send-button {
            background-color: var(--accent); border: none;
            color: white; padding: 10px 16px; border-radius: 4px;
            cursor: pointer; font-size: 13px; font-weight: 500;
            transition: background-color 0.2s;
        }
        .send-button:hover { background-color: var(--accent-hover); }
        .send-button:disabled { opacity: 0.5; cursor: not-allowed; }
        .typing-indicator {
            display: flex; gap: 4px; padding: 12px 16px;
            background-color: var(--bot-msg-bg); border-radius: 8px;
            align-self: flex-start;
        }
        .typing-indicator span {
            width: 8px; height: 8px; background-color: var(--text-secondary);
            border-radius: 50%; animation: typing 1.4s infinite;
        }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
            30% { transform: translateY(-4px); opacity: 1; }
        }
        .toolbar { display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
        .toolbar button {
            background-color: var(--bg-tertiary); border: 1px solid var(--border);
            color: var(--text-primary); padding: 4px 8px;
            border-radius: 4px; cursor: pointer; font-size: 11px;
        }
        .toolbar button:hover { background-color: var(--accent); border-color: var(--accent); }
        .code-preview {
            background-color: var(--bg-primary); border: 1px solid var(--border);
            padding: 8px; border-radius: 4px; margin-bottom: 8px;
            max-height: 100px; overflow: auto;
            font-family: 'Consolas', 'Monaco', monospace; font-size: 11px;
            white-space: pre-wrap; color: var(--text-secondary);
        }
        .hidden { display: none; }
        .chat-container::-webkit-scrollbar { width: 8px; }
        .chat-container::-webkit-scrollbar-track { background: var(--bg-primary); }
        .chat-container::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
        .chat-container::-webkit-scrollbar-thumb:hover { background: var(--text-secondary); }
        .welcome-box {
            background-color: var(--bot-msg-bg); padding: 16px;
            border-radius: 8px; line-height: 1.6;
        }
        .welcome-box h3 { color: var(--success); margin-bottom: 8px; }
        .welcome-box ul { margin-left: 20px; margin-top: 8px; }
        .welcome-box li { margin-bottom: 4px; }
    </style>
</head>
<body>
    <div class="chat-header">
        <div class="status-indicator"></div>
        <h2>Matrix Agent</h2>
    </div>
    
    <div class="chat-container" id="chatContainer">
        <div class="welcome-box">
            <h3>Hola! Soy Matrix Agent</h3>
            <p>Puedo ayudarte con:</p>
            <ul>
                <li>Escribir y editar codigo</li>
                <li>Depurar errores</li>
                <li>Explicar codigo</li>
                <li>Refactorizar</li>
                <li>Responder preguntas</li>
            </ul>
            <p style="margin-top: 12px; color: var(--text-secondary);">
                <strong>Como usar:</strong><br>
                1. Escribe tu pregunta abajo<br>
                2. Presiona Enter o clic en Enviar<br>
                3. Usa los botones para incluir codigo
            </p>
        </div>
    </div>
    
    <div class="input-container">
        <div class="toolbar">
            <button id="btnSelection" class="code-toggle" title="Incluir codigo seleccionado">
                📋 + Codigo
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
            <textarea id="messageInput" placeholder="Preguntame cualquier cosa..." rows="1"></textarea>
            <button id="sendButton" class="send-button">Enviar</button>
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
        
        function addMessage(type, content) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ' + type;
            
            if (type === 'bot') {
                // Escapar HTML y convertir markdown basico
                let formatted = escapeHtml(content);
                formatted = formatted.replace(/```(\\w+)?\\n?/g, '<pre><code>');
                formatted = formatted.replace(/```/g, '</code></pre>');
                formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
                formatted = formatted.replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>');
                formatted = formatted.replace(/\\n/g, '<br>');
                messageDiv.innerHTML = formatted;
            } else {
                messageDiv.textContent = content;
            }
            
            chatContainer.appendChild(messageDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        function showTypingIndicator() {
            const indicator = document.createElement('div');
            indicator.id = 'typingIndicator';
            indicator.className = 'typing-indicator';
            indicator.innerHTML = '<span></span><span></span><span></span>';
            chatContainer.appendChild(indicator);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        
        function hideTypingIndicator() {
            const indicator = document.getElementById('typingIndicator');
            if (indicator) indicator.remove();
        }
        
        function sendMessage() {
            const message = messageInput.value.trim();
            if (!message || isLoading) return;
            
            addMessage('user', message);
            
            let fullPrompt = message;
            if (selectedCode) {
                fullPrompt = 'Codigo seleccionado:\\n```\\n' + selectedCode + '\\n```\\n\\nPregunta: ' + message;
            }
            if (currentFileContent) {
                fullPrompt = 'Contenido del archivo:\\n```\\n' + currentFileContent + '\\n```\\n\\n' + fullPrompt;
            }
            
            messageInput.value = '';
            selectedCode = '';
            currentFileContent = '';
            codePreview.classList.add('hidden');
            codePreview.textContent = '';
            
            isLoading = true;
            showTypingIndicator();
            
            vscode.postMessage({ type: 'chat', prompt: fullPrompt });
        }
        
        sendButton.addEventListener('click', sendMessage);
        
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        messageInput.addEventListener('input', () => {
            messageInput.style.height = 'auto';
            messageInput.style.height = Math.min(messageInput.scrollHeight, 150) + 'px';
        });
        
        btnSelection.addEventListener('click', () => {
            vscode.postMessage({ type: 'getSelection' });
        });
        
        btnFile.addEventListener('click', () => {
            vscode.postMessage({ type: 'getFileContent' });
        });
        
        btnClear.addEventListener('click', () => {
            chatContainer.innerHTML = '<div class="welcome-box"><h3>Chat limpiado</h3><p>En que puedo ayudarte?</p></div>';
        });
        
        window.addEventListener('message', (event) => {
            const message = event.data;
            
            if (message.type === 'selection' && message.content) {
                selectedCode = message.content;
                codePreview.textContent = '📋 Codigo seleccionado:\\n' + selectedCode;
                codePreview.classList.remove('hidden');
                btnSelection.classList.add('active');
            }
            
            if (message.type === 'fileContent' && message.content) {
                currentFileContent = message.content;
                codePreview.textContent = '📄 ' + message.fileName + ':\n' + currentFileContent;
                codePreview.classList.remove('hidden');
                btnFile.classList.add('active');
            }
            
            if (message.type === 'response') {
                hideTypingIndicator();
                isLoading = false;
                addMessage('bot', message.content);
            }
        });
        
        vscode.postMessage({ type: 'ready' });
    </script>
</body>
</html>`;
}

/**
 * Manejar mensajes del WebView
 */
async function handleWebviewMessage(message: any, panel: vscode.WebviewPanel) {
    switch (message.type) {
        case 'getSelection':
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const selection = editor.document.getText(editor.selection);
                panel.webview.postMessage({ type: 'selection', content: selection });
            }
            break;
            
        case 'getFileContent':
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                const content = activeEditor.document.getText();
                const fileName = path.basename(activeEditor.document.fileName);
                panel.webview.postMessage({ type: 'fileContent', content: content, fileName: fileName });
            }
            break;
            
        case 'chat':
            try {
                const response = await callMatrixAgentAPI(message.prompt);
                panel.webview.postMessage({ type: 'response', content: response });
            } catch (error: any) {
                panel.webview.postMessage({ 
                    type: 'response', 
                    content: 'Error: ' + (error.message || 'No se pudo conectar con Matrix Agent')
                });
            }
            break;
    }
}

/**
 * Llamar a la API de Matrix Agent
 * IMPORTANTE: Reemplaza la URL con la de tu servidor
 */
async function callMatrixAgentAPI(prompt: string): Promise<string> {
    // ============================================
    // CONFIGURAR ESTA URL SEGUN TU SERVIDOR
    // ============================================
    const API_URL = 'http://localhost:3000/api/chat';
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt })
        });
        
        if (!response.ok) {
            throw new Error('Error HTTP: ' + response.status);
        }
        
        const data = await response.json();
        return data.response || data.message || data.content || JSON.stringify(data);
    } catch (error: any) {
        // Respuesta de fallback cuando no hay servidor
        return '📝 Mensaje recibido: ' + prompt.substring(0, 100) + '...\n\n' +
               '⚠️ Para conectarte con Matrix Agent, necesitas:\n\n' +
               '1. Ejecutar un servidor de Matrix Agent\n' +
               '2. Actualizar la URL en src/extension.ts (linea ~160)\n' +
               '3. Reiniciar la extension\n\n' +
               'La extension esta funcionando correctamente!';
    }
}

/**
 * Provider para la vista en el activity bar
 */
class MatrixAgentChatViewProvider implements vscode.WebviewViewProvider {
    constructor(private context: vscode.ExtensionContext) {}
    
    resolveWebviewView(webviewView: vscode.WebviewView) {
        webviewView.webview.options = { enableScripts: true };
        webviewView.webview.html = getChatWebviewContent(webviewView.webview, this.context);
        
        webviewView.webview.onDidReceiveMessage(async (message) => {
            await handleWebviewMessage(message, {
                webview: webviewView.webview
            } as vscode.WebviewPanel);
        });
    }
}

/**
 * Desactivación de la extensión
 */
export function deactivate() {
    if (currentPanel) {
        currentPanel.dispose();
    }
}
