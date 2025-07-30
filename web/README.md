# Game Anywhere - Frontend

## Descripción
Frontend de la aplicación Game Anywhere, un sistema de batallas de personajes con autenticación y gestión de partidas.

## Características
- ✅ **Autenticación completa** con API real
- ✅ **Gestión de personajes** desde la base de datos
- ✅ **Sistema de batallas** 1v1 y 3v3
- ✅ **Interfaz responsiva** y moderna
- ✅ **Diseño inspirado en Clash Royale** con gradientes azules y dorados

## Estructura del Proyecto

```
web/
├── css/
│   ├── styles.css          # Estilos principales
│   └── dashboard.css       # Estilos del dashboard
├── html/
│   ├── login.html          # Página de inicio de sesión
│   ├── register.html       # Página de registro
│   └── dashboard.html      # Dashboard principal
├── js/
│   ├── apiConfig.js        # Configuración y servicios de API
│   ├── auth.js             # Lógica de autenticación
│   └── dashboard.js        # Funcionalidad del dashboard
├── Images/                 # Recursos gráficos
└── index.html             # Página de bienvenida
```

## Conexión con la API

### Configuración
El frontend se conecta automáticamente a la API según el entorno:
- **Desarrollo**: `http://localhost:3000`
- **Producción**: `https://api-heroes-3l62.onrender.com`

### Endpoints Utilizados

#### Autenticación
- `POST /auth/login` - Iniciar sesión
- `POST /auth/register` - Registrar usuario

#### Personajes
- `GET /api/personajes` - Obtener todos los personajes
- `GET /api/personajes/:id` - Obtener personaje por ID
- `POST /api/personajes` - Crear nuevo personaje
- `PUT /api/personajes/:id` - Actualizar personaje
- `DELETE /api/personajes/:id` - Eliminar personaje
- `GET /api/personajes/sagas` - Obtener sagas disponibles

#### Batallas
- `GET /api/batallas` - Obtener batallas del usuario
- `GET /api/batallas/:id` - Obtener batalla por ID
- `POST /api/batallas` - Crear nueva batalla
- `POST /api/batallas/accion` - Ejecutar acción en batalla
- `DELETE /api/batallas/:id` - Eliminar batalla
- `GET /api/batallas/:id/historial` - Obtener historial de batalla
- `GET /api/batallas/reglas` - Obtener reglas del juego

#### Batallas 3v3
- `GET /api/batallas3v3` - Obtener batallas 3v3
- `POST /api/batallas3v3` - Crear batalla 3v3
- `POST /api/batallas3v3/accion` - Ejecutar acción en batalla 3v3

## Funcionalidades Implementadas

### 🔐 Autenticación
- Login con email y contraseña
- Registro de nuevos usuarios
- Gestión de tokens JWT
- Redirección automática según estado de autenticación

### 👤 Perfil de Usuario
- Visualización de datos del usuario
- Estadísticas de juego
- Gestión de sesión

### ⚔️ Personajes
- Lista dinámica de personajes desde la API
- Filtros por categoría y saga
- Acciones de selección y edición
- Visualización de estadísticas

### 🏆 Batallas
- Lista de batallas del usuario
- Creación de nuevas batallas
- Continuación de batallas existentes
- Eliminación de batallas
- Actualización en tiempo real

### 🎮 Sistema de Juego
- Configuración de partidas 1v1 y 3v3
- Selección de personajes
- Interfaz de batalla
- Ejecución de acciones por turnos

## Tecnologías Utilizadas

- **HTML5** - Estructura semántica
- **CSS3** - Estilos modernos con gradientes y animaciones
- **JavaScript ES6+** - Funcionalidad interactiva
- **Fetch API** - Comunicación con el backend
- **LocalStorage** - Persistencia de datos de sesión

## Instalación y Uso

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd web
   ```

2. **Abrir en el navegador**
   - Simplemente abre `index.html` en tu navegador
   - O usa un servidor local:
   ```bash
   python -m http.server 8000
   # o
   npx serve .
   ```

3. **Configurar la API**
   - Asegúrate de que la API esté ejecutándose
   - Para desarrollo: `http://localhost:3000`
   - Para producción: `https://api-heroes-3l62.onrender.com`

## Características de Diseño

### 🎨 Paleta de Colores
- **Azul principal**: `#0096ff` - Elementos principales
- **Azul claro**: `#00CED1` - Acentos y hover
- **Dorado**: `#FFD700` - Títulos y elementos destacados
- **Gris oscuro**: `#404040` - Fondos y contenedores
- **Blanco**: `#FFFFFF` - Texto principal

### 🌟 Efectos Visuales
- Gradientes suaves y modernos
- Animaciones de hover y transiciones
- Efectos de sombra y blur
- Diseño glassmorphism
- Responsive design

### 📱 Responsive Design
- Mobile-first approach
- Breakpoints: 768px, 480px
- Navegación adaptativa
- Elementos redimensionables

## Estado del Proyecto

### ✅ Completado
- [x] Conexión completa con la API
- [x] Sistema de autenticación
- [x] Gestión de personajes
- [x] Sistema de batallas básico
- [x] Interfaz responsiva
- [x] Manejo de errores
- [x] Persistencia de sesión

### 🚧 En Desarrollo
- [ ] Interfaz de batalla en tiempo real
- [ ] Chat en partidas
- [ ] Sistema de rankings
- [ ] Logros y recompensas
- [ ] Modo espectador

### 📋 Pendiente
- [ ] Notificaciones push
- [ ] Modo offline
- [ ] PWA (Progressive Web App)
- [ ] Tests automatizados
- [ ] Optimización de rendimiento

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Contacto

- **Desarrollador**: [Tu Nombre]
- **Email**: [tu-email@ejemplo.com]
- **Proyecto**: [https://github.com/tu-usuario/api-heroes]

---

**¡Gracias por usar Game Anywhere! 🎮✨** 