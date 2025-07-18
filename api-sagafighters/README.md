# API Saga Fighters

Estructura basada en Onion Architecture para una WebAPI en JavaScript con Swagger para documentación.

## Estructura de Carpetas

```
/src
  /domain
    /models         # Entidades y objetos de dominio puro
    /services       # Lógica de negocio pura
    /repositories   # Interfaces de repositorios (contratos)
  /application
    /usecases       # Casos de uso
  /infrastructure
    /repositories   # Implementaciones concretas de los repositorios
  /presentation
    /routes         # Rutas HTTP y controladores
  /config           # Configuración de la app (env, logger, etc)
  /shared           # Utilidades, helpers, constantes, errores comunes
index.js            # Entry point de la app
package.json
README.md
```

## Descripción
- **Onion Architecture**: Separación clara de responsabilidades y dependencias.
- **Swagger**: Para documentación y prueba de endpoints.
- **JavaScript**: Backend puro JS (Node.js).

## Primeros pasos
1. Instalar dependencias: `npm install`
2. Ejecutar la app: `npm start`
3. Acceder a la documentación Swagger en `/api-docs` (cuando esté implementado) 