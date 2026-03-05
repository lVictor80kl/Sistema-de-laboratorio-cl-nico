Sistema de Gestión de Laboratorio Clínico es una aplicación web full-stack diseñada para automatizar y digitalizar los procesos de un laboratorio clínico. Permite llevar un control completo de pacientes, pruebas de laboratorio y sus resultados.

Funcionalidades principales:

👤 Registro y gestión de pacientes (cédula, nombre, fecha de nacimiento, sexo)
🧪 Catálogo de pruebas y parámetros configurables (Hematología, Química, Perfiles, etc.)
📋 Creación de órdenes de examen por paciente con control de pago (Pendiente / Pagado) en USD y Bs
📊 Ingreso de resultados por parámetro con detección automática de valores fuera del rango de referencia según edad y sexo del paciente
📄 Generación de reportes en PDF con los resultados organizados
⚙️ Configuración del laboratorio (nombre, licenciada, RIF, teléfono)
Tecnologías:

Capa	Tecnología
Backend	FastAPI · SQLAlchemy · PostgreSQL · Alembic
Frontend	React · Vite · TailwindCSS
Otros	Python 3 · Node.js
