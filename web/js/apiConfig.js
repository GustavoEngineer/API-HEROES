// Configuración de la API
const API_CONFIG = {
    // URLs base de la API
    BASE_URL: 'https://api-heroes-3l62.onrender.com', // URL de producción
    LOCAL_URL: 'http://localhost:3000', // URL local para desarrollo
    
    // Endpoints
    ENDPOINTS: {
        // Autenticación
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        
        // Personajes
        PERSONAJES: '/api/personajes',
        PERSONAJE_BY_ID: (id) => `/api/personajes/${id}`,
        SAGAS: '/api/personajes/sagas',
        
        // Batallas
        BATALLAS: '/api/batallas',
        BATALLA_BY_ID: (id) => `/api/batallas/${id}`,
        BATALLA_ACCION: '/api/batallas/accion',
        BATALLA_REGLAS: '/api/batallas/reglas',
        BATALLA_HISTORIAL: (id) => `/api/batallas/${id}/historial`,
        
        // Batallas 3v3
        BATALLAS_3V3: '/api/batallas3v3',
        BATALLA_3V3_BY_ID: (id) => `/api/batallas3v3/${id}`,
        BATALLA_3V3_ACCION: '/api/batallas3v3/accion'
    }
};

// Clase para manejar las peticiones HTTP
class ApiService {
    constructor() {
        this.baseURL = this.getBaseURL();
        this.token = this.getStoredToken();
    }

    // Determinar la URL base según el entorno
    getBaseURL() {
        // En desarrollo, usar localhost si está disponible
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return API_CONFIG.LOCAL_URL;
        }
        return API_CONFIG.BASE_URL;
    }

    // Obtener token del localStorage
    getStoredToken() {
        return localStorage.getItem('authToken');
    }

    // Guardar token en localStorage
    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    // Remover token
    removeToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    // Verificar si el usuario está autenticado
    isAuthenticated() {
        return !!this.token;
    }

    // Headers por defecto
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // Método genérico para hacer peticiones HTTP
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            // Si la respuesta no es exitosa, lanzar error
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error en petición API:', error);
            throw error;
        }
    }

    // Métodos para autenticación
    async login(email, password) {
        const data = await this.request(API_CONFIG.ENDPOINTS.LOGIN, {
            method: 'POST',
            body: JSON.stringify({ correo: email, contrasena: password })
        });
        
        if (data.token) {
            this.setToken(data.token);
        }
        
        return data;
    }

    async register(nombre, email, password) {
        return await this.request(API_CONFIG.ENDPOINTS.REGISTER, {
            method: 'POST',
            body: JSON.stringify({ nombre, correo: email, contrasena: password })
        });
    }

    logout() {
        this.removeToken();
        localStorage.removeItem('userSession');
        sessionStorage.clear();
    }

    // Métodos para personajes
    async getPersonajes(filtros = {}) {
        const queryParams = new URLSearchParams(filtros).toString();
        const endpoint = queryParams ? `${API_CONFIG.ENDPOINTS.PERSONAJES}?${queryParams}` : API_CONFIG.ENDPOINTS.PERSONAJES;
        return await this.request(endpoint);
    }

    async getPersonajeById(id) {
        return await this.request(API_CONFIG.ENDPOINTS.PERSONAJE_BY_ID(id));
    }

    async getSagas() {
        return await this.request(API_CONFIG.ENDPOINTS.SAGAS);
    }

    async crearPersonaje(personajeData) {
        return await this.request(API_CONFIG.ENDPOINTS.PERSONAJES, {
            method: 'POST',
            body: JSON.stringify(personajeData)
        });
    }

    async actualizarPersonaje(id, personajeData) {
        return await this.request(API_CONFIG.ENDPOINTS.PERSONAJE_BY_ID(id), {
            method: 'PUT',
            body: JSON.stringify(personajeData)
        });
    }

    async eliminarPersonaje(id) {
        return await this.request(API_CONFIG.ENDPOINTS.PERSONAJE_BY_ID(id), {
            method: 'DELETE'
        });
    }

    // Métodos para batallas
    async getBatallas() {
        return await this.request(API_CONFIG.ENDPOINTS.BATALLAS);
    }

    async getBatallaById(id) {
        return await this.request(API_CONFIG.ENDPOINTS.BATALLA_BY_ID(id));
    }

    async crearBatalla(personaje1Id, personaje2Id) {
        return await this.request(API_CONFIG.ENDPOINTS.BATALLAS, {
            method: 'POST',
            body: JSON.stringify({ personaje1Id, personaje2Id })
        });
    }

    async ejecutarAccion(batallaId, personajeId, accion) {
        return await this.request(API_CONFIG.ENDPOINTS.BATALLA_ACCION, {
            method: 'POST',
            body: JSON.stringify({ batallaId, personajeId, accion })
        });
    }

    async getReglas() {
        return await this.request(API_CONFIG.ENDPOINTS.BATALLA_REGLAS);
    }

    async getHistorialBatalla(id) {
        return await this.request(API_CONFIG.ENDPOINTS.BATALLA_HISTORIAL(id));
    }

    async eliminarBatalla(id) {
        return await this.request(API_CONFIG.ENDPOINTS.BATALLA_BY_ID(id), {
            method: 'DELETE'
        });
    }

    // Métodos para batallas 3v3
    async getBatallas3v3() {
        return await this.request(API_CONFIG.ENDPOINTS.BATALLAS_3V3);
    }

    async getBatalla3v3ById(id) {
        return await this.request(API_CONFIG.ENDPOINTS.BATALLA_3V3_BY_ID(id));
    }

    async crearBatalla3v3(equipo1, equipo2) {
        return await this.request(API_CONFIG.ENDPOINTS.BATALLAS_3V3, {
            method: 'POST',
            body: JSON.stringify({ equipo1, equipo2 })
        });
    }

    async ejecutarAccion3v3(batallaId, personajeId, accion) {
        return await this.request(API_CONFIG.ENDPOINTS.BATALLA_3V3_ACCION, {
            method: 'POST',
            body: JSON.stringify({ batallaId, personajeId, accion })
        });
    }
}

// Crear instancia global del servicio API
const apiService = new ApiService();

// Exportar para uso en otros archivos
window.apiService = apiService;
window.API_CONFIG = API_CONFIG; 