// Team Battle System - Lógica específica para batallas 3v3
class TeamBattleSystem extends BattleSystem {
    constructor() {
        super();
        this.isTeamBattle = true;
        this.teamData = null;
        this.currentTeamCharacter = null;
        this.teamCharacters = [];
        this.currentRonda = 1;
        this.team1Members = [];
        this.team2Members = [];
    }

    async init() {
        try {
            // Verificar conectividad de la API
            await this.checkAPIConnection();
            
            // Forzar modo de batalla en equipo
            this.isTeamBattle = true;
            
            await this.loadTeamBattleData();
            this.setupTeamEventListeners();
            this.updateTeamUI();
            
            // Iniciar actualización automática de UI
            this.startAutoUpdate();
        } catch (error) {
            console.error('Error inicializando batalla en equipo:', error);
            
            if (error.message.includes('No hay token de autenticación')) {
                alert('No hay token de autenticación. Por favor, inicia sesión nuevamente.');
                window.location.href = 'login.html';
                return;
            }
            
            if (error.message.includes('No se pudo crear una nueva batalla')) {
                return;
            }
            
            const userChoice = confirm(`Error: ${error.message}\n\n¿Quieres intentar crear una nueva batalla en equipo o ir al dashboard?`);
            if (userChoice) {
                const token = localStorage.getItem('token');
                if (token) {
                    try {
                        await this.createNewTeamBattle(token);
                    } catch (createError) {
                        console.error('Error creando nueva batalla en equipo:', createError);
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

    async loadTeamBattleData() {
        try {
            console.log('Cargando datos de batalla en equipo...');
            
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No hay token de autenticación. Por favor, inicia sesión nuevamente.');
            }

            const battleId = this.getBattleId();
            console.log('Team Battle ID:', battleId);
            
            if (!battleId) {
                console.log('No hay battleId, buscando batallas en equipo existentes...');
                
                const loadingDiv = document.createElement('div');
                loadingDiv.id = 'loading-message';
                loadingDiv.innerHTML = `
                    <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                                background: rgba(0,0,0,0.9); color: white; padding: 20px; border-radius: 10px; 
                                z-index: 9999; text-align: center;">
                        <h3>Buscando batalla en equipo existente...</h3>
                        <p>Espera un momento mientras recuperamos tu batalla.</p>
                    </div>
                `;
                document.body.appendChild(loadingDiv);
                
                try {
                    const foundExisting = await this.findExistingTeamBattle(token);
                    
                    const loadingElement = document.getElementById('loading-message');
                    if (loadingElement) {
                        loadingElement.remove();
                    }
                    
                    if (!foundExisting) {
                        console.log('No se encontraron batallas en equipo existentes, creando nueva...');
                        await this.createNewTeamBattle(token);
                        return;
                    }
                    return;
                } catch (error) {
                    const loadingElement = document.getElementById('loading-message');
                    if (loadingElement) {
                        loadingElement.remove();
                    }
                    
                    console.error('Error en búsqueda de batallas en equipo existentes:', error);
                    await this.createNewTeamBattle(token);
                    return;
                }
            }

            // Cargar datos de la batalla en equipo desde la API
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
            
            // Extraer información de equipos
            this.teamData = {
                equipo1: this.currentBattle.equipo1 || [],
                equipo2: this.currentBattle.equipo2 || []
            };
            
            // Cargar información de todos los personajes del equipo
            await this.loadTeamCharacters();
            
            // Actualizar estado inicial
            this.currentTurn = this.currentBattle.turnoActual || 1;
            this.gameHistory = this.currentBattle.historial || [];
            this.currentRonda = this.currentBattle.rondaActual || 1;
            
            console.log('Carga de datos de equipo completada exitosamente');
        } catch (error) {
            console.error('Error en loadTeamBattleData:', error);
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

    async findExistingTeamBattle(token) {
        try {
            console.log('Buscando batallas en equipo existentes...');
            
            const response = await fetch(`${API_BASE_URL}/api/batallas3v3`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                console.error('Error response:', response.status, response.statusText);
                throw new Error(`Error al obtener batallas en equipo: ${response.status} - ${response.statusText}`);
            }
            
            const responseText = await response.text();
            console.log('Response text:', responseText);
            
            let batallas;
            try {
                batallas = JSON.parse(responseText);
            } catch (e) {
                console.error('Error parsing batallas response:', e);
                throw new Error(`Error al parsear respuesta de batallas en equipo: ${responseText}`);
            }
            
            console.log('Batallas en equipo encontradas:', batallas);
            
            if (batallas && batallas.length > 0) {
                // Buscar primero una batalla activa o en curso
                let batallaSeleccionada = null;
                
                // Prioridad 1: Batallas en curso
                batallaSeleccionada = batallas.find(b => b.estado === 'En curso' || b.estado === 'Activa');
                console.log('Batallas en equipo en curso encontradas:', batallas.filter(b => b.estado === 'En curso' || b.estado === 'Activa'));
                
                // Prioridad 2: Batallas pendientes
                if (!batallaSeleccionada) {
                    batallaSeleccionada = batallas.find(b => b.estado === 'Pendiente' || b.estado === 'Iniciada');
                    console.log('Batallas en equipo pendientes encontradas:', batallas.filter(b => b.estado === 'Pendiente' || b.estado === 'Iniciada'));
                }
                
                // Prioridad 3: Última batalla (si no hay activas)
                if (!batallaSeleccionada) {
                    batallaSeleccionada = batallas[batallas.length - 1];
                    console.log('Usando última batalla en equipo:', batallaSeleccionada);
                }
                
                console.log('Batalla en equipo seleccionada:', batallaSeleccionada);
                
                // Guardar el ID de la batalla encontrada
                localStorage.setItem('currentBattle', JSON.stringify({
                    id: batallaSeleccionada.id,
                    tipo: '3v3'
                }));
                
                // Recargar la página con el battleId encontrado
                const currentUrl = new URL(window.location);
                currentUrl.searchParams.set('battleId', batallaSeleccionada.id);
                currentUrl.searchParams.set('mode', 'team');
                console.log('Redirigiendo a:', currentUrl.toString());
                window.location.href = currentUrl.toString();
                return true;
            }
            
            console.log('No se encontraron batallas en equipo');
            return false;
        } catch (error) {
            console.error('Error buscando batallas en equipo existentes:', error);
            return false;
        }
    }

    async createNewTeamBattle(token) {
        try {
            console.log('Creando nueva batalla en equipo...');
            
            // Para batallas en equipo, necesitamos datos específicos
            // Por ahora, crear con personajes por defecto
            const equipo1 = ["687950b99358be9dc62e544d", "687950b99358be9dc62e5452", "687950b99358be9dc62e5453"];
            const equipo2 = ["687950b99358be9dc62e5454", "687950b99358be9dc62e5455", "687950b99358be9dc62e5456"];
            
            const body = {
                equipo1: equipo1,
                equipo2: equipo2
            };
            
            console.log('Endpoint: /api/batallas3v3');
            console.log('Body:', JSON.stringify(body, null, 2));
            
            const response = await fetch(`${API_BASE_URL}/api/batallas3v3`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });
            
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
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
                throw new Error(`Error al crear batalla en equipo: ${response.status} - ${newBattle.error || newBattle.message || response.statusText}`);
            }
            
            console.log('Nueva batalla en equipo creada:', newBattle);
            
            // Guardar el ID de la nueva batalla en localStorage
            localStorage.setItem('currentBattle', JSON.stringify({
                id: newBattle.id,
                tipo: '3v3'
            }));
            
            // Recargar la página con el nuevo battleId
            const currentUrl = new URL(window.location);
            currentUrl.searchParams.set('battleId', newBattle.id);
            currentUrl.searchParams.set('mode', 'team');
            window.location.href = currentUrl.toString();
            
        } catch (error) {
            console.error('Error creando nueva batalla en equipo:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack
            });
            
            const errorMessage = `Error al crear batalla en equipo:\n${error.message}\n\nRevisa la consola para más detalles.`;
            alert(errorMessage);
            
            window.location.href = 'dashboard.html';
        }
    }

    setupTeamEventListeners() {
        // Event listeners para botones de acción
        document.querySelectorAll('.action-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.currentTarget.getAttribute('data-action');
                this.executeTeamAction(action);
            });
        });

        // Event listeners para modales de equipo
        document.querySelectorAll('.character-portrait').forEach(portrait => {
            portrait.addEventListener('click', (e) => {
                this.showTeamModal();
            });
        });

        // Configurar teclas
        this.setupKeyBindings();
    }

    async executeTeamAction(action) {
        try {
            const token = localStorage.getItem('token');
            const battleId = this.getBattleId();
            
            // Obtener el personaje activo actual
            const rondaActual = this.currentBattle.rondas?.[this.currentBattle.rondaActual - 1];
            if (!rondaActual || !rondaActual.estadoEquipo1 || !rondaActual.estadoEquipo2) {
                this.showError('No se pudo determinar el personaje activo');
                return;
            }
            
            const isTeam1Turn = this.currentTurn === 1;
            const personajeActivo = isTeam1Turn ? 
                rondaActual.estadoEquipo1[this.currentBattle.idxActivo1] : 
                rondaActual.estadoEquipo2[this.currentBattle.idxActivo2];
            
            if (!personajeActivo) {
                this.showError('No se pudo determinar el personaje activo');
                return;
            }
            
            const response = await fetch(`${API_BASE_URL}/api/batallas3v3/accion`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    batallaId: battleId,
                    personajeId: personajeActivo.id,
                    accion: action
                })
            });

            const result = await response.json();

            if (response.ok) {
                // Recargar la batalla completa para obtener el estado actualizado
                await this.loadTeamBattleData();
                
                // Efectos visuales
                this.showActionEffect(action);
                
                // Actualizar UI
                this.updateTeamUI();
                
                // Verificar si la batalla terminó
                if (result.ganador) {
                    this.handleTeamBattleEnd(result.ganador);
                }
            } else {
                this.showError(result.error || 'Error al ejecutar acción');
            }
        } catch (error) {
            console.error('Error ejecutando acción en equipo:', error);
            this.showError('Error de conexión');
        }
    }

    updateTeamUI() {
        if (!this.currentBattle) return;

        // Actualizar nombres de personajes activos
        this.updateTeamCharacterNames();
        
        // Actualizar estadísticas de personajes activos
        this.updateTeamCharacterStats();
        
        // Actualizar indicador de turno
        this.updateTeamTurnIndicator();
        
        // Actualizar historial
        this.updateTeamHistory();
        
        // Actualizar indicadores de combo
        this.updateTeamComboIndicators();
        
        // Actualizar información de equipos
        this.updateTeamInfo();
    }

    updateTeamCharacterNames() {
        // Obtener los personajes activos de la ronda actual
        const rondaActual = this.currentBattle.rondas?.[this.currentBattle.rondaActual - 1];
        if (!rondaActual || !rondaActual.estadoEquipo1 || !rondaActual.estadoEquipo2) {
            return;
        }
        
        const personaje1Activo = rondaActual.estadoEquipo1[this.currentBattle.idxActivo1];
        const personaje2Activo = rondaActual.estadoEquipo2[this.currentBattle.idxActivo2];
        
        // Personaje 1 (lado izquierdo)
        const char1Name = document.querySelector('.character-side:first-child .character-name');
        const char1Status = document.querySelector('.character-side:first-child .character-status');
        if (char1Name && personaje1Activo) {
            char1Name.textContent = personaje1Activo.nombre || 'Personaje 1';
        }
        if (char1Status && personaje1Activo) {
            const estado = personaje1Activo.estado || 'Normal';
            char1Status.textContent = estado;
            char1Status.className = `character-status ${estado.toLowerCase()}`;
        }

        // Personaje 2 (lado derecho)
        const char2Name = document.querySelector('.character-side:last-child .character-name');
        const char2Status = document.querySelector('.character-side:last-child .character-status');
        if (char2Name && personaje2Activo) {
            char2Name.textContent = personaje2Activo.nombre || 'Personaje 2';
        }
        if (char2Status && personaje2Activo) {
            const estado = personaje2Activo.estado || 'Normal';
            char2Status.textContent = estado;
            char2Status.className = `character-status ${estado.toLowerCase()}`;
        }
    }

    updateTeamCharacterStats() {
        const rondaActual = this.currentBattle.rondas?.[this.currentBattle.rondaActual - 1];
        if (!rondaActual || !rondaActual.estadoEquipo1 || !rondaActual.estadoEquipo2) {
            return;
        }
        
        const personaje1Activo = rondaActual.estadoEquipo1[this.currentBattle.idxActivo1];
        const personaje2Activo = rondaActual.estadoEquipo2[this.currentBattle.idxActivo2];
        
        // Actualizar barras del personaje 1
        if (personaje1Activo) {
            this.updateCharacterBars('left', personaje1Activo);
        }
        
        // Actualizar barras del personaje 2
        if (personaje2Activo) {
            this.updateCharacterBars('right', personaje2Activo);
        }
    }

    updateTeamTurnIndicator() {
        // Mostrar información del turno actual
        const turnInfo = document.getElementById('turnInfo');
        if (turnInfo) {
            const rondaActual = this.currentBattle.rondas?.[this.currentBattle.rondaActual - 1];
            if (rondaActual) {
                const isTeam1Turn = this.currentTurn === 1;
                const personajeActivo = isTeam1Turn ? 
                    rondaActual.estadoEquipo1[this.currentBattle.idxActivo1] : 
                    rondaActual.estadoEquipo2[this.currentBattle.idxActivo2];
                
                turnInfo.textContent = `Turno: ${personajeActivo?.nombre || 'Equipo ' + this.currentTurn}`;
            }
        }
    }

    updateTeamHistory() {
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
                description = entry.mensaje;
            } else if (entry.accion) {
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

    updateTeamComboIndicators() {
        const rondaActual = this.currentBattle.rondas?.[this.currentBattle.rondaActual - 1];
        if (!rondaActual || !rondaActual.estadoEquipo1 || !rondaActual.estadoEquipo2) {
            return;
        }
        
        const isTeam1Turn = this.currentTurn === 1;
        const personajeActivo = isTeam1Turn ? 
            rondaActual.estadoEquipo1[this.currentBattle.idxActivo1] : 
            rondaActual.estadoEquipo2[this.currentBattle.idxActivo2];
        
        if (!personajeActivo) return;
        
        const combo = personajeActivo.combo || 0;
        
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

    updateTeamInfo() {
        // Actualizar información de equipos en el modal
        const teamInfo = document.getElementById('teamInfo');
        if (teamInfo) {
            const rondaActual = this.currentBattle.rondas?.[this.currentBattle.rondaActual - 1];
            if (rondaActual) {
                const equipo1Vivos = rondaActual.estadoEquipo1.filter(p => p.hp > 0).length;
                const equipo2Vivos = rondaActual.estadoEquipo2.filter(p => p.hp > 0).length;
                
                teamInfo.innerHTML = `
                    <div>Equipo 1: ${equipo1Vivos}/3 miembros</div>
                    <div>Equipo 2: ${equipo2Vivos}/3 miembros</div>
                    <div>Ronda: ${this.currentRonda}</div>
                `;
            }
        }
    }

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
        
        // Obtener estado actual de la ronda
        const rondaActual = this.currentBattle.rondas?.[this.currentBattle.rondaActual - 1];
        const estadoEquipo = this.currentTurn === 1 ? 
            (rondaActual?.estadoEquipo1 || []) : 
            (rondaActual?.estadoEquipo2 || []);
        
        // Crear elementos para cada personaje del equipo
        currentTeam.forEach((charId, index) => {
            // Buscar el personaje en el array de personajes cargados desde la API
            const character = this.teamCharacters.find(char => char.id === charId);
            const estado = estadoEquipo[index] || { hp: 100, estado: 'Normal' };
            
            if (character) {
                // Determinar si el personaje está activo (peleando)
                const isActive = this.isCharacterActive(charId);
                const isAlive = estado.hp > 0;
                const teamItem = this.createTeamCharacterItem(character, isActive, isAlive, estado);
                teamList.appendChild(teamItem);
            } else {
                console.error(`No se encontró personaje con ID: ${charId} en los datos de la API`);
            }
        });
        
        modal.style.display = 'flex';
    }

    createTeamCharacterItem(character, isActive = false, isAlive = true, estado = {}) {
        const item = document.createElement('div');
        item.className = `team-character-item ${isActive ? 'active' : ''} ${!isAlive ? 'blocked' : ''}`;
        item.setAttribute('data-character-id', character.id);
        
        // Determinar estado del personaje
        let status = 'Disponible';
        let statusClass = '';
        let isBlocked = false;
        
        if (!isAlive) {
            status = 'Derrotado';
            statusClass = 'blocked';
            isBlocked = true;
        } else if (isActive) {
            status = 'Peleando';
            statusClass = 'active';
        } else {
            status = 'Disponible';
            statusClass = '';
        }
        
        item.innerHTML = `
            <div class="team-character-avatar">
                <i class="fas fa-user-ninja"></i>
            </div>
            <div class="team-character-info">
                <div class="team-character-name">${character.Nombre}</div>
                <div class="team-character-status ${statusClass}">${status}</div>
                <div class="team-character-hp">HP: ${estado.hp || 100}/100</div>
            </div>
        `;
        
        // Agregar event listener para mostrar información del personaje
        item.addEventListener('click', () => {
            if (!isBlocked) {
                this.showTeamCharacterInfo(character, estado);
            }
        });
        
        return item;
    }

    showTeamCharacterInfo(character, estado = {}) {
        // Ocultar modal de equipo
        this.closeTeamModal();
        
        // Mostrar modal de información del personaje
        const modal = document.getElementById('characterModal');
        
        // Actualizar contenido del modal
        document.getElementById('modalCharacterName').textContent = character.Nombre;
        document.getElementById('modalCharacterRole').textContent = character.Rol || 'HÉROE';
        document.getElementById('modalHealth').textContent = `${estado.hp || 100}/100`;
        document.getElementById('modalEnergy').textContent = `${estado.energia || 50}/50`;
        document.getElementById('modalCombo').textContent = `${estado.combo || 0}/100`;
        document.getElementById('modalUltra').textContent = `${estado.ultra || 0}/100`;
        document.getElementById('modalAttack').textContent = character.Ataque || '85';
        document.getElementById('modalDefense').textContent = character.Defensa || '75';
        document.getElementById('modalDescription').textContent = character.Descripcion || 'Guerrero legendario con un corazón puro y un poder increíble.';
        
        // Actualizar estado en el modal
        const modalStatus = document.getElementById('modalCharacterStatus');
        if (modalStatus) {
            const estadoText = estado.estado || 'Normal';
            modalStatus.textContent = estadoText;
            modalStatus.className = `character-status ${estadoText.toLowerCase()}`;
        }
        
        // Guardar referencia al personaje actual
        this.currentTeamCharacter = character;
        
        // Agregar botón de regresar al modal
        this.addBackButtonToModal();
        
        modal.style.display = 'flex';
    }

    handleTeamBattleEnd(winner) {
        const winnerName = winner || 'Ganador';
        
        setTimeout(() => {
            alert(`¡${winnerName} ha ganado la batalla en equipo!`);
            // Redirigir al dashboard
            window.location.href = 'dashboard.html';
        }, 1000);
    }

    isCharacterActive(charId) {
        const rondaActual = this.currentBattle.rondas?.[this.currentBattle.rondaActual - 1];
        if (rondaActual && rondaActual.estadoEquipo1 && rondaActual.estadoEquipo2) {
            const isTeam1Turn = this.currentTurn === 1;
            const personajeActivo = isTeam1Turn ? 
                rondaActual.estadoEquipo1[this.currentBattle.idxActivo1] : 
                rondaActual.estadoEquipo2[this.currentBattle.idxActivo2];
            return personajeActivo?.id === charId;
        }
        return false;
    }

    // Override del método updateCharacterBars para batallas en equipo (HP máximo 100)
    updateCharacterBars(side, stats) {
        const sideSelector = side === 'left' ? '.character-side:first-child' : '.character-side:last-child';
        const container = document.querySelector(sideSelector);
        
        if (!container) return;
        
        // Asegurar que stats existe y tiene las propiedades necesarias
        const safeStats = stats || {
            hp: 100,
            energia: 50,
            combo: 0,
            ultra: 0,
            ultraUsado: false
        };

        // Normalizar las propiedades para manejar tanto HP/hp como Energia/energia
        const hp = (safeStats.HP !== undefined ? safeStats.HP : (safeStats.hp !== undefined ? safeStats.hp : 100));
        const energia = (safeStats.Energia !== undefined ? safeStats.Energia : (safeStats.energia !== undefined ? safeStats.energia : 50));
        const combo = (safeStats.Combo !== undefined ? safeStats.Combo : (safeStats.combo !== undefined ? safeStats.combo : 0));
        const ultra = (safeStats.Ultra !== undefined ? safeStats.Ultra : (safeStats.ultra !== undefined ? safeStats.ultra : 0));
        const ultraUsado = (safeStats.UltraUsado !== undefined ? safeStats.UltraUsado : (safeStats.ultraUsado !== undefined ? safeStats.ultraUsado : false));

        // Actualizar barra de vida (máximo 100 para batallas en equipo)
        const healthFill = container.querySelector('.health-fill');
        const healthText = container.querySelector('.health-text');
        if (healthFill && healthText) {
            const healthPercent = (hp / 100) * 100;
            healthFill.style.width = `${healthPercent}%`;
            healthText.textContent = `${hp}/100`;
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

    // Métodos heredados del BattleSystem que necesitan override
    showHelp() {
        const helpText = `
REGLAS DEL JUEGO - BATALLA EN EQUIPO (3v3)

🎮 MECÁNICAS BÁSICAS:
• Los equipos se alternan por turnos
• Solo el personaje activo de cada equipo puede ejecutar acciones
• Si un personaje es derrotado, el siguiente entra automáticamente
• No se permite el cambio manual de personajes
• Todos los recursos (HP, energía, combo, ultra) son individuales por personaje
• Gana el equipo que elimine a los tres personajes rivales

⚔️ ACCIONES DISPONIBLES:
• Ataque Básico: Daño moderado, gasta 10 energía, gana combo (+10)
• Ataque Fuerte: Daño alto, gasta 20 energía, gana ultra (+8)
• Combo: Daño especial, gasta 30 energía, requiere combo acumulado, gana ultra (+10)
• Defender: Reduce daño recibido, gasta 5 energía, gana ultra (+8) al defender
• Cargar Energía: Recupera 30 energía, gana ultra (+15), queda vulnerable
• Ultra Move: Daño máximo, requiere ultra al 100%

💥 NIVELES DE COMBO:
• Combo Básico (30-60): Daño 30-39, gasta 30 combo
• Combo Avanzado (61-90): Daño 45-55, gasta 30 combo
• Combo Máximo (91-100): Daño 60-75, gasta 30 combo

⚡ SISTEMA DE ENERGÍA:
• Máximo: 50 energía por personaje
• Ataque Básico: -10 energía
• Ataque Fuerte: -20 energía
• Combo: -30 energía
• Defender: -5 energía
• Cargar Energía: +30 energía

🛡️ ESTADOS ESPECIALES:
• Vulnerable: Recupera energía pero recibe más daño y gana +10 ultra al ser golpeado
• Defendiendo: Reduce daño recibido y puede contraatacar

💡 CONSEJOS PARA EQUIPOS:
• Gestiona la energía de cada personaje cuidadosamente
• Usa la defensa estratégicamente para ganar ultra
• Los ataques fuertes y combos son las mejores formas de acumular ultra
• Acumula más combo para ataques más poderosos
• El ultra solo se puede usar una vez por ronda por personaje
• Cada personaje derrotado da paso al siguiente automáticamente

🎯 OBJETIVO:
Eliminar a los tres personajes del equipo rival para ganar la batalla.
        `;
        
        alert(helpText);
        this.closeConfigModal();
    }
}

// Exportar la clase para uso global
window.TeamBattleSystem = TeamBattleSystem; 