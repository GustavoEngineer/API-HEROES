# Game Anywhere - Frontend Web

Este es el frontend web de la aplicación Game Anywhere, diseñado con un estilo moderno y gaming-friendly.

## 🎮 Características

- **Diseño Responsivo**: Adaptable a diferentes tamaños de pantalla
- **Tema Gaming**: Colores vibrantes y tipografía especializada para videojuegos
- **Animaciones**: Efectos visuales suaves y atractivos
- **Validación en Tiempo Real**: Validación de formularios con feedback visual
- **Autenticación Completa**: Sistema de login y registro con manejo de tokens
- **Personaje 3D**: Elemento visual animado que flota suavemente

## 📁 Estructura del Proyecto

```
web/
├── html/
│   ├── login.html          # Página de inicio de sesión
│   └── register.html       # Página de registro
├── css/
│   └── styles.css          # Estilos principales
├── js/
│   └── auth.js            # Lógica de autenticación
├── assets/                # Recursos estáticos (imágenes, iconos, etc.)
└── README.md              # Este archivo
```

## 🎨 Diseño y Colores

### Paleta de Colores
- **Verde Principal**: `#00ff88` - Color base del tema
- **Verde Secundario**: `#00cc6a` - Gradientes y acentos
- **Naranja**: `#ff6b35` - Botones y elementos interactivos
- **Naranja Claro**: `#ff8c42` - Hover states
- **Gris Oscuro**: `#1a1a1a` - Textos principales
- **Gris Medio**: `#444` - Elementos secundarios

### Tipografías
- **Orbitron**: Para títulos y elementos destacados (fuente gaming)
- **Rajdhani**: Para texto general y formularios

## 🚀 Cómo Usar

### 1. Abrir las Páginas
- **Login**: Abre `html/login.html` en tu navegador
- **Registro**: Abre `html/register.html` en tu navegador

### 2. Configuración de la API
El frontend está configurado para conectarse con la API en `http://localhost:3000/api`. Si tu API está en una URL diferente, modifica la constante `API_BASE_URL` en `js/auth.js`.

### 3. Funcionalidades

#### Login
- Validación de email/username y contraseña
- Toggle de visibilidad de contraseña
- Mensajes de error/éxito
- Redirección automática tras login exitoso

#### Registro
- Validación de todos los campos requeridos
- Verificación de formato de email
- Validación de longitud de contraseña
- Redirección al login tras registro exitoso

## 🔧 Características Técnicas

### Validación de Formularios
- Validación en tiempo real
- Mensajes de error específicos
- Estilos visuales para campos con error
- Limpieza automática de errores

### Gestión de Autenticación
- Almacenamiento seguro de tokens
- Verificación de expiración (24 horas)
- Redirección automática para páginas protegidas
- Logout con limpieza de datos

### Notificaciones
- Sistema de notificaciones toast
- Diferentes tipos: éxito, error, info
- Animaciones suaves
- Auto-eliminación después de 5 segundos

### Responsive Design
- Mobile-first approach
- Breakpoints en 768px y 480px
- Personaje oculto en pantallas muy pequeñas
- Formularios adaptables

## 🎯 Elementos Visuales

### Personaje 3D
- Creado completamente con CSS
- Animación de flotación suave
- Detalles: pelo verde, chaqueta, zapatos, arma
- Plataforma con sombra

### Efectos Visuales
- Gradientes en botones y fondos
- Sombras y blur effects
- Transiciones suaves
- Hover effects interactivos

### Patrón de Fondo
- Patrón geométrico sutil
- Efecto de profundidad
- No interfiere con la legibilidad

## 🔒 Seguridad

- Validación tanto en frontend como backend
- Tokens de autenticación con expiración
- Sanitización de inputs
- Protección contra XSS básica

## 📱 Compatibilidad

- **Navegadores Modernos**: Chrome, Firefox, Safari, Edge
- **Dispositivos**: Desktop, Tablet, Mobile
- **Resoluciones**: Desde 320px hasta 4K

## 🛠️ Desarrollo

### Para Modificar Estilos
1. Edita `css/styles.css`
2. Los cambios se aplican automáticamente al recargar

### Para Modificar Lógica
1. Edita `js/auth.js`
2. La clase `AuthManager` maneja toda la lógica de autenticación

### Para Agregar Páginas
1. Crea nuevo archivo HTML en `html/`
2. Incluye los mismos enlaces a CSS y JS
3. Usa la misma estructura de header y footer

## 🎨 Personalización

### Cambiar Colores
Modifica las variables CSS en `styles.css`:
```css
:root {
    --primary-green: #00ff88;
    --secondary-green: #00cc6a;
    --accent-orange: #ff6b35;
    --dark-gray: #1a1a1a;
}
```

### Cambiar Tipografías
Actualiza los enlaces de Google Fonts en los archivos HTML:
```html
<link href="https://fonts.googleapis.com/css2?family=TuFuente:wght@400;700&display=swap" rel="stylesheet">
```

## 🚀 Próximas Mejoras

- [ ] Modo oscuro/claro
- [ ] Más animaciones del personaje
- [ ] Sonidos de interfaz
- [ ] Página de dashboard
- [ ] Perfil de usuario
- [ ] Recuperación de contraseña

## 📞 Soporte

Para problemas o sugerencias, revisa:
1. La consola del navegador para errores JavaScript
2. La conexión con la API backend
3. Los logs del servidor

---

**Game Anywhere** - Donde los héroes se conectan 🎮⚡ 