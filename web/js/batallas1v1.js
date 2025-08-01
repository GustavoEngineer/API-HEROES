// JavaScript completo para la página de batallas 1v1

// Configuración de la API
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://api-heroes-3l62.onrender.com';

// Variables globales
let currentBattle = null;
let isActionInProgress = false;

// Función para obtener parámetros de la URL
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Función para actualizar la interfaz del jugador
function updatePlayerInterface(character, playerNumber) {
    const nameElement = document.querySelector(`.player-card:nth-child(${playerNumber === 1 ? 1 : 3}) .player-name`);
    const vidaElement = document.querySelector(`.player-card:nth-child(${playerNumber === 1 ? 1 : 3}) .stat:nth-child(1) .stat-value`);
    const energiaElement = document.querySelector(`.player-card:nth-child(${playerNumber === 1 ? 1 : 3}) .stat:nth-child(2) .stat-value`);
    const comboElement = document.querySelector(`.player-card:nth-child(${playerNumber === 1 ? 1 : 3}) .stat:nth-child(3) .stat-value`);
    const ultraElement = document.querySelector(`.player-card:nth-child(${playerNumber === 1 ? 1 : 3}) .stat:nth-child(4) .stat-value`);
    
    if (nameElement) {
        nameElement.textContent = character.Nombre || `Jugador ${playerNumber}`;
    }
    
    if (vidaElement) {
        // Asegurar que la vida se muestre como 0 si es negativa o 0
        const vida = Math.max(0, character.HP || 300);
        vidaElement.textContent = vida;
    }
    
    if (energiaElement) {
        energiaElement.textContent = character.Energia || 50;
    }
    
    if (comboElement) {
        comboElement.textContent = character.Combo || 0;
    }
    
    if (ultraElement) {
        ultraElement.textContent = character.Ultra || 0;
    }
}

// Función para actualizar el estado visual del turno
function updateTurnVisual() {
    if (!currentBattle) return;
    
    // Usar la propiedad correcta que devuelve la API
    const turnoActual = currentBattle.TurnoActual || currentBattle.turnoActual;
    
    console.log('🔄 Actualizando visual del turno:', {
        turnoActual: turnoActual,
        estado: currentBattle.estado || currentBattle.Estado,
        personaje1: currentBattle.estadoPersonaje1?.Nombre,
        personaje2: currentBattle.estadoPersonaje2?.Nombre
    });
    
    const player1Card = document.querySelector('.player-card:nth-child(1)');
    const player2Card = document.querySelector('.player-card:nth-child(3)');
    
    // Remover todas las clases de estado anteriores
    player1Card.classList.remove('active-turn', 'inactive-turn', 'winner', 'loser');
    player2Card.classList.remove('active-turn', 'inactive-turn', 'winner', 'loser');
    
    if (currentBattle.estado === 'Finalizada' || currentBattle.Estado === 'Finalizada') {
        // Batalla terminada - mostrar ganador y perdedor
        const ganador = currentBattle.ganador || currentBattle.Ganador;
        const personaje1Nombre = currentBattle.estadoPersonaje1?.Nombre;
        const personaje2Nombre = currentBattle.estadoPersonaje2?.Nombre;
        
        if (ganador === personaje1Nombre) {
            player1Card.classList.add('winner');
            player2Card.classList.add('loser');
        } else if (ganador === personaje2Nombre) {
            player2Card.classList.add('winner');
            player1Card.classList.add('loser');
        }
        
        updateBattleStatus(`🏆 ¡${ganador} ha ganado la batalla!`);
        console.log(`🏆 Batalla finalizada - Ganador: ${ganador}`);
        return;
    }
    
    // Marcar el jugador activo
    if (turnoActual === 1) {
        player1Card.classList.add('active-turn');
        player2Card.classList.add('inactive-turn');
        updateBattleStatus(`🎯 Turno de ${currentBattle.estadoPersonaje1.Nombre}`);
        console.log(`✅ Personaje 1 (${currentBattle.estadoPersonaje1.Nombre}) marcado como activo`);
    } else {
        player2Card.classList.add('active-turn');
        player1Card.classList.add('inactive-turn');
        updateBattleStatus(`🎯 Turno de ${currentBattle.estadoPersonaje2.Nombre}`);
        console.log(`✅ Personaje 2 (${currentBattle.estadoPersonaje2.Nombre}) marcado como activo`);
    }
}

// Función para actualizar el estado de la batalla
function updateBattleStatus(message) {
    const statusElement = document.querySelector('.battle-status p');
    const statusContainer = document.querySelector('.battle-status');
    
    if (statusElement) {
        statusElement.textContent = message;
    }
    
    // Aplicar clase especial si la batalla terminó
    if (message.includes('🏆') || message.includes('ganado')) {
        statusContainer.classList.add('battle-ended');
    } else {
        statusContainer.classList.remove('battle-ended');
    }
}

// Función para actualizar el estado de los botones según las acciones disponibles
function updateActionButtons() {
    console.log('🔄 updateActionButtons llamado con:', {
        currentBattle: !!currentBattle,
        estado: currentBattle?.estado || currentBattle?.Estado,
        isActionInProgress: isActionInProgress
    });
    
    if (!currentBattle || currentBattle.estado === 'Finalizada' || currentBattle.Estado === 'Finalizada' || isActionInProgress) {
        // Deshabilitar todos los botones
        const buttons = document.querySelectorAll('.action-btn');
        buttons.forEach(btn => btn.disabled = true);
        console.log('❌ Botones deshabilitados por condición:', { 
            noBatalla: !currentBattle, 
            batallaTerminada: currentBattle?.estado === 'Finalizada' || currentBattle?.Estado === 'Finalizada', 
            accionEnProgreso: isActionInProgress 
        });
        return;
    }
    
    // Usar la propiedad correcta que devuelve la API
    const turnoActual = currentBattle.TurnoActual || currentBattle.turnoActual;
    
    // Determinar qué personaje está jugando
    const currentPlayer = turnoActual === 1 ? currentBattle.estadoPersonaje1 : currentBattle.estadoPersonaje2;
    
    console.log('Actualizando botones para:', currentPlayer.Nombre, {
        turnoActual: turnoActual,
        energia: currentPlayer.Energia,
        combo: currentPlayer.Combo,
        ultra: currentPlayer.Ultra,
        ultraUsado: currentPlayer.UltraUsado
    });
    
    const buttons = document.querySelectorAll('.action-btn');
    buttons.forEach(btn => {
        const action = btn.textContent;
        const canExecute = canExecuteAction(currentPlayer, action);
        btn.disabled = !canExecute;
        
        // Log específico para Cargar Energía
        if (action === 'Cargar Energía') {
            console.log(`🔋 Cargar Energía - Estado:`, {
                canExecute: canExecute,
                disabled: btn.disabled,
                player: currentPlayer.Nombre,
                energia: currentPlayer.Energia
            });
        }
        
        console.log(`Botón ${action}: ${canExecute ? 'HABILITADO' : 'DESHABILITADO'}`);
    });
    
    console.log('✅ updateActionButtons completado');
}

// Función para verificar si se puede ejecutar una acción
function canExecuteAction(player, action) {
    // Asegurar que UltraUsado esté definido
    if (player.UltraUsado === undefined) {
        player.UltraUsado = false;
    }
    
    const result = (() => {
        switch (action) {
            case 'Ataque Básico':
                return player.Energia >= 10;
            case 'Ataque Fuerte':
                return player.Energia >= 20;
            case 'Defender':
                return player.Energia >= 5;
            case 'Cargar Energía':
                return true; // Siempre disponible
            case 'Combo':
                return player.Combo >= 30 && player.Energia >= 30;
            case 'Ultra Move':
                return player.Ultra >= 100 && !player.UltraUsado;
            default:
                return false;
        }
    })();
    
    console.log(`Verificando ${action} para ${player.Nombre}:`, {
        energia: player.Energia,
        combo: player.Combo,
        ultra: player.Ultra,
        ultraUsado: player.UltraUsado,
        resultado: result
    });
    
    return result;
}

// Función para cargar datos de la batalla
async function loadBattleData() {
    try {
        const battleId = getUrlParameter('battleId');
        
        if (!battleId) {
            updateBattleStatus('Error: No se encontró ID de batalla en la URL');
            return;
        }
        
        console.log(`Cargando datos de batalla para battleId: ${battleId}`);
        
        const response = await fetch(`${API_BASE_URL}/api/batallas/${battleId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const battle = await response.json();
        console.log('Datos de batalla cargados:', battle);
        console.log('📊 Detalles del turno:', {
            turnoActual: battle.TurnoActual || battle.turnoActual,
            estado: battle.estado || battle.Estado,
            ganador: battle.ganador || battle.Ganador,
            personaje1: battle.estadoPersonaje1?.Nombre,
            personaje2: battle.estadoPersonaje2?.Nombre
        });
        
        // Actualizar variables globales
        currentBattle = battle;
        
        // Actualizar interfaz con los datos de la batalla
        if (battle.estadoPersonaje1) {
            updatePlayerInterface(battle.estadoPersonaje1, 1);
        }
        
        if (battle.estadoPersonaje2) {
            updatePlayerInterface(battle.estadoPersonaje2, 2);
        }
        
        // Actualizar visual del turno
        updateTurnVisual();
        
        // Actualizar estado de los botones
        updateActionButtons();
        
        console.log('✅ loadBattleData completado - Interfaz actualizada');
        
    } catch (error) {
        console.error('Error cargando datos de batalla:', error);
        updateBattleStatus('Error al cargar datos de la batalla');
    }
}

// Función para ejecutar una acción en la batalla
async function executeAction(action) {
    if (!currentBattle || isActionInProgress) {
        updateBattleStatus('No puedes jugar en este momento');
        return;
    }
    
    // Marcar que hay una acción en progreso
    isActionInProgress = true;
    
    try {
        // Usar la propiedad correcta que devuelve la API
        const turnoActual = currentBattle.TurnoActual || currentBattle.turnoActual;
        
        // Determinar qué personaje está jugando
        const currentPlayer = turnoActual === 1 ? currentBattle.estadoPersonaje1 : currentBattle.estadoPersonaje2;
        const personajeId = currentPlayer.ID;
        
        console.log(`Ejecutando acción: ${action} con personaje: ${currentPlayer.Nombre}`);
        
        // Mostrar mensaje de "pensando"
        updateBattleStatus(`🤔 ${currentPlayer.Nombre} está ejecutando ${action}...`);
        
        // Enviar acción a la API
        const requestBody = {
            batallaId: currentBattle.id,
            personajeId: personajeId,
            accion: action
        };
        
        console.log('Enviando a la API:', requestBody);
        
        const response = await fetch(`${API_BASE_URL}/api/batallas/accion`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(requestBody)
        });
        
        const responseData = await response.json();
        console.log('Respuesta de la API:', responseData);
        
        if (!response.ok) {
            updateBattleStatus(responseData.error || 'Error al ejecutar acción');
            return;
        }
        
        const result = responseData;
        
        console.log('Resultado completo de la API:', result);
        
        // Mostrar mensaje de la acción
        if (result.mensaje) {
            updateBattleStatus(result.mensaje);
        }
        
        // Verificar si el juego terminó
        if (result.ganador) {
            // Actualizar el estado de la batalla con los datos finales de la API
            if (result.estado) {
                const player1Name = currentBattle.estadoPersonaje1.Nombre;
                const player2Name = currentBattle.estadoPersonaje2.Nombre;
                
                if (result.estado[player1Name]) {
                    currentBattle.estadoPersonaje1 = result.estado[player1Name];
                }
                if (result.estado[player2Name]) {
                    currentBattle.estadoPersonaje2 = result.estado[player2Name];
                }
            }
            
            // Actualizar variables globales
            currentBattle.estado = 'Finalizada';
            currentBattle.ganador = result.ganador;
            
            // Actualizar interfaz con los datos finales
            if (currentBattle.estadoPersonaje1) {
                updatePlayerInterface(currentBattle.estadoPersonaje1, 1);
            }
            if (currentBattle.estadoPersonaje2) {
                updatePlayerInterface(currentBattle.estadoPersonaje2, 2);
            }
            
            // Actualizar visual del turno (mostrar ganador/perdedor)
            updateTurnVisual();
            
            // Deshabilitar todos los botones
            updateActionButtons();
            
            // Mostrar mensaje de victoria
            updateBattleStatus(`🏆 ¡${result.ganador} ha ganado la batalla!`);
            
            console.log('🏆 Batalla finalizada - Interfaz actualizada en tiempo real');
        } else {
            // Recargar los datos completos de la batalla para obtener el estado actualizado
            console.log('Recargando datos de la batalla después de la acción...');
            await loadBattleData();
            
            // Usar la propiedad correcta que devuelve la API
            const turnoActual = currentBattle.TurnoActual || currentBattle.turnoActual;
            
            // Mostrar quién es el siguiente en jugar
            const nextPlayer = turnoActual === 1 ? currentBattle.estadoPersonaje1.Nombre : currentBattle.estadoPersonaje2.Nombre;
            setTimeout(() => {
                updateBattleStatus(`🎯 Turno de ${nextPlayer}`);
            }, 1000);
        }
        
        console.log('Estado final de la batalla después de recargar:', {
            turnoActual: currentBattle.TurnoActual || currentBattle.turnoActual,
            personaje1: currentBattle.estadoPersonaje1,
            personaje2: currentBattle.estadoPersonaje2
        });
        
        // La interfaz ya se actualiza en loadBattleData()
        
    } catch (error) {
        console.error('Error ejecutando acción:', error);
        updateBattleStatus('Error de conexión');
    } finally {
        // Marcar que la acción ha terminado
        isActionInProgress = false;
        console.log('🔄 isActionInProgress reseteado a false');
        
        // Forzar actualización de botones después de resetear isActionInProgress
        setTimeout(() => {
            console.log('🔄 Forzando actualización final de botones...');
            updateActionButtons();
        }, 200);
    }
}

// Función para manejar acciones de batalla
function handleBattleAction(action) {
    console.log(`Acción solicitada: ${action}`);
    executeAction(action);
}

// Función para agregar event listeners a los botones
function addButtonEventListeners() {
    const actionButtons = document.querySelectorAll('.action-btn');
    
    actionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const action = button.textContent;
            handleBattleAction(action);
        });
    });
}

// Función de inicialización
async function init() {
    console.log('Inicializando página de batalla...');
    
    // Verificar autenticación
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No hay token de autenticación');
        updateBattleStatus('Error: Debes iniciar sesión para jugar');
        return;
    }
    
    console.log('Token encontrado');
    
    // Actualizar estado inicial
    updateBattleStatus('Cargando batalla...');
    
    // Cargar datos de la batalla
    await loadBattleData();
    
    // Agregar event listeners a los botones
    addButtonEventListeners();
    
    console.log('Página de batalla inicializada');
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);