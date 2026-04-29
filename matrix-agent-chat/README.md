# Matrix Agent Chat - Extensión para Antigravity/VS Code

Extensión que añade un panel lateral de chat con Matrix Agent en tu editor, similar a GitHub Copilot Chat.

## Características

- 💬 Panel de chat integrado en la barra lateral
- 📋 Botón para incluir código seleccionado
- 📄 Botón para incluir archivo actual
- 🎨 Interfaz oscura estilo VS Code
- ⚡ Respuestas en tiempo real

## Requisitos

- Node.js 18+ 
- npm 8+
- Antigravity o VS Code
- Servidor de Matrix Agent (API REST)

## Instalación

### 1. Compilar la extensión

```bash
cd "C:\Users\victo\OneDrive\Escritorio\Programa Laboratorio - Victor\matrix-agent-chat"

# Instalar dependencias
npm install

# Compilar TypeScript
npm run compile
```

### 2. Crear el paquete .vsix

```bash
# Instalar vsce globalmente (si no lo tienes)
npm install -g @vscode/vsce

# Crear el paquete
vsce package
```

Esto generará un archivo `matrix-agent-chat-1.0.0.vsix`

### 3. Instalar en Antigravity

```bash
# Opción 1: Arrastrar el .vsix a Antigravity

# Opción 2: Por línea de comandos
code --install-extension matrix-agent-chat-1.0.0.vsix
```

### 4. Configurar la conexión con Matrix Agent

Abre el archivo `src/extension.ts` y busca la función `simulateMatrixAgentResponse`. 
Reemplázala con tu conexión real a la API de Matrix Agent:

```typescript
async function simulateMatrixAgentResponse(prompt: string): Promise<string> {
    // Reemplaza con la URL de tu servidor de Matrix Agent
    const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer TU_TOKEN'
        },
        body: JSON.stringify({ 
            prompt: prompt,
            context: 'vscode-extension'
        })
    });
    
    if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.response || data.message || data.content;
}
```

## Uso

1. **Abrir el chat**: Presiona `Ctrl+Shift+P` y busca "Matrix Agent"
2. **Barra lateral**: Verás el ícono de chat en la barra de actividad
3. **Enviar mensaje**: Escribe tu pregunta y presiona Enter
4. **Código seleccionado**: Haz clic en "📋 + Código" para incluir código
5. **Archivo actual**: Haz clic en "📄 Archivo" para incluir todo el archivo

## Atajos

| Acción | Atajo |
|--------|-------|
| Abrir Matrix Agent Chat | `Ctrl+Shift+P` → "Matrix Agent" |
| Enviar mensaje | `Enter` |

## Solución de problemas

### La extensión no aparece

1. Reinicia Antigravity
2. Verifica que la extensión esté instalada: `code --list-extensions`

### Error de conexión

1. Verifica que tu servidor de Matrix Agent esté corriendo
2. Comprueba la URL en `extension.ts`
3. Revisa el panel de salida en Antigravity: `View → Output → Matrix Agent`

### No puedo escribir en el chat

1. Asegúrate de que el cursor esté en el campo de texto
2. Verifica que la extensión esté activada

## Estructura del proyecto

```
matrix-agent-chat/
├── package.json          # Configuración de la extensión
├── tsconfig.json         # Configuración TypeScript
├── README.md             # Este archivo
└── src/
    └── extension.ts      # Código principal de la extensión
```

## API esperada de Matrix Agent

La extensión espera que tu servidor de Matrix Agent implemente:

```http
POST /api/chat
Content-Type: application/json

{
    "prompt": "Tu pregunta aquí",
    "context": "vscode-extension"
}

Respuesta esperada:
{
    "response": "Respuesta del agente",
    "message": "Alternativa",
    "content": "Otra alternativa"
}
```

## Personalización

### Cambiar el icono

1. Crea un icono de 128x128px en formato PNG
2. Guárdalo en `src/media/icon.png`
3. Actualiza `package.json` → `contributes.commands[0].icon`

### Cambiar colores

Edita las variables CSS en la función `getChatWebviewContent()`:

```css
:root {
    --bg-primary: #1e1e1e;      /* Fondo principal */
    --accent: #0078d4;           /* Color de acento */
    --user-msg-bg: #094771;      /* Mensajes del usuario */
}
```

## Licencia

MIT - Usado como base para integración con Matrix Agent

---

**Creado**: 2026-03-24
**Versión**: 1.0.0
