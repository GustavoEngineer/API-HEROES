// Team Battle System - Batallas 3v3
const API_BASE_URL = 'http://localhost:3000';

class TeamBattleSystem {
    constructor() {
        this.currentBattle = null;
        this.teamCharacters = [];
    }

    async init() {
        try {
            console.log('Inicializando sistema de batalla en equipo...');
            
            // Verificar autenticación
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = 'login.html';
                return;
            }
            
            // Obtener battleId de la URL
            const battleId = this.getBattleId();
            if (!battleId) {
                await this.findExistingBattle(token);
                        return;
                    }

            // Cargar datos de la batalla
            await this.loadBattleData(battleId, token);
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Actualizar UI inicial
            this.updateUI();
            
            // NO iniciar polling automáticamente - solo cuando se ejecute una acción
            
        } catch (error) {
            console.error('Error inicializando batalla en equipo:', error);
            this.showError('Error al cargar la batalla: ' + error.message);
        }
    }

    getBattleId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('battleId');
    }

    async findExistingBattle(token) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/batallas3v3`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Error al obtener batallas');
            }

            const batallas = await response.json();
            
            if (batallas && batallas.length > 0) {
                let batallaActiva = batallas.find(b => b.estado === 'En curso');
                
                if (batallaActiva) {
                    window.location.href = `batallas3v3.html?battleId=${batallaActiva.id}`;
                    return;
                }
            }

            await this.createNewBattle(token);
            
        } catch (error) {
            console.error('Error buscando batalla existente:', error);
            await this.createNewBattle(token);
        }
    }

    async createNewBattle(token) {
        try {
            console.log('Creando nueva batalla en equipo...');
            
            // Obtener personajes disponibles
            const personajesResponse = await fetch(`${API_BASE_URL}/api/personajes`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!personajesResponse.ok) {
                throw new Error('Error al obtener personajes');
            }

            const personajes = await personajesResponse.json();
            
            // Seleccionar 6 personajes aleatorios (3 por equipo)
            const personajesAleatorios = this.shuffleArray([...personajes]).slice(0, 6);
            const equipo1 = personajesAleatorios.slice(0, 3).map(p => p.id);
            const equipo2 = personajesAleatorios.slice(3, 6).map(p => p.id);
            
            const response = await fetch(`${API_BASE_URL}/api/batallas3v3`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    equipo1: equipo1,
                    equipo2: equipo2
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al crear batalla');
            }

            const newBattle = await response.json();
            console.log('Nueva batalla creada:', newBattle);
            
            window.location.href = `batallas3v3.html?battleId=${newBattle.id}`;
            
        } catch (error) {
            console.error('Error creando nueva batalla:', error);
            this.showError('Error al crear nueva batalla: ' + error.message);
        }
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    async loadBattleData(battleId, token) {
        try {
            console.log('Cargando datos de batalla:', battleId);
            
            const response = await fetch(`${API_BASE_URL}/api/batallas3v3/${battleId}`, {
                    headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
                
                if (!response.ok) {
                throw new Error('Error al cargar datos de la batalla');
                }

            this.currentBattle = await response.json();
            console.log('Datos de batalla cargados:', this.currentBattle);

            // Validar estructura de datos según las reglas de la API
            this.validateBattleData();
                
        } catch (error) {
            console.error('Error cargando datos de batalla:', error);
                    throw error;
        }
    }

    validateBattleData() {
        if (!this.currentBattle) {
            throw new Error('No se recibieron datos de batalla');
        }

        // Verificar estructura básica según la API
        if (!this.currentBattle.turnoActual || !this.currentBattle.rondaActual) {
            throw new Error('Datos de batalla incompletos: faltan turnoActual o rondaActual');
        }

        // Verificar que existen los equipos
        if (!this.currentBattle.equipo1 || !this.currentBattle.equipo2) {
            throw new Error('Datos de batalla incompletos: faltan equipos');
        }

        // Verificar que cada equipo tiene 3 personajes
        if (this.currentBattle.equipo1.length !== 3 || this.currentBattle.equipo2.length !== 3) {
            throw new Error('Cada equipo debe tener exactamente 3 personajes');
        }

        console.log('Datos de batalla validados correctamente');
    }

    setupEventListeners() {
        // Botones de acción
        document.querySelectorAll('.action-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                const action = e.currentTarget.getAttribute('data-action');
                if (action) {
                    await this.executeAction(action);
                }
            });
        });

        // Configurar teclas
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });
    }

    async executeAction(action) {
        try {
            const token = localStorage.getItem('token');
            const battleId = this.getBattleId();
            
            if (!token || !battleId) {
                this.showError('Error: No se pudo obtener la información de la batalla');
            return;
        }
        
            // Obtener el personaje activo según las reglas de la API
            const activeCharacter = this.getActiveCharacter();
            if (!activeCharacter) {
                this.showError('No se pudo determinar el personaje activo');
            return;
        }
        
            console.log('Ejecutando acción:', action, 'con personaje:', activeCharacter);

            const response = await fetch(`${API_BASE_URL}/api/batallas3v3/accion`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    batallaId: battleId,
                    personajeId: activeCharacter.id,
                    accion: action
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al ejecutar acción');
            }

            const result = await response.json();
            console.log('Resultado de acción:', result);

            // Mostrar mensaje de resultado
            this.showActionMessage(result.mensaje);
            
            // Actualizar datos de la batalla
            await this.loadBattleData(battleId, token);
            
            // Actualizar UI
            this.updateUI();

            // NO hay polling - solo actualizaciones manuales

            // Verificar si la batalla terminó
            if (result.ganador) {
                this.handleBattleEnd(result.ganador);
            }

        } catch (error) {
            console.error('Error ejecutando acción:', error);
            this.showError(error.message);
        }
    }

    getActiveCharacter() {
        if (!this.currentBattle) return null;

        const rondaActual = this.currentBattle.rondas?.[this.currentBattle.rondaActual - 1];
        if (!rondaActual) {
            console.error('No se encontró la ronda actual');
            return null;
        }

        const currentTurn = this.currentBattle.turnoActual;
        const activeIndex = currentTurn === 1 ? this.currentBattle.idxActivo1 : this.currentBattle.idxActivo2;
        
        console.log('Buscando personaje activo:', {
            currentTurn,
            activeIndex,
            rondaActual: this.currentBattle.rondaActual
        });

        let activeCharacter = null;
        
        // Seguir exactamente las reglas de la API
        if (currentTurn === 1) {
            if (rondaActual.estadoEquipo1 && rondaActual.estadoEquipo1[activeIndex]) {
                activeCharacter = rondaActual.estadoEquipo1[activeIndex];
            } else if (this.currentBattle.equipo1 && this.currentBattle.equipo1[activeIndex]) {
                // Si no hay estados, usar datos básicos del equipo
                const equipo1Char = this.currentBattle.equipo1[activeIndex];
                activeCharacter = {
                    id: equipo1Char.id,
                    nombre: equipo1Char.nombre,
            hp: 100,
            energia: 50,
            combo: 0,
            ultra: 0,
                    estado: 'Normal'
                };
            }
        } else if (currentTurn === 2) {
            if (rondaActual.estadoEquipo2 && rondaActual.estadoEquipo2[activeIndex]) {
                activeCharacter = rondaActual.estadoEquipo2[activeIndex];
            } else if (this.currentBattle.equipo2 && this.currentBattle.equipo2[activeIndex]) {
                // Si no hay estados, usar datos básicos del equipo
                const equipo2Char = this.currentBattle.equipo2[activeIndex];
                activeCharacter = {
                    id: equipo2Char.id,
                    nombre: equipo2Char.nombre,
                    hp: 100,
                    energia: 50,
                    combo: 0,
                    ultra: 0,
                    estado: 'Normal'
                };
            }
        }

        if (!activeCharacter) {
            console.error('No se pudo obtener el personaje activo');
            return null;
        }

        console.log('Personaje activo encontrado:', activeCharacter);
        return activeCharacter;
    }

    updateUI() {
        if (!this.currentBattle) return;

        this.updateTurnAndRoundIndicators();
        this.updatePlayerCards();
        this.updateHistory();
        this.updateBattleStatus();
    }

    updateTurnAndRoundIndicators() {
        const turnElement = document.getElementById('current-turn');
        if (turnElement) {
            const currentTurn = this.currentBattle.turnoActual;
            turnElement.textContent = `Equipo ${currentTurn}`;
            turnElement.className = `turn-value team${currentTurn}`;
        }

        const roundElement = document.getElementById('current-round');
        if (roundElement) {
            roundElement.textContent = this.currentBattle.rondaActual || 1;
        }
    }

    updatePlayerCards() {
        if (!this.currentBattle) return;

        const rondaActual = this.currentBattle.rondas?.[this.currentBattle.rondaActual - 1];
        if (!rondaActual) return;

        // Actualizar equipo 1 según las reglas de la API
        if (rondaActual.estadoEquipo1) {
            rondaActual.estadoEquipo1.forEach((personaje, index) => {
                this.updatePlayerCard(`team1-player${index + 1}`, personaje);
            });
        } else if (this.currentBattle.equipo1) {
            // Usar datos básicos si no hay estados inicializados
            this.currentBattle.equipo1.forEach((personaje, index) => {
                const defaultPersonaje = {
                    id: personaje.id,
                    nombre: personaje.nombre,
                    hp: 100,
                    energia: 50,
                    combo: 0,
                    ultra: 0,
                    estado: 'Normal'
                };
                this.updatePlayerCard(`team1-player${index + 1}`, defaultPersonaje);
            });
        }

        // Actualizar equipo 2 según las reglas de la API
        if (rondaActual.estadoEquipo2) {
            rondaActual.estadoEquipo2.forEach((personaje, index) => {
                this.updatePlayerCard(`team2-player${index + 1}`, personaje);
            });
        } else if (this.currentBattle.equipo2) {
            // Usar datos básicos si no hay estados inicializados
            this.currentBattle.equipo2.forEach((personaje, index) => {
                const defaultPersonaje = {
                    id: personaje.id,
                    nombre: personaje.nombre,
                    hp: 100,
                    energia: 50,
                    combo: 0,
                    ultra: 0,
                    estado: 'Normal'
                };
                this.updatePlayerCard(`team2-player${index + 1}`, defaultPersonaje);
            });
        }
    }

        updatePlayerCard(playerId, personaje) {
        const playerCard = document.querySelector(`[data-player-id="${playerId}"]`);
        if (!playerCard) return;

        const nameElement = playerCard.querySelector('.player-name');
        if (nameElement) {
            nameElement.textContent = personaje.nombre || 'Personaje';
        }

        const hpValue = playerCard.querySelector('.stat:first-child .stat-value');
        const energyValue = playerCard.querySelector('.stat:last-child .stat-value');
        
        if (hpValue) {
            hpValue.textContent = personaje.hp || 100;
        }
        if (energyValue) {
            energyValue.textContent = personaje.energia || 50;
        }

        const comboBar = playerCard.querySelector('.combo-bar .resource-fill');
        const ultraBar = playerCard.querySelector('.ultra-bar .resource-fill');
        const comboLabel = playerCard.querySelector('.combo-bar .resource-label');
        const ultraLabel = playerCard.querySelector('.ultra-bar .resource-label');

        if (comboBar && comboLabel) {
            const comboPercentage = personaje.combo || 0;
            comboBar.style.width = `${comboPercentage}%`;
            comboLabel.textContent = `Combo: ${comboPercentage}`;
        }

        if (ultraBar && ultraLabel) {
            const ultraPercentage = personaje.ultra || 0;
            ultraBar.style.width = `${ultraPercentage}%`;
            ultraLabel.textContent = `Ultra: ${ultraPercentage}`;
        }

        const statusIndicator = playerCard.querySelector('.player-status-indicator');
        if (statusIndicator) {
            statusIndicator.className = 'player-status-indicator';
            
            if (personaje.hp <= 0) {
                statusIndicator.classList.add('ko');
                // Marcar la tarjeta como derrotada
                playerCard.classList.add('defeated');
            } else {
                playerCard.classList.remove('defeated');
                if (personaje.estado === 'Defendiendo') {
                statusIndicator.classList.add('defending');
            } else if (personaje.estado === 'Vulnerable') {
                statusIndicator.classList.add('vulnerable');
            } else if (this.isPlayerActive(playerId)) {
                statusIndicator.classList.add('active');
                }
            }
        }

        // Agregar indicador visual de orden en la ronda
        this.updatePlayerOrderIndicator(playerCard, playerId);
    }

    updatePlayerOrderIndicator(playerCard, playerId) {
        // Remover indicadores anteriores
        const existingIndicator = playerCard.querySelector('.order-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        // Crear indicador de orden
        const orderIndicator = document.createElement('div');
        orderIndicator.className = 'order-indicator';
        
        // Determinar el orden basado en el ID del jugador
        const playerNumber = playerId.includes('player1') ? 1 : playerId.includes('player2') ? 2 : 3;
        const teamNumber = playerId.includes('team1') ? 1 : 2;
        
        orderIndicator.textContent = `${teamNumber}-${playerNumber}`;
        orderIndicator.style.cssText = `
            position: absolute;
            top: 5px;
            right: 5px;
            background: ${teamNumber === 1 ? '#3B82F6' : '#EF4444'};
            color: white;
            font-size: 10px;
            padding: 2px 4px;
            border-radius: 3px;
            font-weight: bold;
        `;
        
        playerCard.style.position = 'relative';
        playerCard.appendChild(orderIndicator);
    }

    isPlayerActive(playerId) {
        if (!this.currentBattle) return false;

        const rondaActual = this.currentBattle.rondas?.[this.currentBattle.rondaActual - 1];
        if (!rondaActual) return false;

        const currentTurn = this.currentBattle.turnoActual;
        const activeIndex = currentTurn === 1 ? this.currentBattle.idxActivo1 : this.currentBattle.idxActivo2;
        
        if (playerId.includes('team1') && currentTurn === 1) {
            const playerIndex = parseInt(playerId.replace('team1-player', '')) - 1;
            return playerIndex === activeIndex;
        } else if (playerId.includes('team2') && currentTurn === 2) {
            const playerIndex = parseInt(playerId.replace('team2-player', '')) - 1;
            return playerIndex === activeIndex;
        }

        return false;
    }

    updateHistory() {
        if (!this.currentBattle || !this.currentBattle.historial) return;

        const historyContainer = document.querySelector('.battle-status');
        if (!historyContainer) return;

        const recentActions = this.currentBattle.historial.slice(-5);
        
        if (recentActions.length === 0) {
            historyContainer.innerHTML = '<p>No hay acciones registradas aún.</p>';
            return;
        }

        const historyHTML = recentActions.map(action => {
            let message = '';
            if (action.mensaje) {
                message = action.mensaje;
            } else if (action.atacante && action.defensor) {
                message = `${action.atacante} usó ${action.accion} contra ${action.defensor}`;
                if (action.dano) {
                    message += ` (${action.dano} daño)`;
                }
            }
            return `<p>${message}</p>`;
        }).join('');

        historyContainer.innerHTML = historyHTML;
    }

    updateBattleStatus() {
        if (!this.currentBattle) return;

        const statusContainer = document.querySelector('.battle-status');
        if (!statusContainer) return;

        if (this.currentBattle.estado === 'Finalizada') {
            const winner = this.currentBattle.ganador || 'Ganador';
            statusContainer.innerHTML = `<p><strong>¡${winner} ha ganado la batalla!</strong></p>`;
            return;
        }

        // Mostrar información detallada del progreso con rondas
        const rondaActual = this.currentBattle.rondas?.[this.currentBattle.rondaActual - 1];
        if (rondaActual) {
            let statusHTML = `<p><strong>Ronda ${this.currentBattle.rondaActual}</strong></p>`;
            
            // Mostrar personaje activo actual
            const activeCharacter = this.getActiveCharacter();
            if (activeCharacter) {
                statusHTML += `<p><strong>Turno:</strong> ${activeCharacter.nombre} (Equipo ${this.currentBattle.turnoActual})</p>`;
            }
            
            // Mostrar progreso visual de las rondas
            statusHTML += `<p><strong>Progreso de Rondas:</strong></p>`;
            
            // Equipo 1
            const derrotadosEquipo1 = this.getPersonajesDerrotados(1);
            const personajeActivo1 = this.getPersonajeActivo(1);
            statusHTML += `<p><strong>Equipo 1:</strong> `;
            
            if (this.currentBattle.equipo1) {
                this.currentBattle.equipo1.forEach((personaje, index) => {
                    const isActive = personajeActivo1 && personajeActivo1.id === personaje.id;
                    const isDefeated = derrotadosEquipo1.includes(personaje.nombre);
                    
                    if (isActive) {
                        statusHTML += `<span style="color: #10B981; font-weight: bold;">[${personaje.nombre}]</span>`;
                    } else if (isDefeated) {
                        statusHTML += `<span style="color: #EF4444; text-decoration: line-through;">${personaje.nombre}</span>`;
                    } else {
                        statusHTML += `<span style="color: #6B7280;">${personaje.nombre}</span>`;
                    }
                    
                    if (index < 2) statusHTML += ` → `;
                });
            }
            statusHTML += `</p>`;
            
            // Equipo 2
            const derrotadosEquipo2 = this.getPersonajesDerrotados(2);
            const personajeActivo2 = this.getPersonajeActivo(2);
            statusHTML += `<p><strong>Equipo 2:</strong> `;
            
            if (this.currentBattle.equipo2) {
                this.currentBattle.equipo2.forEach((personaje, index) => {
                    const isActive = personajeActivo2 && personajeActivo2.id === personaje.id;
                    const isDefeated = derrotadosEquipo2.includes(personaje.nombre);
                    
                    if (isActive) {
                        statusHTML += `<span style="color: #10B981; font-weight: bold;">[${personaje.nombre}]</span>`;
                    } else if (isDefeated) {
                        statusHTML += `<span style="color: #EF4444; text-decoration: line-through;">${personaje.nombre}</span>`;
        } else {
                        statusHTML += `<span style="color: #6B7280;">${personaje.nombre}</span>`;
                    }
                    
                    if (index < 2) statusHTML += ` → `;
                });
            }
            statusHTML += `</p>`;
            
            // Mostrar resumen
            statusHTML += `<p><strong>Resumen:</strong> Equipo 1: ${derrotadosEquipo1.length}/3 derrotados | Equipo 2: ${derrotadosEquipo2.length}/3 derrotados</p>`;
            
            statusContainer.innerHTML = statusHTML;
        }
    }

    getPersonajesDerrotados(equipo) {
        const rondaActual = this.currentBattle.rondas?.[this.currentBattle.rondaActual - 1];
        if (!rondaActual) return [];

        const estadoEquipo = equipo === 1 ? rondaActual.estadoEquipo1 : rondaActual.estadoEquipo2;
        if (!estadoEquipo) return [];

        return estadoEquipo
            .filter(personaje => personaje.hp <= 0)
            .map(personaje => personaje.nombre);
    }

    getPersonajeActivo(equipo) {
        const rondaActual = this.currentBattle.rondas?.[this.currentBattle.rondaActual - 1];
        if (!rondaActual) return null;

        const estadoEquipo = equipo === 1 ? rondaActual.estadoEquipo1 : rondaActual.estadoEquipo2;
        if (!estadoEquipo) return null;

        const activeIndex = equipo === 1 ? this.currentBattle.idxActivo1 : this.currentBattle.idxActivo2;
        return estadoEquipo[activeIndex] || null;
    }

    handleKeyPress(e) {
        const keyActions = {
            '1': 'Ataque Básico',
            '2': 'Ataque Fuerte',
            '3': 'Defender',
            '4': 'Cargar Energía',
            '5': 'Combo',
            '6': 'Ultra Move'
        };

        const action = keyActions[e.key];
        if (action) {
            e.preventDefault();
            this.executeAction(action);
        }
    }

    // FUNCIONES DE POLLING DESHABILITADAS
    // No hay actualizaciones automáticas - solo manuales

    showActionMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'action-message';
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            border: 2px solid #3B82F6;
            z-index: 1000;
            font-size: 14px;
            text-align: center;
            max-width: 400px;
            animation: fadeInOut 2s ease-in-out;
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 3000);
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(239, 68, 68, 0.9);
            color: white;
            padding: 12px 16px;
            border-radius: 6px;
            border: 1px solid #DC2626;
            z-index: 1000;
            font-size: 14px;
            max-width: 300px;
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    handleBattleEnd(winner) {
        setTimeout(() => {
            // Mostrar mensaje de victoria
            const victoryMessage = document.createElement('div');
            victoryMessage.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 15px;
                border: 3px solid #FFD700;
                z-index: 1000;
                text-align: center;
                font-size: 18px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                animation: victoryPulse 2s ease-in-out;
            `;
            victoryMessage.innerHTML = `
                <h2>🏆 ¡${winner} ha ganado! 🏆</h2>
                <p>La batalla ha terminado</p>
                <button onclick="window.location.href='dashboard.html'" style="
                    background: #FFD700;
                    color: #333;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-size: 16px;
                    cursor: pointer;
                    margin-top: 15px;
                ">Volver al Dashboard</button>
            `;
            document.body.appendChild(victoryMessage);
        }, 1000);
    }

    cleanup() {
        console.log('Limpiando recursos del sistema de batalla...');
        
        // Limpiar event listeners si es necesario
        document.removeEventListener('keydown', this.handleKeyPress);
        
        console.log('Limpieza completada');
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const teamBattle = new TeamBattleSystem();
    teamBattle.init();

    // Limpiar recursos al abandonar la página
    window.addEventListener('beforeunload', () => {
        teamBattle.cleanup();
    });
});

// Estilos CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    }

    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    @keyframes victoryPulse {
        0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
        50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }

    .player-status-indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #6B7280;
        margin: 5px auto;
    }

    .player-status-indicator.active {
        background: #10B981;
        box-shadow: 0 0 10px #10B981;
    }

    .player-status-indicator.ko {
        background: #EF4444;
        animation: pulse 1s infinite;
    }

    .player-status-indicator.defending {
        background: #3B82F6;
    }

    .player-status-indicator.vulnerable {
        background: #F59E0B;
    }

    .turn-value.team1 {
        color: #3B82F6;
    }

    .turn-value.team2 {
        color: #EF4444;
    }

    .player-card.defeated {
        opacity: 0.5;
        filter: grayscale(100%);
        position: relative;
    }

    .player-card.defeated::after {
        content: 'KO';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #EF4444;
        color: white;
        padding: 5px 10px;
        border-radius: 5px;
        font-weight: bold;
        font-size: 14px;
        z-index: 10;
    }

    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }
`;
document.head.appendChild(style); 