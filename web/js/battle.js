// API Configuration
const API_BASE_URL = 'http://localhost:3000';

// Battle System for 1v1
class BattleSystem {
    constructor() {
        this.currentBattle = null;
        this.character1 = null;
        this.character2 = null;
        this.currentTurn = 1; // 1 = personaje1, 2 = personaje2
        this.gameHistory = [];
        this.gameStartTime = Date.now();
        
        this.init();
    }

    async init() {
        try {
            // Verificar conectividad de la API primero
            await this.checkAPIConnection();
            
            await this.loadBattleData();
            this.setupEventListeners();
            this.updateUI();
        } catch (error) {
            console.error('Error inicializando batalla:', error);
            
            // Si no hay batalla, redirigir al dashboard
            if (error.message.includes('No se encontró ID de batalla')) {
                alert('No hay una batalla activa. Serás redirigido al dashboard para crear una nueva batalla.');
                window.location.href = 'dashboard.html';
                return;
            }
            
            this.showError(`Error al cargar la batalla: ${error.message}`);
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
                this.showCharacterModal(character);
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
    }

    updateCharacterNames() {
        // Personaje 1 (lado izquierdo)
        const char1Name = document.querySelector('.character-side:first-child .character-name');
        if (char1Name) {
            char1Name.textContent = this.currentBattle.estadoPersonaje1?.Nombre || this.character1?.Nombre || 'Personaje 1';
        }

        // Personaje 2 (lado derecho)
        const char2Name = document.querySelector('.character-side:last-child .character-name');
        if (char2Name) {
            char2Name.textContent = this.currentBattle.estadoPersonaje2?.Nombre || this.character2?.Nombre || 'Personaje 2';
        }
    }

    updateCharacterStats() {
        // Actualizar estadísticas del personaje 1
        const char1Stats = this.currentBattle.estadoPersonaje1;
        this.updateCharacterBars('left', char1Stats);

        // Actualizar estadísticas del personaje 2
        const char2Stats = this.currentBattle.estadoPersonaje2;
        this.updateCharacterBars('right', char2Stats);
    }

    updateCharacterBars(side, stats) {
        const sideSelector = side === 'left' ? '.character-side:first-child' : '.character-side:last-child';
        const container = document.querySelector(sideSelector);
        
        if (!container) return;

        // Actualizar barra de vida
        const healthFill = container.querySelector('.health-fill');
        const healthText = container.querySelector('.health-text');
        if (healthFill && healthText) {
            const healthPercent = (stats.HP / 300) * 100;
            healthFill.style.width = `${healthPercent}%`;
            healthText.textContent = `${stats.HP}`;
        }

        // Actualizar barra de energía
        const energyFill = container.querySelector('.energy-fill');
        const energyText = container.querySelector('.energy-text');
        if (energyFill && energyText) {
            const energyPercent = (stats.Energia / 50) * 100;
            energyFill.style.width = `${energyPercent}%`;
            energyText.textContent = `${stats.Energia}`;
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
        
        this.gameHistory.forEach(entry => {
            const entryElement = document.createElement('div');
            entryElement.className = 'history-entry';
            
            let damageText = '';
            if (entry.dano && entry.dano > 0) {
                damageText = ` (${entry.dano} daño)`;
            }
            
            // Crear descripción basada en la estructura de la API
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
            
            entryElement.innerHTML = `
                <strong>Golpe ${entry.golpe || ''}</strong> - ${description}${damageText}
            `;
            logContent.appendChild(entryElement);
        });
        
        // Scroll al final
        logContent.scrollTop = logContent.scrollHeight;
    }

    showCharacterModal(character) {
        const characterData = character === '1' ? this.character1 : this.character2;
        if (!characterData) return;

        const modal = document.getElementById('characterModal');
        if (!modal) return;

        // Actualizar contenido del modal
        document.getElementById('modalCharacterName').textContent = characterData.Nombre;
        document.getElementById('modalCharacterRole').textContent = characterData.Categoria;
        document.getElementById('modalHealth').textContent = characterData.Vida || 300;
        document.getElementById('modalEnergy').textContent = characterData.Energia || 50;
        document.getElementById('modalAttack').textContent = characterData.Ataque || 85;
        document.getElementById('modalDefense').textContent = characterData.Defensa || 75;
        
        // Crear descripción dinámica
        const description = `${characterData.Nombre} es un ${characterData.Categoria} de ${characterData.Ciudad}, 
        protagonista de la saga ${characterData.Saga}. Sus movimientos especiales incluyen: 
        ${characterData.combo1Name}, ${characterData.combo2Name}, ${characterData.combo3Name} y su 
        movimiento definitivo ${characterData.ultraName}.`;
        
        document.getElementById('modalDescription').textContent = description;
        
        modal.style.display = 'flex';
    }

    handleBattleEnd(winner) {
        const winnerName = winner === this.currentBattle.estadoPersonaje1?.ID ? 
            (this.currentBattle.estadoPersonaje1?.Nombre || this.character1?.Nombre) : 
            (this.currentBattle.estadoPersonaje2?.Nombre || this.character2?.Nombre);
        
        setTimeout(() => {
            alert(`¡${winnerName} ha ganado la batalla!`);
            // Redirigir al dashboard
            window.location.href = 'dashboard.html';
        }, 1000);
    }

    showError(message) {
        alert(`Error: ${message}`);
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
• Ataque Básico: Daño moderado, gana combo y ultra
• Ataque Fuerte: Daño alto, consume energía
• Combo: Daño especial, requiere combo acumulado
• Defender: Reduce daño recibido, gana energía y ultra
• Cargar Energía: Recupera energía, queda vulnerable
• Ultra Move: Daño máximo, requiere ultra al 100%

💡 CONSEJOS:
• Usa la defensa estratégicamente
• Acumula combo para ataques más poderosos
• El ultra solo se puede usar una vez por ronda

🎯 OBJETIVO:
Reducir el HP del oponente a 0 para ganar la batalla.
        `;
        
        alert(helpText);
        this.closeConfigModal();
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
        window.exitGame = () => window.battleSystem.exitGame();
        window.showHelp = () => window.battleSystem.showHelp();

        // Cerrar modal con Escape
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                window.battleSystem.closeModal();
                window.battleSystem.closeConfigModal();
                window.battleSystem.closeHistoryModal();
            }
        });

        // Cerrar modal al hacer clic fuera
        document.addEventListener('click', function(event) {
            const characterModal = document.getElementById('characterModal');
            const configModal = document.getElementById('configModal');
            const historyModal = document.getElementById('historyModal');
            
            if (event.target === characterModal) {
                window.battleSystem.closeModal();
            }
            if (event.target === configModal) {
                window.battleSystem.closeConfigModal();
            }
            if (event.target === historyModal) {
                window.battleSystem.closeHistoryModal();
            }
        });
    }); 