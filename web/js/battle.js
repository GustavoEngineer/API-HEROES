// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://api-heroes-3l62.onrender.com';

// Battle System for 1v1 and Team Battles
class BattleSystem {
    constructor() {
        this.currentBattle = null;
        this.character1 = null;
        this.character2 = null;
        this.currentTurn = 1; // 1 = personaje1, 2 = personaje2
        this.gameHistory = [];
        this.gameStartTime = Date.now();
        
        // Propiedades para batallas en equipo
        this.isTeamBattle = false;
        this.teamData = null;
        this.currentTeamCharacter = null;
        this.teamCharacters = [];
        
        this.init();
    }

    async init() {
        try {
            // Verificar conectividad de la API
            await this.checkAPIConnection();
            
            // Verificar si es una batalla en equipo
            this.checkTeamBattle();
            
            await this.loadBattleData();
            this.setupEventListeners();
            this.updateUI();
            
            // Iniciar actualización automática de UI
            this.startAutoUpdate();
        } catch (error) {
            console.error('Error inicializando batalla:', error);
            
            // Manejar errores específicos
            if (error.message.includes('No hay token de autenticación')) {
                alert('No hay token de autenticación. Por favor, inicia sesión nuevamente.');
                window.location.href = 'login.html';
                return;
            }
            
            if (error.message.includes('No se pudo crear una nueva batalla')) {
                // Ya se maneja en createNewBattle
                return;
            }
            
            // Para otros errores, mostrar mensaje y opciones
            const userChoice = confirm(`Error: ${error.message}\n\n¿Quieres intentar crear una nueva batalla o ir al dashboard?`);
            if (userChoice) {
                // Intentar crear nueva batalla
                const token = localStorage.getItem('token');
                if (token) {
                    try {
                        await this.createNewBattle(token);
                    } catch (createError) {
                        console.error('Error creando nueva batalla:', createError);
                        window.location.href = 'dashboard.html';
                    }
                } else {
                    window.location.href = 'dashboard.html';
                }
            } else {
                window.location.href = 'dashboard.html';
            }
        }
    }

    async checkAPIConnection() {
        try {
            console.log('Verificando conectividad de la API...');
            const response = await fetch(`${API_BASE_URL}/api-docs`);
            
            if (!response.ok) {
                console.warn(`API health check falló: ${response.status} ${response.statusText}`);
                // No lanzar error, solo mostrar advertencia
                return;
            }
            
            console.log('API conectada correctamente');
        } catch (error) {
            console.warn('Error de conectividad:', error);
            // No lanzar error, solo mostrar advertencia
            // La aplicación puede continuar funcionando
        }
    }

    async loadBattleData() {
        try {
            console.log('Iniciando carga de datos de batalla...');
            
            // Obtener token primero
            const token = localStorage.getItem('token');
            console.log('Token encontrado:', !!token);
            
            if (!token) {
                throw new Error('No hay token de autenticación. Por favor, inicia sesión nuevamente.');
            }

            // Obtener ID de batalla
            const battleId = this.getBattleId();
            console.log('Battle ID:', battleId);
            
            if (!battleId) {
                // Si no hay battleId, primero buscar batallas existentes
                console.log('No hay battleId, buscando batallas existentes...');
                
                // Mostrar mensaje al usuario
                const loadingDiv = document.createElement('div');
                loadingDiv.id = 'loading-message';
                loadingDiv.innerHTML = `
                    <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                                background: rgba(0,0,0,0.9); color: white; padding: 20px; border-radius: 10px; 
                                z-index: 9999; text-align: center;">
                        <h3>Buscando batalla existente...</h3>
                        <p>Espera un momento mientras recuperamos tu batalla.</p>
                    </div>
                `;
                document.body.appendChild(loadingDiv);
                
                try {
                    const foundExisting = await this.findExistingBattle(token);
                    
                    // Remover mensaje de carga
                    const loadingElement = document.getElementById('loading-message');
                    if (loadingElement) {
                        loadingElement.remove();
                    }
                    
                    if (!foundExisting) {
                        // Si no se encontraron batallas existentes, crear una nueva
                        console.log('No se encontraron batallas existentes, creando nueva...');
                        await this.createNewBattle(token);
                        return;
                    }
                    // Si se encontró una batalla existente, la página se recargará automáticamente
                    return;
                } catch (error) {
                    // Remover mensaje de carga en caso de error
                    const loadingElement = document.getElementById('loading-message');
                    if (loadingElement) {
                        loadingElement.remove();
                    }
                    
                    console.error('Error en búsqueda de batallas existentes:', error);
                    
                    // Si es una batalla en equipo y no se puede crear automáticamente, redirigir al dashboard
                    if (this.isTeamBattle) {
                        alert('No se encontró una batalla en equipo existente. Por favor, regresa al dashboard y crea una nueva partida.');
                        window.location.href = 'dashboard.html';
                        return;
                    }
                    
                    // Para batallas 1v1, intentar crear nueva batalla como fallback
                    await this.createNewBattle(token);
                    return;
                }
            }

            // Verificar parámetros de URL para detectar tipo de batalla
            this.checkTeamBattle();
            
            // Intentar cargar como batalla en equipo primero si se especificó
            if (this.isTeamBattle) {
                try {
                    await this.loadTeamBattleData(battleId, token);
                    console.log('Batalla en equipo cargada exitosamente');
                } catch (error) {
                    console.log('Error cargando como batalla en equipo, intentando como 1v1:', error.message);
                    this.isTeamBattle = false;
                    await this.load1v1BattleData(battleId, token);
                }
            } else {
                // Intentar cargar como batalla 1v1
                try {
                    await this.load1v1BattleData(battleId, token);
                    console.log('Batalla 1v1 cargada exitosamente');
                } catch (error) {
                    console.log('Error cargando como batalla 1v1, intentando como equipo:', error.message);
                    this.isTeamBattle = true;
                    await this.loadTeamBattleData(battleId, token);
                }
            }
            
            console.log('Carga de datos completada exitosamente');
        } catch (error) {
            console.error('Error en loadBattleData:', error);
            throw error;
        }
    }

    checkTeamBattle() {
        // Verificar parámetros de URL para detectar batalla en equipo
        const urlParams = new URLSearchParams(window.location.search);
        const battleMode = urlParams.get('mode');
        const teamId = urlParams.get('team');
        
        if (battleMode === 'team' || teamId) {
            this.isTeamBattle = true;
            console.log('Batalla en equipo detectada por parámetros de URL');
        }
        
        // La detección final se hará cuando se carguen los datos desde la API
        // en loadTeamBattleData o load1v1BattleData
    }

    async loadTeamBattleData(battleId, token) {
        try {
            console.log('Cargando datos de batalla en equipo desde la API...');
            
            // Cargar datos de la batalla desde la API
            const battleResponse = await fetch(`${API_BASE_URL}/api/batallas3v3/${battleId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Respuesta de la API de batalla en equipo:', battleResponse.status, battleResponse.statusText);

            if (!battleResponse.ok) {
                const errorData = await battleResponse.json().catch(() => ({}));
                throw new Error(`Error al cargar batalla en equipo: ${battleResponse.status} - ${errorData.error || battleResponse.statusText}`);
            }

            this.currentBattle = await battleResponse.json();
            console.log('Datos de batalla en equipo cargados:', this.currentBattle);
            
            // Extraer información de equipos desde la respuesta de la API
            this.teamData = {
                equipo1: this.currentBattle.equipo1 || [],
                equipo2: this.currentBattle.equipo2 || []
            };
            
            // Cargar información de todos los personajes del equipo
            await this.loadTeamCharacters();
            
            // Actualizar estado inicial
            this.currentTurn = this.currentBattle.TurnoActual || 1;
            this.gameHistory = this.currentBattle.historial || [];
            
        } catch (error) {
            console.error('Error cargando batalla en equipo:', error);
            throw error;
        }
    }

    async load1v1BattleData(battleId, token) {
        try {
            // Cargar datos de la batalla 1v1
            console.log('Intentando conectar a:', `${API_BASE_URL}/api/batallas/${battleId}`);
            
            const battleResponse = await fetch(`${API_BASE_URL}/api/batallas/${battleId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Respuesta de la API:', battleResponse.status, battleResponse.statusText);

            if (!battleResponse.ok) {
                const errorData = await battleResponse.json().catch(() => ({}));
                throw new Error(`Error al cargar batalla: ${battleResponse.status} - ${errorData.error || battleResponse.statusText}`);
            }

            this.currentBattle = await battleResponse.json();
            console.log('Datos de batalla cargados:', this.currentBattle);
            console.log('Energía Personaje 1:', this.currentBattle.estadoPersonaje1?.Energia);
            console.log('Energía Personaje 2:', this.currentBattle.estadoPersonaje2?.Energia);
            
            // Cargar información completa de los personajes
            await this.loadCharacterDetails();
            
            // Actualizar estado inicial
            this.currentTurn = this.currentBattle.TurnoActual;
            this.gameHistory = this.currentBattle.historial || [];
        } catch (error) {
            console.error('Error cargando batalla 1v1:', error);
            throw error;
        }
    }

    async loadTeamCharacters() {
        try {
            const allCharacterIds = [...this.teamData.equipo1, ...this.teamData.equipo2];
            const token = localStorage.getItem('token');
            
            if (!token) {
                throw new Error('No hay token de autenticación. Por favor, inicia sesión nuevamente.');
            }
            
            console.log('Cargando personajes del equipo desde la API...');
            
            // Cargar TODOS los personajes desde la API
            for (const charId of allCharacterIds) {
                try {
                    const response = await fetch(`${API_BASE_URL}/api/personajes/${charId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    if (response.ok) {
                        const character = await response.json();
                        this.teamCharacters.push(character);
                        console.log(`Personaje ${charId} cargado desde API:`, character);
                    } else {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(`Error al cargar personaje ${charId}: ${response.status} - ${errorData.error || response.statusText}`);
                    }
                } catch (error) {
                    console.error(`Error cargando personaje ${charId}:`, error);
                    throw error;
                }
            }
            
            console.log('Personajes del equipo cargados exitosamente:', this.teamCharacters);
        } catch (error) {
            console.error('Error cargando personajes del equipo:', error);
            throw error;
        }
    }



    async loadCharacterDetails() {
        const token = localStorage.getItem('token');
        
        // Cargar personaje 1
        const char1Response = await fetch(`${API_BASE_URL}/api/personajes/${this.currentBattle.estadoPersonaje1.ID}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        // Cargar personaje 2
        const char2Response = await fetch(`${API_BASE_URL}/api/personajes/${this.currentBattle.estadoPersonaje2.ID}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!char1Response.ok || !char2Response.ok) {
            throw new Error('Error al cargar información de personajes');
        }

        this.character1 = await char1Response.json();
        this.character2 = await char2Response.json();
    }

    getBattleId() {
        // Intentar obtener desde URL parameters primero (prioridad más alta)
        const urlParams = new URLSearchParams(window.location.search);
        const battleIdFromUrl = urlParams.get('battleId');
        if (battleIdFromUrl) {
            console.log('Battle ID encontrado en URL:', battleIdFromUrl);
            return battleIdFromUrl;
        }

        // Intentar obtener desde localStorage
        const battleInfo = localStorage.getItem('currentBattle');
        if (battleInfo) {
            try {
                const battle = JSON.parse(battleInfo);
                if (battle.id) {
                    console.log('Battle ID encontrado en localStorage:', battle.id);
                    return battle.id;
                }
            } catch (error) {
                console.error('Error parsing battle info:', error);
            }
        }

        // Intentar obtener desde sessionStorage
        const sessionBattleInfo = sessionStorage.getItem('currentBattle');
        if (sessionBattleInfo) {
            try {
                const battle = JSON.parse(sessionBattleInfo);
                if (battle.id) {
                    console.log('Battle ID encontrado en sessionStorage:', battle.id);
                    return battle.id;
                }
            } catch (error) {
                console.error('Error parsing session battle info:', error);
            }
        }

        console.log('No se encontró Battle ID');
        return null;
    }

    setupEventListeners() {
        // Event listeners para botones de acción
        document.querySelectorAll('.action-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.currentTarget.getAttribute('data-action');
                this.executeAction(action);
            });
        });

        // Event listeners para modales
        document.querySelectorAll('.character-portrait').forEach(portrait => {
            portrait.addEventListener('click', (e) => {
                const character = e.currentTarget.getAttribute('data-character');
                
                if (this.isTeamBattle) {
                    // Para batallas en equipo, mostrar modal de equipo
                    this.showTeamModal();
                } else {
                    // Para batallas 1v1, mostrar modal de personaje
                    this.showCharacterModal(character);
                }
            });
        });

        // Configurar teclas
        this.setupKeyBindings();
    }

    setupKeyBindings() {
        const keyBindings = {
            'KeyX': 'Ultra Move',
            'KeyC': 'Ataque Fuerte', 
            'KeyV': 'Defender',
            'KeyB': 'Ataque Básico',
            'KeyN': 'Cargar Energía',
            'KeyM': 'Combo'
        };

        document.addEventListener('keydown', (event) => {
            const action = keyBindings[event.code];
            if (action) {
                event.preventDefault();
                this.executeAction(action);
            }
        });
    }

    async executeAction(action) {
        try {
            const token = localStorage.getItem('token');
            const battleId = this.getBattleId();
            
            // Determinar qué personaje está actuando
            let currentCharacter;
            
            if (this.isTeamBattle) {
                // Para batallas en equipo, obtener el personaje activo
                const rondaActual = this.currentBattle.rondas?.[this.currentBattle.rondaActual - 1];
                if (rondaActual && rondaActual.estadoEquipo1 && rondaActual.estadoEquipo2) {
                    const isTeam1Turn = this.currentTurn === 1;
                    const personajeActivo = isTeam1Turn ? 
                        rondaActual.estadoEquipo1[this.currentBattle.idxActivo1] : 
                        rondaActual.estadoEquipo2[this.currentBattle.idxActivo2];
                    currentCharacter = personajeActivo;
                }
            } else {
                // Para batallas 1v1
                currentCharacter = this.currentTurn === 1 ? 
                    this.currentBattle.estadoPersonaje1 : 
                    this.currentBattle.estadoPersonaje2;
            }
            
            if (!currentCharacter) {
                this.showError('No se pudo determinar el personaje activo');
                return;
            }
            
            // Usar endpoint diferente según el tipo de batalla
            const endpoint = this.isTeamBattle ? '/api/batallas3v3/accion' : '/api/batallas/accion';
            
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    batallaId: battleId,
                    personajeId: currentCharacter.id || currentCharacter.ID,
                    accion: action
                })
            });

            const result = await response.json();

            if (response.ok) {
                // Recargar la batalla completa para obtener el estado actualizado
                await this.loadBattleData();
                
                // Efectos visuales
                this.showActionEffect(action);
                
                // Actualizar UI
                this.updateUI();
                
                // Verificar si la batalla terminó
                if (result.ganador) {
                    this.handleBattleEnd(result.ganador);
                }
            } else {
                this.showError(result.error || 'Error al ejecutar acción');
            }
        } catch (error) {
            console.error('Error ejecutando acción:', error);
            this.showError('Error de conexión');
        }
    }



    addToHistory(message) {
        this.gameHistory.push({
            mensaje: message,
            timestamp: new Date().toLocaleTimeString()
        });
    }

    isCharacterActive(charId) {
        // Verificar si el personaje está actualmente peleando
        if (this.isTeamBattle) {
            // Para batallas en equipo, verificar el personaje activo
            const rondaActual = this.currentBattle.rondas?.[this.currentBattle.rondaActual - 1];
            if (rondaActual && rondaActual.estadoEquipo1 && rondaActual.estadoEquipo2) {
                const isTeam1Turn = this.currentTurn === 1;
                const personajeActivo = isTeam1Turn ? 
                    rondaActual.estadoEquipo1[this.currentBattle.idxActivo1] : 
                    rondaActual.estadoEquipo2[this.currentBattle.idxActivo2];
                return personajeActivo?.id === charId || personajeActivo?.ID === charId;
            }
            return false;
        } else {
            // Para batallas 1v1
            if (this.currentTurn === 1) {
                return this.currentBattle.estadoPersonaje1?.ID === charId;
            } else {
                return this.currentBattle.estadoPersonaje2?.ID === charId;
            }
        }
    }

    async findExistingBattle(token) {
        try {
            console.log('Buscando batallas existentes...');
            
            // Verificar parámetros de URL para determinar tipo de batalla
            const urlParams = new URLSearchParams(window.location.search);
            const battleMode = urlParams.get('mode');
            
            let endpoint = '/api/batallas';
            if (battleMode === 'team') {
                endpoint = '/api/batallas3v3';
            }
            
            console.log('Consultando endpoint:', endpoint);
            
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                console.error('Error response:', response.status, response.statusText);
                throw new Error(`Error al obtener batallas: ${response.status} - ${response.statusText}`);
            }
            
            const responseText = await response.text();
            console.log('Response text:', responseText);
            
            let batallas;
            try {
                batallas = JSON.parse(responseText);
            } catch (e) {
                console.error('Error parsing batallas response:', e);
                throw new Error(`Error al parsear respuesta de batallas: ${responseText}`);
            }
            
            console.log('Batallas encontradas:', batallas);
            
            if (batallas && batallas.length > 0) {
                // Buscar primero una batalla activa o en curso
                let batallaSeleccionada = null;
                
                // Prioridad 1: Batallas en curso
                batallaSeleccionada = batallas.find(b => b.estado === 'En curso' || b.estado === 'Activa');
                console.log('Batallas en curso encontradas:', batallas.filter(b => b.estado === 'En curso' || b.estado === 'Activa'));
                
                // Prioridad 2: Batallas pendientes
                if (!batallaSeleccionada) {
                    batallaSeleccionada = batallas.find(b => b.estado === 'Pendiente' || b.estado === 'Iniciada');
                    console.log('Batallas pendientes encontradas:', batallas.filter(b => b.estado === 'Pendiente' || b.estado === 'Iniciada'));
                }
                
                // Prioridad 3: Última batalla (si no hay activas)
                if (!batallaSeleccionada) {
                    batallaSeleccionada = batallas[batallas.length - 1];
                    console.log('Usando última batalla:', batallaSeleccionada);
                }
                
                console.log('Batalla seleccionada:', batallaSeleccionada);
                
                // Guardar el ID de la batalla encontrada
                localStorage.setItem('currentBattle', JSON.stringify({
                    id: batallaSeleccionada.id,
                    tipo: battleMode === 'team' ? '3v3' : '1v1'
                }));
                
                // Recargar la página con el battleId encontrado
                const currentUrl = new URL(window.location);
                currentUrl.searchParams.set('battleId', batallaSeleccionada.id);
                console.log('Redirigiendo a:', currentUrl.toString());
                window.location.href = currentUrl.toString();
                return true;
            }
            
            console.log('No se encontraron batallas');
            return false; // No se encontraron batallas
        } catch (error) {
            console.error('Error buscando batallas existentes:', error);
            return false;
        }
    }

    async createNewBattle(token) {
        try {
            console.log('Creando nueva batalla...');
            
            // Verificar parámetros de URL para determinar tipo de batalla
            const urlParams = new URLSearchParams(window.location.search);
            const battleMode = urlParams.get('mode');
            
            let endpoint = '/api/batallas';
            let body = {};
            
            if (battleMode === 'team') {
                // Para batallas en equipo, no crear automáticamente sin datos válidos
                throw new Error('No se pueden crear batallas en equipo automáticamente. Por favor, regresa al dashboard y crea una nueva partida.');
            } else {
                // Crear batalla 1v1
                const personaje1Id = urlParams.get('personaje1') || 1;
                const personaje2Id = urlParams.get('personaje2') || 2;
                
                body = {
                    personaje1Id: parseInt(personaje1Id),
                    personaje2Id: parseInt(personaje2Id)
                };
            }
            
            console.log('Endpoint:', endpoint);
            console.log('Body:', JSON.stringify(body, null, 2));
            
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });
            
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
            // Obtener el texto de la respuesta primero
            const responseText = await response.text();
            console.log('Response text:', responseText);
            
            let newBattle;
            try {
                newBattle = JSON.parse(responseText);
            } catch (e) {
                console.error('Error parsing response as JSON:', e);
                throw new Error(`Error al parsear respuesta de la API: ${responseText}`);
            }
            
            if (!response.ok) {
                throw new Error(`Error al crear batalla: ${response.status} - ${newBattle.error || newBattle.message || response.statusText}`);
            }
            
            console.log('Nueva batalla creada:', newBattle);
            
            // Guardar el ID de la nueva batalla en localStorage
            localStorage.setItem('currentBattle', JSON.stringify({
                id: newBattle.id,
                tipo: battleMode === 'team' ? '3v3' : '1v1'
            }));
            
            // Recargar la página con el nuevo battleId
            const currentUrl = new URL(window.location);
            currentUrl.searchParams.set('battleId', newBattle.id);
            window.location.href = currentUrl.toString();
            
        } catch (error) {
            console.error('Error creando nueva batalla:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack
            });
            
            // Mostrar error más detallado
            const errorMessage = `Error al crear batalla:\n${error.message}\n\nRevisa la consola para más detalles.`;
            alert(errorMessage);
            
            // Redirigir al dashboard
            window.location.href = 'dashboard.html';
        }
    }

    showActionEffect(action) {
        const button = document.querySelector(`[data-action="${action}"]`);
        if (button) {
            // Remover clases anteriores
            button.classList.remove('energy-wave-fire', 'energy-wave-weapon', 'energy-wave-shield', 
                                 'energy-wave-punch', 'energy-wave-energy', 'energy-wave-combo');
            
            // Aplicar animación específica
            let animationClass = '';
            switch(action) {
                case 'Ultra Move':
                    animationClass = 'energy-wave-fire';
                    break;
                case 'Ataque Fuerte':
                    animationClass = 'energy-wave-weapon';
                    break;
                case 'Defender':
                    animationClass = 'energy-wave-shield';
                    break;
                case 'Ataque Básico':
                    animationClass = 'energy-wave-punch';
                    break;
                case 'Cargar Energía':
                    animationClass = 'energy-wave-energy';
                    break;
                case 'Combo':
                    animationClass = 'energy-wave-combo';
                    break;
            }
            
            if (animationClass) {
                button.classList.add(animationClass);
                setTimeout(() => {
                    button.classList.remove(animationClass);
                }, 500);
            }
        }
    }

    updateUI() {
        if (!this.currentBattle) return;

        // Actualizar nombres de personajes
        this.updateCharacterNames();
        
        // Actualizar estadísticas
        this.updateCharacterStats();
        
        // Actualizar indicador de turno
        this.updateTurnIndicator();
        
        // Actualizar historial
        this.updateHistory();
        
        // Actualizar indicadores de combo
        this.updateComboIndicators();
    }

    updateCharacterNames() {
        if (this.isTeamBattle) {
            // Para batallas en equipo, obtener los personajes activos
            const rondaActual = this.currentBattle.rondas?.[this.currentBattle.rondaActual - 1];
            const personaje1Activo = rondaActual?.estadoEquipo1?.[this.currentBattle.idxActivo1];
            const personaje2Activo = rondaActual?.estadoEquipo2?.[this.currentBattle.idxActivo2];
            
            // Personaje 1 (lado izquierdo)
            const char1Name = document.querySelector('.character-side:first-child .character-name');
            const char1Status = document.querySelector('.character-side:first-child .character-status');
            if (char1Name) {
                char1Name.textContent = personaje1Activo?.nombre || 'Personaje 1';
            }
            if (char1Status) {
                const estado = personaje1Activo?.estado || 'Normal';
                char1Status.textContent = estado;
                char1Status.className = `character-status ${estado.toLowerCase()}`;
            }

            // Personaje 2 (lado derecho)
            const char2Name = document.querySelector('.character-side:last-child .character-name');
            const char2Status = document.querySelector('.character-side:last-child .character-status');
            if (char2Name) {
                char2Name.textContent = personaje2Activo?.nombre || 'Personaje 2';
            }
            if (char2Status) {
                const estado = personaje2Activo?.estado || 'Normal';
                char2Status.textContent = estado;
                char2Status.className = `character-status ${estado.toLowerCase()}`;
            }
        } else {
            // Para batallas 1v1
            const char1Name = document.querySelector('.character-side:first-child .character-name');
            const char1Status = document.querySelector('.character-side:first-child .character-status');
            if (char1Name) {
                char1Name.textContent = this.currentBattle.estadoPersonaje1?.Nombre || 'Goku';
            }
            if (char1Status) {
                const estado = this.currentBattle.estadoPersonaje1?.Estado || 'Normal';
                char1Status.textContent = estado;
                char1Status.className = `character-status ${estado.toLowerCase()}`;
            }

            const char2Name = document.querySelector('.character-side:last-child .character-name');
            const char2Status = document.querySelector('.character-side:last-child .character-status');
            if (char2Name) {
                char2Name.textContent = this.currentBattle.estadoPersonaje2?.Nombre || 'Vegeta';
            }
            if (char2Status) {
                const estado = this.currentBattle.estadoPersonaje2?.Estado || 'Normal';
                char2Status.textContent = estado;
                char2Status.className = `character-status ${estado.toLowerCase()}`;
            }
        }
    }

    updateCharacterStats() {
        // Valores por defecto para cuando no hay datos
        const defaultStats = {
            HP: 100,
            Energia: 50,
            Combo: 0,
            Ultra: 0,
            UltraUsado: false,
            Estado: 'Normal'
        };

        if (this.isTeamBattle) {
            // Para batallas en equipo, obtener los personajes activos
            const rondaActual = this.currentBattle.rondas?.[this.currentBattle.rondaActual - 1];
            if (rondaActual && rondaActual.estadoEquipo1 && rondaActual.estadoEquipo2) {
                const personaje1Activo = rondaActual.estadoEquipo1[this.currentBattle.idxActivo1];
                const personaje2Activo = rondaActual.estadoEquipo2[this.currentBattle.idxActivo2];
                
                // Siempre actualizar, usando datos válidos o por defecto
                this.updateCharacterBars('left', personaje1Activo || defaultStats);
                this.updateCharacterBars('right', personaje2Activo || defaultStats);
            } else {
                // Si no hay datos de ronda, usar valores por defecto
                this.updateCharacterBars('left', defaultStats);
                this.updateCharacterBars('right', defaultStats);
            }
        } else {
            // Para batallas 1v1
            const char1Stats = this.currentBattle.estadoPersonaje1;
            const char2Stats = this.currentBattle.estadoPersonaje2;
            
            // Siempre actualizar, usando datos válidos o por defecto
            this.updateCharacterBars('left', char1Stats || defaultStats);
            this.updateCharacterBars('right', char2Stats || defaultStats);
        }
    }

    updateCharacterBars(side, stats) {
        const sideSelector = side === 'left' ? '.character-side:first-child' : '.character-side:last-child';
        const container = document.querySelector(sideSelector);
        
        if (!container) return;
        
        // Asegurar que stats existe y tiene las propiedades necesarias
        const safeStats = stats || {
            HP: 100,
            Energia: 50,
            Combo: 0,
            Ultra: 0,
            UltraUsado: false
        };

        // Normalizar las propiedades para manejar tanto HP/hp como Energia/energia
        const hp = (safeStats.HP !== undefined ? safeStats.HP : (safeStats.hp !== undefined ? safeStats.hp : 100));
        const energia = (safeStats.Energia !== undefined ? safeStats.Energia : (safeStats.energia !== undefined ? safeStats.energia : 50));
        const combo = (safeStats.Combo !== undefined ? safeStats.Combo : (safeStats.combo !== undefined ? safeStats.combo : 0));
        const ultra = (safeStats.Ultra !== undefined ? safeStats.Ultra : (safeStats.ultra !== undefined ? safeStats.ultra : 0));
        const ultraUsado = (safeStats.UltraUsado !== undefined ? safeStats.UltraUsado : (safeStats.ultraUsado !== undefined ? safeStats.ultraUsado : false));

        // Actualizar barra de vida
        const healthFill = container.querySelector('.health-fill');
        const healthText = container.querySelector('.health-text');
        if (healthFill && healthText) {
            const healthPercent = (hp / 300) * 100;
            healthFill.style.width = `${healthPercent}%`;
            healthText.textContent = `${hp}/300`;
        }

        // Actualizar barra de energía
        const energyFill = container.querySelector('.energy-fill');
        const energyText = container.querySelector('.energy-text');
        if (energyFill && energyText) {
            const energyPercent = (energia / 50) * 100;
            energyFill.style.width = `${energyPercent}%`;
            energyText.textContent = `${energia}/50`;
        }

        // Actualizar barra de combo
        const comboFill = container.querySelector('.combo-fill');
        const comboText = container.querySelector('.combo-text');
        if (comboFill && comboText) {
            const comboPercent = (combo / 100) * 100;
            comboFill.style.width = `${comboPercent}%`;
            comboText.textContent = `${combo}/100`;
        }

        // Actualizar barra de ultra
        const ultraFill = container.querySelector('.ultra-fill');
        const ultraText = container.querySelector('.ultra-text');
        const ultraBar = container.querySelector('.stat-group:last-child');
        
        if (ultraFill && ultraText && ultraBar) {
            // Ocultar la barra de ultra si ya se usó
            if (ultraUsado) {
                ultraBar.classList.add('hidden');
            } else {
                ultraBar.classList.remove('hidden');
                const ultraPercent = (ultra / 100) * 100;
                ultraFill.style.width = `${ultraPercent}%`;
                ultraText.textContent = `${ultra}/100`;
                
                // Efecto especial cuando ultra está al 100%
                if (ultra >= 100) {
                    ultraFill.style.animation = 'pulse 1s infinite';
                } else {
                    ultraFill.style.animation = 'none';
                }
            }
        }
        
        // Efecto especial cuando combo está al 100%
        if (comboFill && combo >= 100) {
            comboFill.style.animation = 'pulse 1s infinite';
        } else if (comboFill) {
            comboFill.style.animation = 'none';
        }
    }

    updateTurnIndicator() {
        // El indicador de turno se eliminó del HTML
        // Se puede agregar en el futuro si es necesario
    }

    updateHistory() {
        const logContent = document.getElementById('historyLogContent');
        if (!logContent) return;

        logContent.innerHTML = '';
        
        if (this.gameHistory.length === 0) {
            logContent.innerHTML = '<div class="history-entry">No hay acciones registradas aún.</div>';
            return;
        }
        
        this.gameHistory.forEach((entry, index) => {
            const entryElement = document.createElement('div');
            entryElement.className = 'history-entry';
            
            let description = '';
            if (entry.mensaje) {
                // Para batallas en equipo (formato simple)
                description = entry.mensaje;
            } else if (entry.accion) {
                // Para batallas 1v1 (formato de API)
                description = `${entry.atacante} usa ${entry.accion} contra ${entry.defensor}`;
                if (entry.nombreCombo) {
                    description = `${entry.atacante} usa ${entry.nombreCombo} contra ${entry.defensor}`;
                }
                if (entry.nombreUltra) {
                    description = `${entry.atacante} usa ${entry.nombreUltra} contra ${entry.defensor}`;
                }
            } else {
                description = 'Acción realizada';
            }
            
            let damageText = '';
            if (entry.dano && entry.dano > 0) {
                damageText = ` (${entry.dano} daño)`;
            }
            
            entryElement.innerHTML = `
                <strong>Turno ${index + 1}</strong> - ${description}${damageText}
            `;
            logContent.appendChild(entryElement);
        });
        
        // Scroll al final
        logContent.scrollTop = logContent.scrollHeight;
    }

    showCharacterModal(character) {
        let characterData, currentStats;
        
        if (this.isTeamBattle) {
            // Para batallas en equipo, obtener el personaje activo
            const rondaActual = this.currentBattle.rondas?.[this.currentBattle.rondaActual - 1];
            const side = character === '1' ? 'left' : 'right';
            const isLeft = side === 'left';
            
            if (rondaActual && rondaActual.estadoEquipo1 && rondaActual.estadoEquipo2) {
                const personajeActivo = isLeft ? 
                    rondaActual.estadoEquipo1[this.currentBattle.idxActivo1] : 
                    rondaActual.estadoEquipo2[this.currentBattle.idxActivo2];
                
                if (personajeActivo) {
                    // Buscar los datos completos del personaje en teamCharacters
                    characterData = this.teamCharacters.find(char => char.id === personajeActivo.id);
                    currentStats = personajeActivo;
                }
            }
            
            // Si no se encontró, usar valores por defecto
            if (!characterData) {
                characterData = {
                    Nombre: `Personaje ${character}`,
                    Categoria: 'Héroe',
                    Ciudad: 'Desconocida',
                    Saga: 'Desconocida',
                    combo1Name: 'Ataque Básico',
                    combo2Name: 'Ataque Fuerte',
                    combo3Name: 'Combo',
                    ultraName: 'Ultra Move'
                };
                currentStats = {
                    hp: 100,
                    energia: 50,
                    combo: 0,
                    ultra: 0,
                    estado: 'Normal'
                };
            }
        } else {
            // Para batallas 1v1
            characterData = character === '1' ? this.character1 : this.character2;
            currentStats = character === '1' ? this.currentBattle.estadoPersonaje1 : this.currentBattle.estadoPersonaje2;
        }
        
        if (!characterData) return;

        const modal = document.getElementById('characterModal');
        if (!modal) return;

        // Ocultar botones de navegación para batallas 1v1
        const modalActions = document.getElementById('characterModalActions');
        if (modalActions) {
            modalActions.style.display = 'none';
        }

        // Actualizar contenido del modal
        document.getElementById('modalCharacterName').textContent = characterData.Nombre;
        document.getElementById('modalCharacterRole').textContent = characterData.Categoria;
        
        // Actualizar estado en el modal
        const modalStatus = document.getElementById('modalCharacterStatus');
        if (modalStatus) {
            const estado = currentStats?.Estado || currentStats?.estado || 'Normal';
            modalStatus.textContent = estado;
            modalStatus.className = `character-status ${estado.toLowerCase()}`;
        }
        
        // Normalizar propiedades para el modal
        const hp = currentStats?.HP || currentStats?.hp || characterData.Vida || 300;
        const energia = currentStats?.Energia || currentStats?.energia || characterData.Energia || 50;
        const combo = currentStats?.Combo || currentStats?.combo || 0;
        const ultra = currentStats?.Ultra || currentStats?.ultra || 0;
        const ultraUsado = currentStats?.UltraUsado || currentStats?.ultraUsado || false;
        
        document.getElementById('modalHealth').textContent = `${hp}/300`;
        document.getElementById('modalEnergy').textContent = `${energia}/50`;
        document.getElementById('modalAttack').textContent = characterData.Ataque || 85;
        document.getElementById('modalDefense').textContent = characterData.Defensa || 75;
        
        // Actualizar combo y ultra si existen los elementos en el modal
        const modalCombo = document.getElementById('modalCombo');
        const modalUltra = document.getElementById('modalUltra');
        const modalUltraContainer = modalUltra?.parentElement;
        
        if (modalCombo) {
            modalCombo.textContent = `${combo}/100`;
        }
        if (modalUltra && modalUltraContainer) {
            // Ocultar la estadística de ultra si ya se usó
            if (ultraUsado) {
                modalUltraContainer.classList.add('hidden');
            } else {
                modalUltraContainer.classList.remove('hidden');
                modalUltra.textContent = `${ultra}/100`;
            }
        }
        
        // Crear descripción dinámica
        const description = `${characterData.Nombre} es un ${characterData.Categoria} de ${characterData.Ciudad}, 
        protagonista de la saga ${characterData.Saga}. Sus movimientos especiales incluyen: 
        ${characterData.combo1Name}, ${characterData.combo2Name}, ${characterData.combo3Name} y su 
        movimiento definitivo ${characterData.ultraName}.`;
        
        document.getElementById('modalDescription').textContent = description;
        
        modal.style.display = 'flex';
    }

    handleBattleEnd(winner) {
        // El winner ya viene como el nombre del personaje ganador desde la API
        const winnerName = winner || 'Ganador';
        
        setTimeout(() => {
            alert(`¡${winnerName} ha ganado la batalla!`);
            // Redirigir al dashboard
            window.location.href = 'dashboard.html';
        }, 1000);
    }

    showError(message) {
        alert(`Error: ${message}`);
    }

    startAutoUpdate() {
        // Actualizar UI cada 2 segundos para mantener las barras sincronizadas
        setInterval(() => {
            if (this.currentBattle) {
                this.updateUI();
            }
        }, 2000);
    }

    updateComboIndicators() {
        // Determinar qué personaje está activo
        let currentCharacter;
        
        if (this.isTeamBattle) {
            // Para batallas en equipo, obtener el personaje activo
            const rondaActual = this.currentBattle.rondas?.[this.currentBattle.rondaActual - 1];
            if (rondaActual && rondaActual.estadoEquipo1 && rondaActual.estadoEquipo2) {
                const isTeam1Turn = this.currentTurn === 1;
                const personajeActivo = isTeam1Turn ? 
                    rondaActual.estadoEquipo1[this.currentBattle.idxActivo1] : 
                    rondaActual.estadoEquipo2[this.currentBattle.idxActivo2];
                currentCharacter = personajeActivo || { combo: 0 };
            } else {
                currentCharacter = { combo: 0 };
            }
        } else {
            // Para batallas 1v1
            currentCharacter = this.currentTurn === 1 ? 
                this.currentBattle.estadoPersonaje1 : 
                this.currentBattle.estadoPersonaje2;
        }
        
        // Normalizar la propiedad combo
        const combo = currentCharacter?.Combo || currentCharacter?.combo || 0;
        
        const comboIndicator = document.querySelector('.combo-indicator');
        if (comboIndicator) {
            if (combo >= 61) {
                comboIndicator.textContent = 'AVANZADO';
                comboIndicator.style.background = 'linear-gradient(135deg, #FF4444, #CC0000)';
                comboIndicator.title = 'Combo Avanzado - Daño: 55-70';
            } else if (combo >= 30) {
                comboIndicator.textContent = 'BÁSICO';
                comboIndicator.style.background = 'linear-gradient(135deg, #FFD700, #FFA500)';
                comboIndicator.title = 'Combo Básico - Daño: 35-45';
            } else {
                comboIndicator.textContent = '30+';
                comboIndicator.style.background = 'linear-gradient(135deg, #888888, #666666)';
                comboIndicator.title = 'Combo - Requiere 30+ combo';
            }
        }
    }

    // Funciones para modales
    closeModal() {
        document.getElementById('characterModal').style.display = 'none';
    }

    showConfigModal() {
        document.getElementById('configModal').style.display = 'flex';
    }

    closeConfigModal() {
        document.getElementById('configModal').style.display = 'none';
    }

    showHistoryModal() {
        const modal = document.getElementById('historyModal');
        modal.style.display = 'flex';
        this.updateHistoryStats();
        this.updateHistory();
    }

    closeHistoryModal() {
        document.getElementById('historyModal').style.display = 'none';
    }

    updateHistoryStats() {
        const gameTimeElement = document.getElementById('gameTime');
        if (!gameTimeElement) return;
        
        const currentTime = Date.now();
        const gameTime = Math.floor((currentTime - this.gameStartTime) / 1000);
        const minutes = Math.floor(gameTime / 60);
        const seconds = gameTime % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        gameTimeElement.textContent = timeString;
    }

    exitGame() {
        if (confirm('¿Estás seguro de que quieres salir de la partida?')) {
            localStorage.removeItem('currentBattle');
            window.location.href = 'dashboard.html';
        }
    }

    showHelp() {
        const helpText = `
REGLAS DEL JUEGO

🎮 MECÁNICAS BÁSICAS:
• Los jugadores se alternan por turnos
• Solo el personaje activo puede ejecutar acciones
• Gana el jugador que reduzca el HP del oponente a 0

⚔️ ACCIONES DISPONIBLES:
• Ataque Básico: Daño moderado, gasta 10 energía, gana combo (+10)
• Ataque Fuerte: Daño alto, gasta 20 energía, gana ultra (+6)
• Combo: Daño especial, gasta 30 energía, requiere combo acumulado, gana ultra (+9)
• Defender: Reduce daño recibido, gasta 5 energía, gana ultra (+8) al defender
• Cargar Energía: Recupera 30 energía, gana ultra (+5), queda vulnerable
• Ultra Move: Daño máximo, requiere ultra al 100%

💥 NIVELES DE COMBO:
• Combo Básico (30-60): Daño 35-45, gasta 30 combo
• Combo Avanzado (61-100): Daño 55-70, gasta 40 combo

⚡ SISTEMA DE ENERGÍA:
• Máximo: 50 energía
• Ataque Básico: -10 energía
• Ataque Fuerte: -20 energía
• Combo: -30 energía
• Defender: -5 energía
• Cargar Energía: +30 energía

🛡️ ESTADOS ESPECIALES:
• Vulnerable: Recupera energía pero recibe más daño y gana +5 ultra al ser golpeado
• Defendiendo: Reduce daño recibido y puede contraatacar

💡 CONSEJOS:
• Gestiona tu energía cuidadosamente
• Usa la defensa estratégicamente para ganar ultra
• Los ataques fuertes y combos son las mejores formas de acumular ultra
• Acumula más combo para ataques más poderosos
• El ultra solo se puede usar una vez por ronda
• El ultra se obtiene por ataques fuertes, combos, defensa exitosa, cargar energía y recibir daño estando vulnerable

🎯 OBJETIVO:
Reducir el HP del oponente a 0 para ganar la batalla.
        `;
        
        alert(helpText);
        this.closeConfigModal();
    }

    // Métodos para batallas en equipo
    showTeamModal() {
        const modal = document.getElementById('teamModal');
        const teamList = document.getElementById('teamList');
        const modalTitle = document.getElementById('teamModalTitle');
        
        // Determinar qué equipo mostrar basado en el turno actual
        const currentTeam = this.currentTurn === 1 ? this.teamData.equipo1 : this.teamData.equipo2;
        const teamName = this.currentTurn === 1 ? 'Equipo 1' : 'Equipo 2';
        
        modalTitle.textContent = `${teamName} (${currentTeam.length} miembros)`;
        
        // Limpiar lista anterior
        teamList.innerHTML = '';
        
        // Crear elementos para cada personaje del equipo
        currentTeam.forEach((charId, index) => {
            // Buscar el personaje en el array de personajes cargados desde la API
            const character = this.teamCharacters.find(char => char.id === charId);
            
            if (character) {
                // Determinar si el personaje está activo (peleando)
                const isActive = this.isCharacterActive(charId);
                const teamItem = this.createTeamCharacterItem(character, isActive);
                teamList.appendChild(teamItem);
            } else {
                console.error(`No se encontró personaje con ID: ${charId} en los datos de la API`);
            }
        });
        
        modal.style.display = 'flex';
    }

    createTeamCharacterItem(character, isActive = false) {
        const item = document.createElement('div');
        item.className = `team-character-item ${isActive ? 'active' : ''}`;
        item.setAttribute('data-character-id', character.id);
        
        // Determinar estado del personaje
        let status = 'Disponible';
        let statusClass = '';
        let isBlocked = false;
        
        if (isActive) {
            status = 'Peleando';
            statusClass = 'active';
        } else {
            // Simular que algunos personajes están bloqueados
            if (character.id % 3 === 0) {
                status = 'Bloqueado';
                statusClass = 'blocked';
                isBlocked = true;
                item.classList.add('blocked');
            } else {
                status = 'Disponible';
                statusClass = '';
            }
        }
        
        item.innerHTML = `
            <div class="team-character-avatar">
                <i class="fas fa-user-ninja"></i>
            </div>
            <div class="team-character-info">
                <div class="team-character-name">${character.Nombre}</div>
                <div class="team-character-status ${statusClass}">${status}</div>
            </div>
        `;
        
        // Agregar event listener para mostrar información del personaje
        item.addEventListener('click', () => {
            if (!isBlocked) {
                this.showTeamCharacterInfo(character);
            }
        });
        
        return item;
    }

    showTeamCharacterInfo(character) {
        // Ocultar modal de equipo
        this.closeTeamModal();
        
        // Mostrar modal de información del personaje
        const modal = document.getElementById('characterModal');
        
        // Actualizar contenido del modal
        document.getElementById('modalCharacterName').textContent = character.Nombre;
        document.getElementById('modalCharacterRole').textContent = character.Rol || 'HÉROE';
        document.getElementById('modalHealth').textContent = '300/300';
        document.getElementById('modalEnergy').textContent = '50/50';
        document.getElementById('modalCombo').textContent = '0/100';
        document.getElementById('modalUltra').textContent = '0/100';
        document.getElementById('modalAttack').textContent = character.Ataque || '85';
        document.getElementById('modalDefense').textContent = character.Defensa || '75';
        document.getElementById('modalDescription').textContent = character.Descripcion || 'Guerrero legendario con un corazón puro y un poder increíble.';
        
        // Guardar referencia al personaje actual
        this.currentTeamCharacter = character;
        
        // Agregar botón de regresar al modal si es batalla en equipo
        this.addBackButtonToModal();
        
        modal.style.display = 'flex';
    }

    addBackButtonToModal() {
        // Buscar el modal de personaje y agregar botón de regresar
        const modalBody = document.querySelector('#characterModal .modal-body');
        
        // Verificar si ya existe el botón de regresar
        let backButton = modalBody.querySelector('.back-to-team-btn');
        
        if (!backButton) {
            backButton = document.createElement('button');
            backButton.className = 'team-modal-btn secondary back-to-team-btn';
            backButton.innerHTML = '<i class="fas fa-arrow-left"></i> Regresar al Equipo';
            backButton.onclick = () => this.goBackToTeam();
            
            // Agregar el botón al final del modal
            modalBody.appendChild(backButton);
        }
    }

    closeTeamModal() {
        document.getElementById('teamModal').style.display = 'none';
    }

    goBackToTeam() {
        // Cerrar modal de personaje
        this.closeModal();
        
        // Remover botón de regresar si existe
        const backButton = document.querySelector('.back-to-team-btn');
        if (backButton) {
            backButton.remove();
        }
        
        // Mostrar modal de equipo nuevamente
        this.showTeamModal();
    }
}

    // Inicializar sistema de batalla cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', function() {
        // Hacer las funciones disponibles globalmente para los onclick del HTML
        window.battleSystem = new BattleSystem();
        
        // Funciones globales para modales
        window.showCharacterModal = (character) => window.battleSystem.showCharacterModal(character);
        window.closeModal = () => window.battleSystem.closeModal();
        window.showConfigModal = () => window.battleSystem.showConfigModal();
        window.closeConfigModal = () => window.battleSystem.closeConfigModal();
        window.showHistoryModal = () => window.battleSystem.showHistoryModal();
        window.closeHistoryModal = () => window.battleSystem.closeHistoryModal();
        window.closeTeamModal = () => window.battleSystem.closeTeamModal();
        window.goBackToTeam = () => window.battleSystem.goBackToTeam();
        window.exitGame = () => window.battleSystem.exitGame();
        window.showHelp = () => window.battleSystem.showHelp();

        // Cerrar modal con Escape
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                window.battleSystem.closeModal();
                window.battleSystem.closeConfigModal();
                window.battleSystem.closeHistoryModal();
                window.battleSystem.closeTeamModal();
            }
        });

        // Cerrar modal al hacer clic fuera
        document.addEventListener('click', function(event) {
            const characterModal = document.getElementById('characterModal');
            const configModal = document.getElementById('configModal');
            const historyModal = document.getElementById('historyModal');
            const teamModal = document.getElementById('teamModal');
            
            if (event.target === characterModal) {
                window.battleSystem.closeModal();
            }
            if (event.target === configModal) {
                window.battleSystem.closeConfigModal();
            }
            if (event.target === historyModal) {
                window.battleSystem.closeHistoryModal();
            }
            if (event.target === teamModal) {
                window.battleSystem.closeTeamModal();
            }
        });
    }); 