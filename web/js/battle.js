// API Configuration
const API_BASE_URL = 'http://localhost:3000';

// Battle System for 1v1 and 3v3
class BattleSystem {
    constructor() {
        this.currentBattle = null;
        this.character1 = null;
        this.character2 = null;
        this.currentTurn = 1; // 1 = personaje1, 2 = personaje2
        this.gameHistory = [];
        this.gameStartTime = Date.now();
        this.isTeamBattle = false;
        this.teamData = null;
        this.selectedTeamCharacter = null;
        
        this.init();
    }

    async init() {
        try {
            // Verificar conectividad de la API primero
            await this.checkAPIConnection();
            
            await this.loadBattleData();
            this.setupEventListeners();
            this.updateUI();
            
            // Iniciar actualización automática de UI
            this.startAutoUpdate();
        } catch (error) {
            console.error('Error inicializando batalla:', error);
            
            // Si no hay batalla o hay error, mostrar mensaje y permitir continuar
            if (error.message.includes('No se encontró ID de batalla') || 
                error.message.includes('API no responde')) {
                console.log('Modo de demostración activado - sin conexión a API');
                this.setupDemoMode();
                return;
            }
            
            this.showError(`Error al cargar la batalla: ${error.message}`);
        }
    }

    setupDemoMode() {
        console.log('Configurando modo de demostración...');
        
        // Configurar datos de demostración para batalla en equipo
        const demoTeamBattle = {
            id: "demo-team-battle",
            equipo1: [
                { id: "char1", nombre: "Goku" },
                { id: "char2", nombre: "Vegeta" },
                { id: "char3", nombre: "Gohan" }
            ],
            equipo2: [
                { id: "char4", nombre: "Cell" },
                { id: "char5", nombre: "Frieza" },
                { id: "char6", nombre: "Majin Buu" }
            ]
        };
        
        // Guardar datos de demostración
        localStorage.setItem('currentBattle', JSON.stringify(demoTeamBattle));
        
        // Recargar datos
        this.getBattleId();
        this.setupEventListeners();
        this.updateUI();
        
        // Mostrar mensaje informativo para batalla en equipo
        this.showTeamBattleInfo();
        
        console.log('Modo de demostración configurado - Batalla en equipo');
    }

    showTeamBattleInfo() {
        const teamInfo = document.getElementById('teamInfo');
        if (teamInfo && this.isTeamBattle) {
            teamInfo.style.display = 'block';
            // Ocultar después de 5 segundos
            setTimeout(() => {
                teamInfo.style.display = 'none';
            }, 5000);
        }
    }

    async checkAPIConnection() {
        try {
            console.log('Verificando conectividad de la API...');
            const response = await fetch(`${API_BASE_URL}/api-docs`);
            
            if (!response.ok) {
                throw new Error(`API no responde correctamente: ${response.status} ${response.statusText}`);
            }
            
            console.log('API conectada correctamente');
        } catch (error) {
            console.error('Error de conectividad:', error);
            throw new Error(`No se puede conectar a la API en ${API_BASE_URL}. Verifica que el servidor esté corriendo en el puerto 3000.`);
        }
    }

    async loadBattleData() {
        try {
            console.log('Iniciando carga de datos de batalla...');
            
            // Obtener ID de batalla desde localStorage o URL
            const battleId = this.getBattleId();
            console.log('Battle ID:', battleId);
            
            if (!battleId) {
                throw new Error('No se encontró ID de batalla. Verifica que hayas iniciado una batalla desde el dashboard.');
            }

            const token = localStorage.getItem('token');
            console.log('Token encontrado:', !!token);
            
            if (!token) {
                throw new Error('No hay token de autenticación. Por favor, inicia sesión nuevamente.');
            }

            // Cargar datos de la batalla
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
            
            console.log('Carga de datos completada exitosamente');
        } catch (error) {
            console.error('Error en loadBattleData:', error);
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
        // Intentar obtener desde localStorage primero
        const battleInfo = localStorage.getItem('currentBattle');
        if (battleInfo) {
            try {
                const battle = JSON.parse(battleInfo);
                
                // Detectar si es una batalla en equipo
                if (battle.equipo1 && battle.equipo2) {
                    this.isTeamBattle = true;
                    this.teamData = battle;
                    console.log('Batalla en equipo detectada:', battle);
                } else {
                    this.isTeamBattle = false;
                    console.log('Batalla 1v1 detectada');
                }
                
                return battle.id;
            } catch (error) {
                console.error('Error parsing battle info:', error);
            }
        }

        // Intentar obtener desde URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('battleId');
    }

    setupEventListeners() {
        console.log('Configurando event listeners...');
        
        // Event listeners para botones de acción
        const actionButtons = document.querySelectorAll('.action-btn');
        console.log('Botones de acción encontrados:', actionButtons.length);
        
        actionButtons.forEach(button => {
            const action = button.getAttribute('data-action');
            console.log('Configurando botón:', action);
            
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const action = e.currentTarget.getAttribute('data-action');
                console.log('Botón clickeado:', action);
                this.executeAction(action);
            });
        });

        // Event listeners para modales
        const portraits = document.querySelectorAll('.character-portrait');
        console.log('Retratos encontrados:', portraits.length);
        
        portraits.forEach(portrait => {
            portrait.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const character = e.currentTarget.getAttribute('data-character');
                console.log('Retrato clickeado:', character);
                
                if (this.isTeamBattle) {
                    this.showTeamModal(character);
                } else {
                    this.showCharacterModal(character);
                }
            });
        });

        // Configurar teclas
        this.setupKeyBindings();
        
        console.log('Event listeners configurados correctamente');
        
        // Verificación adicional de botones
        setTimeout(() => {
            const actionButtons = document.querySelectorAll('.action-btn');
            console.log('Verificación final - Botones encontrados:', actionButtons.length);
            actionButtons.forEach((btn, index) => {
                console.log(`Botón ${index + 1}:`, btn.getAttribute('data-action'));
            });
        }, 1000);
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
        console.log('executeAction llamado con:', action);
        console.log('isTeamBattle:', this.isTeamBattle);
        console.log('currentBattle:', this.currentBattle);
        
        // Si estamos en modo de demostración (sin API o batalla en equipo), usar lógica local
        if (this.isTeamBattle || !this.currentBattle) {
            console.log('Ejecutando modo de demostración');
            this.executeDemoAction(action);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const battleId = this.getBattleId();
            
            // Determinar qué personaje está actuando
            const currentCharacter = this.currentTurn === 1 ? 
                this.currentBattle.estadoPersonaje1 : 
                this.currentBattle.estadoPersonaje2;
            
            const response = await fetch(`${API_BASE_URL}/api/batallas/accion`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    batallaId: battleId,
                    personajeId: currentCharacter.ID,
                    accion: action
                })
            });

            const result = await response.json();

            if (response.ok) {
                // La API devuelve el estado actualizado en result.estado
                // Necesitamos recargar la batalla completa para obtener el estado actualizado
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

    executeDemoAction(action) {
        console.log('Ejecutando acción de demostración:', action);
        
        // Efectos visuales
        this.showActionEffect(action);
        
        // Agregar entrada al historial con el turno actual
        const teamName = this.currentTurn === 1 ? 'Equipo 1' : 'Equipo 2';
        const actionName = this.getActionDisplayName(action);
        
        console.log('Agregando al historial:', `${teamName} usa ${actionName}`);
        
        this.gameHistory.push({
            mensaje: `${teamName} usa ${actionName}`,
            timestamp: new Date().toLocaleTimeString()
        });
        
        // Simular cambio de turno después de la acción
        this.currentTurn = this.currentTurn === 1 ? 2 : 1;
        console.log('Turno cambiado a:', this.currentTurn);
        
        // Actualizar UI
        this.updateUI();
        
        // Mostrar mensaje de acción
        this.showDemoMessage(`${teamName} usó ${actionName}`);
        
        console.log('Acción de demostración completada');
    }

    // Método para forzar la configuración de event listeners
    forceSetupEventListeners() {
        console.log('Forzando configuración de event listeners...');
        this.setupEventListeners();
    }

    // Método para simular clic en botón de acción
    simulateActionClick(action) {
        console.log('Simulando clic en acción:', action);
        const button = document.querySelector(`[data-action="${action}"]`);
        if (button) {
            console.log('Botón encontrado, simulando clic');
            button.click();
        } else {
            console.log('Botón no encontrado para acción:', action);
        }
    }

    getActionDisplayName(action) {
        const actionNames = {
            'Ultra Move': 'Ultra Move',
            'Ataque Fuerte': 'Ataque Fuerte',
            'Defender': 'Defensa',
            'Ataque Básico': 'Ataque Básico',
            'Cargar Energía': 'Cargar Energía',
            'Combo': 'Combo'
        };
        return actionNames[action] || action;
    }

    showDemoMessage(message) {
        // Crear un mensaje temporal en la pantalla
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 150, 255, 0.9);
            color: white;
            padding: 1rem 2rem;
            border-radius: 12px;
            font-family: 'Fredoka One', cursive;
            z-index: 1000;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            animation: fadeInOut 2s ease-in-out;
        `;
        messageDiv.textContent = message;
        
        // Agregar estilos de animación
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(messageDiv);
        
        // Remover después de 2 segundos
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 2000);
    }

    toggleDemoMode() {
        if (this.isTeamBattle) {
            // Cambiar a modo 1v1
            const demo1v1Battle = {
                id: "demo-1v1-battle",
                estadoPersonaje1: { ID: "char1", Nombre: "Goku", HP: 300, Energia: 50 },
                estadoPersonaje2: { ID: "char2", Nombre: "Vegeta", HP: 300, Energia: 50 }
            };
            localStorage.setItem('currentBattle', JSON.stringify(demo1v1Battle));
            this.isTeamBattle = false;
            this.teamData = null;
            this.showDemoMessage('Cambiado a modo 1v1');
        } else {
            // Cambiar a modo equipo
            const demoTeamBattle = {
                id: "demo-team-battle",
                equipo1: [
                    { id: "char1", nombre: "Goku" },
                    { id: "char2", nombre: "Vegeta" },
                    { id: "char3", nombre: "Gohan" }
                ],
                equipo2: [
                    { id: "char4", nombre: "Cell" },
                    { id: "char5", nombre: "Frieza" },
                    { id: "char6", nombre: "Majin Buu" }
                ]
            };
            localStorage.setItem('currentBattle', JSON.stringify(demoTeamBattle));
            this.isTeamBattle = true;
            this.teamData = demoTeamBattle;
            this.showDemoMessage('Cambiado a modo Equipo');
        }
        
        // Recargar datos y actualizar UI
        this.getBattleId();
        this.gameHistory = [];
        this.currentTurn = 1;
        this.updateUI();
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
        if (!this.currentBattle && !this.isTeamBattle) return;

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
        
        // Mostrar información de batalla en equipo si es necesario
        if (this.isTeamBattle) {
            this.showTeamBattleInfo();
        }
    }

    updateCharacterNames() {
        if (this.isTeamBattle && this.teamData) {
            // Para batallas en equipo, mostrar nombres del primer personaje de cada equipo
            const char1Name = document.querySelector('.character-side:first-child .character-name');
            const char1Status = document.querySelector('.character-side:first-child .character-status');
            if (char1Name && this.teamData.equipo1[0]) {
                char1Name.textContent = this.teamData.equipo1[0].nombre;
            }
            if (char1Status) {
                char1Status.textContent = 'En Batalla';
                char1Status.className = 'character-status normal';
            }

            const char2Name = document.querySelector('.character-side:last-child .character-name');
            const char2Status = document.querySelector('.character-side:last-child .character-status');
            if (char2Name && this.teamData.equipo2[0]) {
                char2Name.textContent = this.teamData.equipo2[0].nombre;
            }
            if (char2Status) {
                char2Status.textContent = 'En Batalla';
                char2Status.className = 'character-status normal';
            }
        } else {
            // Para batallas 1v1, usar la lógica original
            const char1Name = document.querySelector('.character-side:first-child .character-name');
            const char1Status = document.querySelector('.character-side:first-child .character-status');
            if (char1Name) {
                char1Name.textContent = this.currentBattle?.estadoPersonaje1?.Nombre || this.character1?.Nombre || 'Personaje 1';
            }
            if (char1Status) {
                const estado = this.currentBattle?.estadoPersonaje1?.Estado || 'Normal';
                char1Status.textContent = estado;
                char1Status.className = `character-status ${estado.toLowerCase()}`;
            }

            const char2Name = document.querySelector('.character-side:last-child .character-name');
            const char2Status = document.querySelector('.character-side:last-child .character-status');
            if (char2Name) {
                char2Name.textContent = this.currentBattle?.estadoPersonaje2?.Nombre || this.character2?.Nombre || 'Personaje 2';
            }
            if (char2Status) {
                const estado = this.currentBattle?.estadoPersonaje2?.Estado || 'Normal';
                char2Status.textContent = estado;
                char2Status.className = `character-status ${estado.toLowerCase()}`;
            }
        }
    }

    updateCharacterStats() {
        if (this.isTeamBattle) {
            // Para batallas en equipo, usar datos de demostración
            const demoStats = {
                HP: 300,
                Energia: 50,
                Combo: 0,
                Ultra: 0
            };
            this.updateCharacterBars('left', demoStats);
            this.updateCharacterBars('right', demoStats);
        } else {
            // Para batallas 1v1, usar la lógica original
            const char1Stats = this.currentBattle?.estadoPersonaje1;
            this.updateCharacterBars('left', char1Stats);

            const char2Stats = this.currentBattle?.estadoPersonaje2;
            this.updateCharacterBars('right', char2Stats);
        }
    }

    updateCharacterBars(side, stats) {
        const sideSelector = side === 'left' ? '.character-side:first-child' : '.character-side:last-child';
        const container = document.querySelector(sideSelector);
        
        if (!container) return;

        // Usar datos por defecto si no hay stats
        const defaultStats = {
            HP: 300,
            Energia: 50,
            Combo: 0,
            Ultra: 0
        };
        
        const finalStats = stats || defaultStats;

        // Actualizar barra de vida
        const healthFill = container.querySelector('.health-fill');
        const healthText = container.querySelector('.health-text');
        if (healthFill && healthText) {
            const healthPercent = (finalStats.HP / 300) * 100;
            healthFill.style.width = `${healthPercent}%`;
            healthText.textContent = `${finalStats.HP}/300`;
        }

        // Actualizar barra de energía
        const energyFill = container.querySelector('.energy-fill');
        const energyText = container.querySelector('.energy-text');
        if (energyFill && energyText) {
            const energyPercent = (finalStats.Energia / 50) * 100;
            energyFill.style.width = `${energyPercent}%`;
            energyText.textContent = `${finalStats.Energia}/50`;
        }

        // Actualizar barra de combo
        const comboFill = container.querySelector('.combo-fill');
        const comboText = container.querySelector('.combo-text');
        if (comboFill && comboText) {
            const comboPercent = (finalStats.Combo / 100) * 100;
            comboFill.style.width = `${comboPercent}%`;
            comboText.textContent = `${finalStats.Combo}/100`;
        }

        // Actualizar barra de ultra
        const ultraFill = container.querySelector('.ultra-fill');
        const ultraText = container.querySelector('.ultra-text');
        const ultraBar = container.querySelector('.stat-group:last-child');
        
        if (ultraFill && ultraText && ultraBar) {
            // Ocultar la barra de ultra si ya se usó (UltraUsado = true)
            if (finalStats.UltraUsado) {
                ultraBar.classList.add('hidden');
            } else {
                ultraBar.classList.remove('hidden');
                const ultraPercent = (finalStats.Ultra / 100) * 100;
                ultraFill.style.width = `${ultraPercent}%`;
                ultraText.textContent = `${finalStats.Ultra}/100`;
                
                // Efecto especial cuando ultra está al 100%
                if (finalStats.Ultra >= 100) {
                    ultraFill.style.animation = 'pulse 1s infinite';
                } else {
                    ultraFill.style.animation = 'none';
                }
            }
        }
        
        // Efecto especial cuando combo está al 100%
        if (comboFill && finalStats.Combo >= 100) {
            comboFill.style.animation = 'pulse 1s infinite';
        } else if (comboFill) {
            comboFill.style.animation = 'none';
        }
    }

    updateTurnIndicator() {
        const turnIndicator = document.getElementById('turnIndicator');
        const turnText = document.getElementById('turnText');
        
        if (turnIndicator && turnText) {
            if (this.isTeamBattle) {
                const teamName = this.currentTurn === 1 ? 'Equipo 1' : 'Equipo 2';
                turnText.textContent = `Turno del ${teamName}`;
                turnIndicator.style.display = 'block';
            } else {
                turnIndicator.style.display = 'none';
            }
        }
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
            
            let damageText = '';
            if (entry.dano && entry.dano > 0) {
                damageText = ` (${entry.dano} daño)`;
            }
            
            // Crear descripción basada en la estructura de la API o modo demostración
            let description = '';
            if (entry.accion) {
                description = `${entry.atacante} usa ${entry.accion} contra ${entry.defensor}`;
                if (entry.nombreCombo) {
                    description = `${entry.atacante} usa ${entry.nombreCombo} contra ${entry.defensor}`;
                }
                if (entry.nombreUltra) {
                    description = `${entry.atacante} usa ${entry.nombreUltra} contra ${entry.defensor}`;
                }
            } else {
                description = entry.mensaje || 'Acción realizada';
            }
            
            const timestamp = entry.timestamp || `Turno ${index + 1}`;
            
            entryElement.innerHTML = `
                <strong>${timestamp}</strong> - ${description}${damageText}
            `;
            logContent.appendChild(entryElement);
        });
        
        // Scroll al final
        logContent.scrollTop = logContent.scrollHeight;
    }

    showCharacterModal(character) {
        if (this.isTeamBattle && this.teamData) {
            // Para batallas en equipo, mostrar información del primer personaje del equipo correspondiente
            const team = character === '1' ? this.teamData.equipo1 : this.teamData.equipo2;
            const characterData = team[0];
            
            if (!characterData) return;

            const modal = document.getElementById('characterModal');
            if (!modal) return;

            // Actualizar contenido del modal
            document.getElementById('modalCharacterName').textContent = characterData.nombre.toUpperCase();
            document.getElementById('modalCharacterRole').textContent = 'MIEMBRO DEL EQUIPO';
            
            // Actualizar estado en el modal
            const modalStatus = document.getElementById('modalCharacterStatus');
            if (modalStatus) {
                modalStatus.textContent = 'En Batalla';
                modalStatus.className = 'character-status normal';
            }
            
            document.getElementById('modalHealth').textContent = '300/300';
            document.getElementById('modalEnergy').textContent = '50/50';
            document.getElementById('modalCombo').textContent = '0/100';
            document.getElementById('modalUltra').textContent = '0/100';
            document.getElementById('modalAttack').textContent = '85';
            document.getElementById('modalDefense').textContent = '75';
            document.getElementById('modalDescription').textContent = `Miembro del equipo ${character === '1' ? '1' : '2'}. Luchador valiente y poderoso.`;
        } else {
            // Para batallas 1v1, usar la lógica original
            const characterData = character === '1' ? this.character1 : this.character2;
            const currentStats = character === '1' ? this.currentBattle?.estadoPersonaje1 : this.currentBattle?.estadoPersonaje2;
            
            if (!characterData) return;

            const modal = document.getElementById('characterModal');
            if (!modal) return;

            // Actualizar contenido del modal
            document.getElementById('modalCharacterName').textContent = characterData.Nombre;
            document.getElementById('modalCharacterRole').textContent = characterData.Categoria;
            
            // Actualizar estado en el modal
            const modalStatus = document.getElementById('modalCharacterStatus');
            if (modalStatus) {
                const estado = currentStats?.Estado || 'Normal';
                modalStatus.textContent = estado;
                modalStatus.className = `character-status ${estado.toLowerCase()}`;
            }
            
            document.getElementById('modalHealth').textContent = `${currentStats?.HP || characterData.Vida || 300}/300`;
            document.getElementById('modalEnergy').textContent = `${currentStats?.Energia || characterData.Energia || 50}/50`;
            document.getElementById('modalAttack').textContent = characterData.Ataque || 85;
            document.getElementById('modalDefense').textContent = characterData.Defensa || 75;
        
        // Actualizar combo y ultra si existen los elementos en el modal
        const modalCombo = document.getElementById('modalCombo');
        const modalUltra = document.getElementById('modalUltra');
        const modalUltraContainer = modalUltra?.parentElement;
        
        if (modalCombo) {
            modalCombo.textContent = `${currentStats?.Combo || 0}/100`;
        }
        if (modalUltra && modalUltraContainer) {
            // Ocultar la estadística de ultra si ya se usó
            if (currentStats?.UltraUsado) {
                modalUltraContainer.classList.add('hidden');
            } else {
                modalUltraContainer.classList.remove('hidden');
                modalUltra.textContent = `${currentStats?.Ultra || 0}/100`;
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
        const currentCharacter = this.currentTurn === 1 ? 
            this.currentBattle.estadoPersonaje1 : 
            this.currentBattle.estadoPersonaje2;
        
        const comboIndicator = document.querySelector('.combo-indicator');
        if (comboIndicator) {
            if (currentCharacter.Combo >= 61) {
                comboIndicator.textContent = 'AVANZADO';
                comboIndicator.style.background = 'linear-gradient(135deg, #FF4444, #CC0000)';
                comboIndicator.title = 'Combo Avanzado - Daño: 55-70';
            } else if (currentCharacter.Combo >= 30) {
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

${this.isTeamBattle ? `
👥 BATALLA EN EQUIPO:
• Cada equipo tiene 3 personajes
• Los personajes se turnan automáticamente
• Cuando un personaje es derrotado, el siguiente toma su lugar
• Gana el equipo que derrote a todos los personajes del oponente
` : ''}
`;
        alert(helpText);
    }

    // Métodos para batallas en equipo
    showTeamModal(characterSide) {
        if (!this.isTeamBattle || !this.teamData) {
            console.error('No es una batalla en equipo o no hay datos de equipo');
            return;
        }

        const modal = document.getElementById('teamModal');
        const teamList = document.getElementById('teamList');
        
        // Determinar qué equipo mostrar basado en el lado del personaje
        const team = characterSide === '1' ? this.teamData.equipo1 : this.teamData.equipo2;
        const teamName = characterSide === '1' ? 'Equipo 1' : 'Equipo 2';
        
        // Limpiar contenido anterior
        teamList.innerHTML = '';
        
        // Crear elementos para cada personaje del equipo
        team.forEach((character, index) => {
            const characterItem = document.createElement('div');
            characterItem.className = 'team-character-item';
            characterItem.setAttribute('data-character-id', character.id);
            characterItem.setAttribute('data-character-index', index);
            
            // Determinar si el personaje está activo o bloqueado
            const isActive = index === 0; // Por ahora, solo el primer personaje está activo
            const isBlocked = !isActive;
            
            if (isBlocked) {
                characterItem.classList.add('disabled');
            }
            
            characterItem.innerHTML = `
                <div class="team-character-avatar ${isBlocked ? 'disabled' : ''} ${isActive ? 'active' : ''}">
                    <i class="fas fa-user-ninja"></i>
                </div>
                <div class="team-character-info">
                    <div class="team-character-name">${character.nombre}</div>
                    <div class="team-character-status ${isBlocked ? 'disabled' : ''} ${isActive ? 'active' : ''}">
                        ${isActive ? 'En Batalla' : 'Bloqueado'}
                    </div>
                </div>
            `;
            
            // Agregar event listener para seleccionar personaje
            characterItem.addEventListener('click', () => {
                if (!isBlocked) {
                    this.selectedTeamCharacter = character;
                    // Remover selección anterior
                    document.querySelectorAll('.team-character-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    // Agregar selección actual
                    characterItem.classList.add('active');
                }
            });
            
            teamList.appendChild(characterItem);
        });
        
        // Mostrar modal
        modal.style.display = 'flex';
    }

    closeTeamModal() {
        document.getElementById('teamModal').style.display = 'none';
        this.selectedTeamCharacter = null;
    }

    showCharacterFromTeam() {
        if (!this.selectedTeamCharacter) {
            alert('Por favor selecciona un personaje del equipo primero.');
            return;
        }
        
        // Cerrar modal de equipo
        this.closeTeamModal();
        
        // Mostrar modal de personaje con la información del personaje seleccionado
        this.showCharacterModalFromTeam(this.selectedTeamCharacter);
    }

    showCharacterModalFromTeam(character) {
        // Implementar la lógica para mostrar información del personaje del equipo
        // Por ahora, mostrar información básica
        const modal = document.getElementById('characterModal');
        const modalName = document.getElementById('modalCharacterName');
        const modalRole = document.getElementById('modalCharacterRole');
        const modalStatus = document.getElementById('modalCharacterStatus');
        
        modalName.textContent = character.nombre.toUpperCase();
        modalRole.textContent = 'MIEMBRO DEL EQUIPO';
        modalStatus.textContent = 'Disponible';
        modalStatus.className = 'character-status normal';
        
        // Mostrar modal
        modal.style.display = 'flex';
    }
}

    // Inicializar sistema de batalla cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM cargado, inicializando sistema de batalla...');
        
        // Hacer las funciones disponibles globalmente para los onclick del HTML
        window.battleSystem = new BattleSystem();
        
        console.log('Sistema de batalla inicializado:', window.battleSystem);
        
        // Funciones globales para modales
        window.showCharacterModal = (character) => window.battleSystem.showCharacterModal(character);
        window.closeModal = () => window.battleSystem.closeModal();
        window.showConfigModal = () => window.battleSystem.showConfigModal();
        window.closeConfigModal = () => window.battleSystem.closeConfigModal();
        window.showHistoryModal = () => window.battleSystem.showHistoryModal();
        window.closeHistoryModal = () => window.battleSystem.closeHistoryModal();
        window.exitGame = () => window.battleSystem.exitGame();
        window.showHelp = () => window.battleSystem.showHelp();
        
        // Funciones globales para modal de equipo
        window.closeTeamModal = () => window.battleSystem.closeTeamModal();
        window.showCharacterFromTeam = () => window.battleSystem.showCharacterFromTeam();
        
        // Función para alternar modo de demostración
        window.toggleDemoMode = () => window.battleSystem.toggleDemoMode();
        
        // Función de prueba
        window.testButton = () => {
            console.log('Botón de prueba clickeado');
            if (window.battleSystem) {
                window.battleSystem.showDemoMessage('¡Botón de prueba funcionando!');
                // Forzar configuración de event listeners
                window.battleSystem.forceSetupEventListeners();
                // Simular una acción
                setTimeout(() => {
                    window.battleSystem.simulateActionClick('Ataque Básico');
                }, 1000);
            } else {
                alert('Sistema de batalla no inicializado');
            }
        };

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