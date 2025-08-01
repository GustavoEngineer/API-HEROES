// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://api-heroes-3l62.onrender.com';

// Dashboard Navigation and Interactions
document.addEventListener('DOMContentLoaded', function() {
    
    // Navigation functionality with horizontal scroll animation
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.dashboard-section');
    const sectionsContainer = document.querySelector('.dashboard-sections-container');
    
    // Array to track section order
    const sectionOrder = ['profile', 'characters', 'battles1v1'];
    let currentSectionIndex = 0;
    
    // Handle navigation clicks
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Check if this is the close/logout button
            const targetSection = this.getAttribute('data-section');
            if (targetSection === 'logout') {
                // Handle logout functionality
                if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                    showMessage('Cerrando sesión...', 'info');
                    
                    // Simulate logout process
                    setTimeout(() => {
                        // Clear any stored session data
                        localStorage.removeItem('userSession');
                        sessionStorage.clear();
                        
                        // Redirect to index page
                        window.location.href = '../index.html';
                    }, 1500);
                }
                return;
            }
            
            // Get the target section index
            const targetIndex = sectionOrder.indexOf(targetSection);
            if (targetIndex === -1) return;
            
            // Determine scroll direction
            const scrollDirection = targetIndex > currentSectionIndex ? 'right' : 'left';
            
            // Animate the transition
            animateSectionTransition(targetIndex, scrollDirection);
            
            // Update current section index
            currentSectionIndex = targetIndex;
            
            // Update navigation active state
            updateNavigationActiveState(targetSection);
        });
    });
    
    // Function to animate section transition
    function animateSectionTransition(targetIndex, direction) {
        const container = document.querySelector('.dashboard-sections-container');
        const translateX = -(targetIndex * 33.33); // 33.33% per section (3 sections)
        
        // Add transition class for smooth animation
        container.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        
        // Apply the transform
        container.style.transform = `translateX(${translateX}%)`;
        
        // Update section classes for visual feedback
        sections.forEach((section, index) => {
            section.classList.remove('active', 'slide-left', 'slide-right', 'slide-center');
            
            if (index === targetIndex) {
                section.classList.add('active', 'slide-center');
            } else if (index < targetIndex) {
                section.classList.add('slide-left');
            } else {
                section.classList.add('slide-right');
            }
        });
        
        // Add entrance animation to the target section
        const targetSection = sections[targetIndex];
        targetSection.classList.add(direction === 'right' ? 'slide-in-right' : 'slide-in-left');
        
        // Remove entrance animation class after animation completes
        setTimeout(() => {
            targetSection.classList.remove('slide-in-right', 'slide-in-left');
        }, 600);
    }
    
    // Function to update navigation active state
    function updateNavigationActiveState(activeSection) {
        navItems.forEach(nav => {
            nav.classList.remove('active');
            if (nav.getAttribute('data-section') === activeSection) {
                nav.classList.add('active');
            }
        });
        
        // Update navigation progress bar
        const navBar = document.querySelector('.dashboard-nav');
        const progress = (currentSectionIndex / (sectionOrder.length - 1)) * 100;
        navBar.style.setProperty('--nav-progress', `${progress}%`);
        
        // Add progress class for visual feedback
        navBar.classList.add('nav-progress');
        setTimeout(() => {
            navBar.classList.remove('nav-progress');
        }, 600);
    }
    
    // Initialize the first section
    function initializeSections() {
        sections.forEach((section, index) => {
            section.classList.remove('active', 'slide-left', 'slide-right', 'slide-center');
            if (index === 0) {
                section.classList.add('active', 'slide-center');
            } else {
                section.classList.add('slide-right');
            }
        });
        
        // Set initial transform
        const container = document.querySelector('.dashboard-sections-container');
        container.style.transform = 'translateX(0%)';
    }
    
    // Initialize sections on load
    initializeSections();
    
    // Load user data from localStorage
    loadUserData();
    
    // Load user partidas from API
    loadUserPartidas();
    
    // Load characters from API
    loadCharactersFromAPI();
    
    // Initialize filters
    initializeFilters();
    

    
    // Character card hover effects
    const characterCards = document.querySelectorAll('.character-card');
    characterCards.forEach(card => {
        card.addEventListener('click', function() {
            const characterName = this.querySelector('h3').textContent;
            showMessage(`${characterName} seleccionado`, 'success');
        });
    });
    
    // Create character functionality
    const createBtns = document.querySelectorAll('.create-btn');
    createBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            showMessage('Función de crear personaje próximamente', 'info');
        });
    });
    
    // Battle functionality
    const battleBtns = document.querySelectorAll('.battle-btn');
    battleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.querySelector('span').textContent;
            showMessage(`${action} - Función próximamente`, 'info');
        });
    });
    
    // Team functionality
    const teamBtns = document.querySelectorAll('.team-btn');
    teamBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.querySelector('span').textContent;
            showMessage(`${action} - Función próximamente`, 'info');
        });
    });
    
    // Join team functionality
    const joinTeamBtn = document.querySelector('.join-team-btn');
    if (joinTeamBtn) {
        joinTeamBtn.addEventListener('click', function() {
            showMessage('Buscando equipos disponibles...', 'info');
        });
    }
    
    // Sort by elixir functionality
    const sortBtn = document.querySelector('.sort-btn');
    if (sortBtn) {
        sortBtn.addEventListener('click', function() {
            showMessage('Ordenando por costo de elixir...', 'info');
        });
    }
    
    // Message display function
    function showMessage(message, type) {
        // Remove existing messages
        const existingMessage = document.querySelector('.dashboard-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `dashboard-message dashboard-message-${type}`;
        messageDiv.textContent = message;
        
                 // Add styles
         messageDiv.style.cssText = `
             position: fixed;
             top: 80px;
             left: 50%;
             transform: translateX(-50%);
            padding: 1rem 2rem;
            border-radius: 8px;
            font-family: 'Orbitron', monospace;
            font-weight: 600;
            z-index: 10000;
            animation: slideDown 0.3s ease;
            ${type === 'success' ? 
                'background: linear-gradient(135deg, #00CED1, #008B8B); color: white; box-shadow: 0 0 20px rgba(0, 206, 209, 0.5);' : 
                type === 'error' ?
                'background: linear-gradient(135deg, #FF69B4, #FF1493); color: white; box-shadow: 0 0 20px rgba(255, 105, 180, 0.5);' :
                'background: linear-gradient(135deg, #FFD700, #FFA500); color: white; box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);'
            }
        `;
        
        // Add animation styles if not already present
        if (!document.querySelector('#dashboard-animations')) {
            const style = document.createElement('style');
            style.id = 'dashboard-animations';
            style.textContent = `
                @keyframes slideDown {
                    from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
                    to { transform: translateX(-50%) translateY(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Add to page
        document.body.appendChild(messageDiv);
        
        // Remove message after 3 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }
    
    // Add hover effects to stat items
    const statItems = document.querySelectorAll('.stat-item');
    statItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.05)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Add loading states to buttons
    function setLoadingState(button, isLoading) {
        if (isLoading) {
            button.disabled = true;
            button.style.opacity = '0.7';
            button.style.cursor = 'not-allowed';
        } else {
            button.disabled = false;
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
        }
    }
    
    // Simulate loading for battle search
    const searchBattleBtn = document.querySelector('.battle-btn.primary');
    if (searchBattleBtn) {
        searchBattleBtn.addEventListener('click', function() {
            setLoadingState(this, true);
            this.innerHTML = '<i class="ph-spinner"></i> <span>Buscando...</span>';
            
            // Simulate search time
            setTimeout(() => {
                setLoadingState(this, false);
                this.innerHTML = '<i class="ph-sword"></i> <span>Buscar Rival</span>';
                showMessage('No se encontraron rivales disponibles', 'info');
            }, 2000);
        });
    }
    
    // Add keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Return to profile section
            const profileIndex = sectionOrder.indexOf('profile');
            animateSectionTransition(profileIndex, 'left');
            currentSectionIndex = profileIndex;
            updateNavigationActiveState('profile');
        } else if (e.key === 'ArrowLeft') {
            // Navigate to previous section
            const prevIndex = Math.max(0, currentSectionIndex - 1);
            if (prevIndex !== currentSectionIndex) {
                animateSectionTransition(prevIndex, 'left');
                currentSectionIndex = prevIndex;
                updateNavigationActiveState(sectionOrder[prevIndex]);
            }
        } else if (e.key === 'ArrowRight') {
            // Navigate to next section
            const nextIndex = Math.min(sectionOrder.length - 1, currentSectionIndex + 1);
            if (nextIndex !== currentSectionIndex) {
                animateSectionTransition(nextIndex, 'right');
                currentSectionIndex = nextIndex;
                updateNavigationActiveState(sectionOrder[nextIndex]);
            }
        }
    });
    
    // Initialize tooltips for better UX
    function initializeTooltips() {
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        tooltipElements.forEach(element => {
            element.addEventListener('mouseenter', function() {
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.textContent = this.getAttribute('data-tooltip');
                tooltip.style.cssText = `
                    position: absolute;
                    background: rgba(0, 0, 0, 0.9);
                    color: white;
                    padding: 0.5rem;
                    border-radius: 4px;
                    font-size: 0.8rem;
                    z-index: 10001;
                    pointer-events: none;
                    white-space: nowrap;
                `;
                
                document.body.appendChild(tooltip);
                
                const rect = this.getBoundingClientRect();
                tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
                tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';
            });
            
            element.addEventListener('mouseleave', function() {
                const tooltip = document.querySelector('.tooltip');
                if (tooltip) {
                    tooltip.remove();
                }
            });
        });
    }
    
    // Initialize tooltips
    initializeTooltips();
    
    // Add some interactive animations
    function addInteractiveAnimations() {
        // Add pulse animation to create character button
        const createBtn = document.querySelector('.create-btn');
        if (createBtn) {
            createBtn.style.animation = 'pulse 2s infinite';
        }
        
        // Add the pulse keyframe if not already present
        if (!document.querySelector('#pulse-animation')) {
            const style = document.createElement('style');
            style.id = 'pulse-animation';
            style.textContent = `
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Initialize animations
    addInteractiveAnimations();
    
    // Game Mode Dropdown functionality
    const newGameBtn = document.getElementById('newGameBtn');
    const gameModeDropdown = document.getElementById('gameModeDropdown');
    const dropdownOptions = document.querySelectorAll('.dropdown-option');
    
    if (newGameBtn && gameModeDropdown) {
        // Toggle dropdown on button click
        newGameBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            gameModeDropdown.classList.toggle('show');
        });
        
        // Handle dropdown option clicks
        dropdownOptions.forEach(option => {
            option.addEventListener('click', function(e) {
                e.stopPropagation();
                const mode = this.getAttribute('data-mode');
                const modeText = this.querySelector('span').textContent;
                
                // Update button text to show selected mode
                const buttonText = newGameBtn.querySelector('span');
                buttonText.textContent = `${modeText}`;
                
                // Hide dropdown
                gameModeDropdown.classList.remove('show');
                
                // Show setup panel
                showGameSetupPanel(mode, modeText);
                
                // Show message based on selected mode
                if (mode === '1v1') {
                    showMessage('Configurando partida 1v1...', 'info');
                } else if (mode === 'team') {
                    showMessage('Configurando partida en equipo...', 'info');
                }
            });
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!newGameBtn.contains(e.target) && !gameModeDropdown.contains(e.target)) {
                gameModeDropdown.classList.remove('show');
            }
        });
        
        // Close dropdown on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && gameModeDropdown.classList.contains('show')) {
                gameModeDropdown.classList.remove('show');
            }
        });
    }
    
    // Game Setup Panel functionality
    const gameSetupPanel = document.getElementById('gameSetupPanel');
    const closeSetupBtn = document.getElementById('closeSetupBtn');
    const cancelSetupBtn = document.getElementById('cancelSetupBtn');
    const startGameBtn = document.getElementById('startGameBtn');
    const modeDisplay = document.getElementById('modeDisplay');
    const setupTitle = document.getElementById('setupTitle');
    
    function showGameSetupPanel(mode, modeText) {
        // Update panel content based on mode
        if (mode === '1v1') {
            setupTitle.textContent = 'Configuración 1v1';
            modeDisplay.innerHTML = '<img src="../Images/Icons/runa.png" alt="Runa" class="mode-rune-icon"><span>1v1</span>';
            
            // Update setup content for 1v1 mode
            updateSetupContentFor1v1();
        } else if (mode === 'team') {
            setupTitle.textContent = 'Configuración En Equipo';
            modeDisplay.innerHTML = '<img src="../Images/Icons/runa.png" alt="Runa" class="mode-rune-icon"><span>En Equipo</span>';
            
            // Update setup content for team mode
            updateSetupContentForTeam();
        }
        
        // Change arena image to runa when configuring
        const arenaImage = document.getElementById('arenaImage');
        if (arenaImage) {
            arenaImage.src = '../Images/Icons/runa.png';
            arenaImage.alt = 'Runa Mágica';
        }
        
        // Shift content to the left to make space for panel
        const battleArenaContent = document.querySelector('.battle-arena-content');
        if (battleArenaContent) {
            battleArenaContent.classList.add('shifted');
        }
        
        // Show the panel
        gameSetupPanel.classList.add('show');
    }
    
    function updateSetupContentFor1v1() {
        const setupContent = document.querySelector('.setup-content');
        
        // Clear existing content
        setupContent.innerHTML = '';
        
        // Add character selection dropdowns section
        const characterSection = document.createElement('div');
        characterSection.className = 'setup-section';
        characterSection.innerHTML = `
            <label for="character1Select">Personaje 1:</label>
            <select id="character1Select" class="character-select">
                <option value="">Selecciona el primer personaje</option>
            </select>

        `;
        setupContent.appendChild(characterSection);
        
        const character2Section = document.createElement('div');
        character2Section.className = 'setup-section';
        character2Section.innerHTML = `
            <label for="character2Select">Personaje 2:</label>
            <select id="character2Select" class="character-select">
                <option value="">Selecciona el segundo personaje</option>
            </select>

        `;
        setupContent.appendChild(character2Section);
        
        // Populate dropdowns with characters from API
        populateCharacterDropdowns();
        

    }
    
    function updateSetupContentForTeam() {
        const setupContent = document.querySelector('.setup-content');
        
        // Clear existing content
        setupContent.innerHTML = '';
        
        // Add team 1 section
        const team1Section = document.createElement('div');
        team1Section.className = 'setup-section';
        team1Section.innerHTML = `
            <label>Equipo 1:</label>
            <div class="team-characters">
                <div class="character-input-group">
                    <label for="team1Char1">Personaje 1:</label>
                    <select id="team1Char1" class="character-select">
                        <option value="">Selecciona el personaje</option>
                    </select>
                </div>
                <div class="character-input-group">
                    <label for="team1Char2">Personaje 2:</label>
                    <select id="team1Char2" class="character-select">
                        <option value="">Selecciona el personaje</option>
                    </select>
                </div>
                <div class="character-input-group">
                    <label for="team1Char3">Personaje 3:</label>
                    <select id="team1Char3" class="character-select">
                        <option value="">Selecciona el personaje</option>
                    </select>
                </div>
            </div>
        `;
        setupContent.appendChild(team1Section);
        
        // Add team 2 section
        const team2Section = document.createElement('div');
        team2Section.className = 'setup-section';
        team2Section.innerHTML = `
            <label>Equipo 2:</label>
            <div class="team-characters">
                <div class="character-input-group">
                    <label for="team2Char1">Personaje 1:</label>
                    <select id="team2Char1" class="character-select">
                        <option value="">Selecciona el personaje</option>
                    </select>
                </div>
                <div class="character-input-group">
                    <label for="team2Char2">Personaje 2:</label>
                    <select id="team2Char2" class="character-select">
                        <option value="">Selecciona el personaje</option>
                    </select>
                </div>
                <div class="character-input-group">
                    <label for="team2Char3">Personaje 3:</label>
                    <select id="team2Char3" class="character-select">
                        <option value="">Selecciona el personaje</option>
                    </select>
                </div>
            </div>
        `;
        setupContent.appendChild(team2Section);
        
        // Populate dropdowns with characters from API
        populateTeamCharacterDropdowns();
        

    }
    
    function populateCharacterDropdowns() {
        const character1Select = document.getElementById('character1Select');
        const character2Select = document.getElementById('character2Select');
        
        if (!character1Select || !character2Select) return;
        
        // Clear existing options except the first one
        character1Select.innerHTML = '<option value="">Selecciona el primer personaje</option>';
        character2Select.innerHTML = '<option value="">Selecciona el segundo personaje</option>';
        
        // Add character options if we have characters loaded
        if (allCharacters && allCharacters.length > 0) {
            allCharacters.forEach(personaje => {
                const option1 = document.createElement('option');
                option1.value = personaje.id;
                option1.textContent = `${personaje.Nombre} (${personaje.Categoria})`;
                character1Select.appendChild(option1);
                
                const option2 = document.createElement('option');
                option2.value = personaje.id;
                option2.textContent = `${personaje.Nombre} (${personaje.Categoria})`;
                character2Select.appendChild(option2);
            });
        } else {
            // If no characters loaded, try to load them
            loadCharactersFromAPI().then(() => {
                populateCharacterDropdowns();
            });
        }
    }
    

    
    function populateTeamCharacterDropdowns() {
        const team1Inputs = ['team1Char1', 'team1Char2', 'team1Char3'];
        const team2Inputs = ['team2Char1', 'team2Char2', 'team2Char3'];
        
        // Populate team 1 dropdowns
        team1Inputs.forEach(inputId => {
            const select = document.getElementById(inputId);
            if (select) {
                select.innerHTML = '<option value="">Selecciona el personaje</option>';
                
                if (allCharacters && allCharacters.length > 0) {
                    allCharacters.forEach(personaje => {
                        const option = document.createElement('option');
                        option.value = personaje.id;
                        option.textContent = `${personaje.Nombre} (${personaje.Categoria})`;
                        select.appendChild(option);
                    });
                }
            }
        });
        
        // Populate team 2 dropdowns
        team2Inputs.forEach(inputId => {
            const select = document.getElementById(inputId);
            if (select) {
                select.innerHTML = '<option value="">Selecciona el personaje</option>';
                
                if (allCharacters && allCharacters.length > 0) {
                    allCharacters.forEach(personaje => {
                        const option = document.createElement('option');
                        option.value = personaje.id;
                        option.textContent = `${personaje.Nombre} (${personaje.Categoria})`;
                        select.appendChild(option);
                    });
                }
            }
        });
        
        // If no characters loaded, try to load them
        if (!allCharacters || allCharacters.length === 0) {
            loadCharactersFromAPI().then(() => {
                populateTeamCharacterDropdowns();
            });
        }
    }
    

    
    function hideGameSetupPanel() {
        gameSetupPanel.classList.remove('show');
        // Reset button text
        const buttonText = newGameBtn.querySelector('span');
        buttonText.textContent = 'Nueva Partida';
        
        // Change arena image back to coliseum
        const arenaImage = document.getElementById('arenaImage');
        if (arenaImage) {
            arenaImage.src = '../Images/Icons/campus.png';
            arenaImage.alt = 'Arena de Batalla';
        }
        
        // Remove shift class to return content to center
        const battleArenaContent = document.querySelector('.battle-arena-content');
        if (battleArenaContent) {
            battleArenaContent.classList.remove('shifted');
        }
    }
    
    // Close setup panel events
    if (closeSetupBtn) {
        closeSetupBtn.addEventListener('click', hideGameSetupPanel);
    }
    
    if (cancelSetupBtn) {
        cancelSetupBtn.addEventListener('click', hideGameSetupPanel);
    }
    
    // Start game functionality
    if (startGameBtn) {
        startGameBtn.addEventListener('click', async function() {
            // Get current game mode
            const setupTitle = document.getElementById('setupTitle');
            const isTeamMode = setupTitle && setupTitle.textContent.includes('En Equipo');
            
            let characterIds = [];
            
            if (isTeamMode) {
                // Team mode - get all 6 character selections
                const team1Inputs = ['team1Char1', 'team1Char2', 'team1Char3'];
                const team2Inputs = ['team2Char1', 'team2Char2', 'team2Char3'];
                
                // Get all character selections
                const allInputs = [...team1Inputs, ...team2Inputs];
                for (const inputId of allInputs) {
                    const select = document.getElementById(inputId);
                    if (!select || !select.value) {
                        showMessage('Debes seleccionar todos los personajes para ambos equipos', 'error');
                        return;
                    }
                    characterIds.push(select.value);
                }
                
                // Check for duplicates
                const uniqueIds = new Set(characterIds);
                if (uniqueIds.size !== characterIds.length) {
                    showMessage('No puedes seleccionar el mismo personaje más de una vez', 'error');
                    return;
                }
            } else {
                // 1v1 mode - get two character selections
                const character1Select = document.getElementById('character1Select');
                const character2Select = document.getElementById('character2Select');
                
                // Check if both characters are selected
                if (!character1Select || !character2Select || !character1Select.value || !character2Select.value) {
                    showMessage('Debes seleccionar ambos personajes para iniciar la partida', 'error');
                    return;
                }
                
                // Check if same character is selected
                if (character1Select.value === character2Select.value) {
                    showMessage('No puedes seleccionar el mismo personaje para ambos lados', 'error');
                    return;
                }
                
                characterIds = [character1Select.value, character2Select.value];
            }
            
            // Show loading state
            setLoadingState(this, true);
            this.innerHTML = '<i class="ph-spinner"></i> <span>Iniciando partida...</span>';
            
            try {
                // Get token from localStorage
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No hay token de autenticación. Por favor, inicia sesión nuevamente.');
                }
                
                // Prepare battle data based on mode
                let battleData;
                let apiEndpoint;
                
                if (isTeamMode) {
                    // 3v3 battle data - enviar arrays simples de IDs
                    battleData = {
                        equipo1: [characterIds[0], characterIds[1], characterIds[2]],
                        equipo2: [characterIds[3], characterIds[4], characterIds[5]]
                    };
                    apiEndpoint = `${API_BASE_URL}/api/batallas3v3`;
                } else {
                    // 1v1 battle data
                    battleData = {
                        personaje1Id: characterIds[0],
                        personaje2Id: characterIds[1]
                    };
                    apiEndpoint = `${API_BASE_URL}/api/batallas`;
                }
                
                // Send request to API
                const response = await fetch(apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(battleData)
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al crear la batalla');
                }
                
                const battleResult = await response.json();
                
                // Hide setup panel
                hideGameSetupPanel();
                
                // Show success message with battle details
                if (isTeamMode) {
                    // Get team member names for 3v3
                    const equipo1Names = characterIds.slice(0, 3).map(id => {
                        const char = allCharacters.find(char => char.id === id);
                        return char ? char.Nombre : 'Personaje';
                    });
                    const equipo2Names = characterIds.slice(3, 6).map(id => {
                        const char = allCharacters.find(char => char.id === id);
                        return char ? char.Nombre : 'Personaje';
                    });
                    
                    // Guardar información de la batalla 3v3 en localStorage
                    const battleInfo = {
                        equipo1: characterIds.slice(0, 3).map(id => {
                            const char = allCharacters.find(char => char.id === id);
                            return {
                                id: id,
                                nombre: char ? char.Nombre : 'Personaje'
                            };
                        }),
                        equipo2: characterIds.slice(3, 6).map(id => {
                            const char = allCharacters.find(char => char.id === id);
                            return {
                                id: id,
                                nombre: char ? char.Nombre : 'Personaje'
                            };
                        })
                    };
                    localStorage.setItem('currentBattle', JSON.stringify(battleInfo));
                    
                    showMessage(`¡Batalla 3v3 creada exitosamente! Equipo 1: ${equipo1Names.join(', ')} vs Equipo 2: ${equipo2Names.join(', ')}`, 'success');
                } else {
                    // 1v1 battle message
                    const personaje1 = allCharacters.find(char => char.id === characterIds[0]);
                    const personaje2 = allCharacters.find(char => char.id === characterIds[1]);
                    const personaje1Name = personaje1 ? personaje1.Nombre : 'Personaje 1';
                    const personaje2Name = personaje2 ? personaje2.Nombre : 'Personaje 2';
                    
                    // Guardar información de la batalla 1v1 en localStorage
                    localStorage.setItem('currentBattle', JSON.stringify(battleResult));
                    
                    showMessage(`¡Batalla creada exitosamente! ${personaje1Name} vs ${personaje2Name}`, 'success');
                }
                
                // Redirigir a la interfaz de batalla
                setTimeout(() => {
                    if (isTeamMode) {
                        // Para batallas en equipo, pasar el battleId y el modo
                        window.location.href = `campobatallas.html?battleId=${battleResult.id}&mode=team`;
                    } else {
                        // Para batallas 1v1, redirigir a batallas1v1.html
                        window.location.href = `batallas1v1.html?battleId=${battleResult.id}`;
                    }
                }, 1500);
                
            } catch (error) {
                console.error('Error creating battle:', error);
                showMessage(`Error: ${error.message}`, 'error');
            } finally {
                // Reset button state
                setLoadingState(this, false);
                this.innerHTML = '<i class="ph-play"></i> <span>Iniciar Partida</span>';
            }
        });
    }
    

    
    // Close panel on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && gameSetupPanel.classList.contains('show')) {
            hideGameSetupPanel();
        }
    });
    
    // Close panel when clicking outside
    document.addEventListener('click', function(e) {
        if (gameSetupPanel.classList.contains('show') && 
            !gameSetupPanel.contains(e.target) && 
            !newGameBtn.contains(e.target)) {
            hideGameSetupPanel();
        }
    });
    
    // Add touch/swipe support for mobile devices
    let touchStartX = 0;
    let touchEndX = 0;
    
    function handleSwipe() {
        const swipeThreshold = 50; // Minimum distance for a swipe
        const swipeDistance = touchEndX - touchStartX;
        
        if (Math.abs(swipeDistance) > swipeThreshold) {
            if (swipeDistance > 0) {
                // Swipe right - go to previous section
                const prevIndex = Math.max(0, currentSectionIndex - 1);
                if (prevIndex !== currentSectionIndex) {
                    animateSectionTransition(prevIndex, 'left');
                    currentSectionIndex = prevIndex;
                    updateNavigationActiveState(sectionOrder[prevIndex]);
                }
            } else {
                // Swipe left - go to next section
                const nextIndex = Math.min(sectionOrder.length - 1, currentSectionIndex + 1);
                if (nextIndex !== currentSectionIndex) {
                    animateSectionTransition(nextIndex, 'right');
                    currentSectionIndex = nextIndex;
                    updateNavigationActiveState(sectionOrder[nextIndex]);
                }
            }
        }
    }
    

    

    
    // Add touch event listeners
    const mainContent = document.querySelector('.dashboard-main');
    if (mainContent) {
        mainContent.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        });
        
        mainContent.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });
    }

    // Function to load characters from API
    async function loadCharactersFromAPI() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/personajes`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const personajes = await response.json();
            
            if (personajes && personajes.length > 0) {
                displayCharactersFromAPI(personajes);
                showMessage(`Cargados ${personajes.length} personajes de la API`, 'success');
            } else {
                showMessage('No se encontraron personajes en la API', 'info');
            }
            
        } catch (error) {
            console.error('Error loading characters:', error);
            showMessage('Error al cargar personajes. Verifica que la API esté corriendo.', 'error');
        }
    }

    // Global variable to store all characters
    let allCharacters = [];
    let filteredCharacters = [];

    // Function to display characters from API
    function displayCharactersFromAPI(personajes) {
        allCharacters = personajes;
        filteredCharacters = [...personajes];
        
        // Update character counter
        updateCharacterCounter();
        
        // Populate saga filter
        populateSagaFilter();
        
        // Display characters
        renderCharacterCards();
    }

    // Function to update character counter
    function updateCharacterCounter() {
        const counter = document.getElementById('totalCharacters');
        if (counter) {
            counter.textContent = filteredCharacters.length;
        }
    }

    // Function to populate saga filter
    function populateSagaFilter() {
        const sagaFilter = document.getElementById('sagaFilter');
        if (!sagaFilter) return;

        // Get unique sagas
        const sagas = [...new Set(allCharacters.map(char => char.Saga))].sort();
        
        // Clear existing options except the first one
        sagaFilter.innerHTML = '<option value="">Todas las sagas</option>';
        
        // Add saga options
        sagas.forEach(saga => {
            const option = document.createElement('option');
            option.value = saga;
            option.textContent = saga;
            sagaFilter.appendChild(option);
        });
    }

    // Function to render character cards
    function renderCharacterCards() {
        const deckGrid = document.querySelector('.deck-grid');
        
        if (!deckGrid) {
            console.error('Deck grid not found');
            return;
        }
        
        // Clear existing character cards
        deckGrid.innerHTML = '';
        
        // Create character cards for filtered characters
        filteredCharacters.forEach(personaje => {
            const characterCard = createCharacterCard(personaje);
            deckGrid.appendChild(characterCard);
        });
        
        // Update counter
        updateCharacterCounter();
    }

    // Function to apply filters
    function applyFilters() {
        const categoryFilter = document.getElementById('categoryFilter');
        const sagaFilter = document.getElementById('sagaFilter');
        
        if (!categoryFilter || !sagaFilter) return;
        
        const selectedCategory = categoryFilter.value;
        const selectedSaga = sagaFilter.value;
        
        // Filter characters
        filteredCharacters = allCharacters.filter(personaje => {
            const categoryMatch = !selectedCategory || personaje.Categoria === selectedCategory;
            const sagaMatch = !selectedSaga || personaje.Saga === selectedSaga;
            return categoryMatch && sagaMatch;
        });
        
        // Re-render cards
        renderCharacterCards();
        
        // Show filter message
        if (selectedCategory || selectedSaga) {
            const filters = [];
            if (selectedCategory) filters.push(selectedCategory);
            if (selectedSaga) filters.push(selectedSaga);
            showMessage(`Filtrado por: ${filters.join(', ')}`, 'info');
        }
    }

    // Function to clear filters
    function clearFilters() {
        const categoryFilter = document.getElementById('categoryFilter');
        const sagaFilter = document.getElementById('sagaFilter');
        
        if (categoryFilter) categoryFilter.value = '';
        if (sagaFilter) sagaFilter.value = '';
        
        filteredCharacters = [...allCharacters];
        renderCharacterCards();
        showMessage('Filtros limpiados', 'success');
    }

    // Function to create a character card from API data
    function createCharacterCard(personaje) {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.setAttribute('data-character-id', personaje.id);
        
        // Get character image path
        const imagePath = getCharacterImagePath(personaje.Nombre);
        
        // Calculate level based on stats (simple calculation)
        const level = Math.floor((personaje.Vida + personaje.Energia) / 20) + 1;
        const maxLevel = 10;
        const progress = Math.min(100, (level / maxLevel) * 100);
        
        card.innerHTML = `
            <div class="character-avatar">
                <img src="${imagePath}" alt="${personaje.Nombre}" class="character-image">
            </div>
            <h3>${personaje.Nombre}</h3>
            <div class="character-stats">
                <div class="stat-item-mini">
                    <span class="stat-label">HP</span>
                    <span class="stat-value">${personaje.Vida}</span>
                </div>
                <div class="stat-item-mini">
                    <span class="stat-label">EN</span>
                    <span class="stat-value">${personaje.Energia}</span>
                </div>
            </div>
        `;
        
        // Add click event to show character details
        card.addEventListener('click', function() {
            showCharacterDetails(personaje);
        });
        
        return card;
    }

    // Function to get character image path based on character name
    function getCharacterImagePath(nombre) {
        const imageMap = {
            'Spider-Man': 'Images/characters/Spiderman.jpg',
            'Iron Man': 'Images/characters/IronMan.jpg',
            'Flash': 'Images/characters/Flash.jpg',
            'Darth Vader': 'Images/characters/DarthVader.jpg',
            'Loki': 'Images/characters/Loki.jpg',
            'Venom': 'Images/characters/Venom.jpg',
            'Goku': 'Images/characters/Goku.jpg',
            'Capitán América': 'Images/characters/CaptainAmerica.jpg',
            'Cell': 'Images/characters/Cell.jpg',
            'Superman': 'Images/characters/Superman.jpg'
        };
        
        return imageMap[nombre] || 'Images/characters/default.jpg';
    }

    // Function to show character details
    function showCharacterDetails(personaje) {
        const detailsHTML = `
            <div class="character-details">
                <h2>${personaje.Nombre}</h2>
                <p><strong>Categoría:</strong> ${personaje.Categoria}</p>
                <p><strong>Saga:</strong> ${personaje.Saga}</p>
                <p><strong>Ciudad:</strong> ${personaje.Ciudad}</p>
                <p><strong>Vida:</strong> ${personaje.Vida}</p>
                <p><strong>Energía:</strong> ${personaje.Energia}</p>
                <p><strong>Combo:</strong> ${personaje.Combo}</p>
                <p><strong>Ultra:</strong> ${personaje.Ultra}</p>
                <p><strong>Estado:</strong> ${personaje.Estado}</p>
                <div class="combos">
                    <h3>Combos:</h3>
                    <p>• ${personaje.combo1Name}</p>
                    <p>• ${personaje.combo2Name}</p>
                    <p>• ${personaje.combo3Name}</p>
                    <p><strong>Ultra:</strong> ${personaje.ultraName}</p>
                </div>
            </div>
        `;
        
        // Create modal or show in a tooltip
        showModal(detailsHTML, `${personaje.Nombre} - Detalles`);
    }

    // Function to show modal
    function showModal(content, title) {
        // Remove existing modal
        const existingModal = document.querySelector('.character-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.className = 'character-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add close functionality
        const closeBtn = modal.querySelector('.modal-close');
        const overlay = modal.querySelector('.modal-overlay');
        
        closeBtn.addEventListener('click', () => modal.remove());
        overlay.addEventListener('click', () => modal.remove());
        
        // Close on escape key
        document.addEventListener('keydown', function closeOnEscape(e) {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', closeOnEscape);
            }
        });
    }

    // Function to initialize filters
    function initializeFilters() {
        const categoryFilter = document.getElementById('categoryFilter');
        const sagaFilter = document.getElementById('sagaFilter');
        const clearFiltersBtn = document.getElementById('clearFilters');
        
        // Add event listeners for filters
        if (categoryFilter) {
            categoryFilter.addEventListener('change', applyFilters);
        }
        
        if (sagaFilter) {
            sagaFilter.addEventListener('change', applyFilters);
        }
        
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', clearFilters);
        }
    }

    // Function to load and display user data from localStorage
    function loadUserData() {
        try {
            // Get user data from localStorage
            const userData = localStorage.getItem('user');
            
            if (userData) {
                const user = JSON.parse(userData);
                
                // Update profile information
                const userNameElement = document.getElementById('userName');
                const userEmailElement = document.getElementById('userEmail');
                
                if (userNameElement && user.nombre) {
                    userNameElement.textContent = user.nombre;
                }
                
                if (userEmailElement && user.correo) {
                    userEmailElement.textContent = user.correo;
                }
                
                console.log('User data loaded successfully:', user);
            } else {
                console.warn('No user data found in localStorage');
                showMessage('No se encontraron datos de usuario. Por favor, inicia sesión nuevamente.', 'error');
                
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 3000);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            showMessage('Error al cargar datos del usuario', 'error');
        }
    }

    // Function to load user partidas from API
    async function loadUserPartidas() {
        const partidasContainer = document.getElementById('partidasContainer');
        if (!partidasContainer) return;

        try {
            // Show loading state
            partidasContainer.innerHTML = `
                <div class="loading-partidas">
                    <i class="ph-circle-notch ph-spin"></i>
                    <span>Cargando partidas...</span>
                </div>
            `;

            // Get token from localStorage
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No se encontró token de autenticación');
            }

            // Fetch both 1v1 and 3v3 battles
            const [batallas1v1, batallas3v3] = await Promise.all([
                fetch(`${API_BASE_URL}/api/batallas`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }),
                fetch(`${API_BASE_URL}/api/batallas3v3`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })
            ]);

            if (!batallas1v1.ok || !batallas3v3.ok) {
                throw new Error('Error al obtener las partidas');
            }

            const [batallas1v1Data, batallas3v3Data] = await Promise.all([
                batallas1v1.json(),
                batallas3v3.json()
            ]);

            // Debug: Log para ver qué devuelve la API
            console.log('Datos de batallas 1v1 de la API:', batallas1v1Data);
            console.log('Datos de batallas 3v3 de la API:', batallas3v3Data);

            // Combine and sort all battles by creation date (newest first)
            const allPartidas = [
                ...batallas1v1Data.map(b => ({ ...b, type: '1v1' })),
                ...batallas3v3Data.map(b => ({ ...b, type: '3v3' }))
            ].sort((a, b) => new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id));

            console.log('Todas las partidas combinadas:', allPartidas);

            displayPartidas(allPartidas);

        } catch (error) {
            console.error('Error loading partidas:', error);
            partidasContainer.innerHTML = `
                <div class="no-partidas">
                    <i class="ph-warning"></i>
                    <h4>Error al cargar partidas</h4>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }

    // Function to display partidas
    function displayPartidas(partidas) {
        const partidasContainer = document.getElementById('partidasContainer');
        if (!partidasContainer) return;

        if (!partidas || partidas.length === 0) {
            partidasContainer.innerHTML = `
                <div class="no-partidas">
                    <i class="ph-game-controller"></i>
                    <h4>No tienes partidas</h4>
                    <p>¡Crea tu primera partida para comenzar a jugar!</p>
                </div>
            `;
            return;
        }

        // Debug: Log para ver qué datos están llegando
        console.log('Partidas recibidas en displayPartidas:', partidas);
        partidas.forEach((partida, index) => {
            console.log(`Partida ${index + 1}:`, {
                id: partida.id || partida._id,
                type: partida.type,
                personaje1: partida.personaje1,
                personaje2: partida.personaje2,
                equipo1: partida.equipo1,
                equipo2: partida.equipo2,
                estado: partida.estado,
                createdAt: partida.createdAt
            });
        });

        // Store partidas globally for filtering
        window.allPartidas = partidas;

        const partidasHTML = partidas.map(partida => createPartidaItem(partida)).join('');
        partidasContainer.innerHTML = `
            <div class="partidas-filters">
                <button class="filter-btn active" data-filter="all">
                    <i class="ph-list"></i>
                    Todas
                </button>
                <button class="filter-btn" data-filter="1v1">
                    <i class="ph-sword"></i>
                    1v1
                </button>
                <button class="filter-btn" data-filter="3v3">
                    <i class="ph-users"></i>
                    En Equipos
                </button>
                <button class="filter-btn" data-filter="en-curso">
                    <i class="ph-play-circle"></i>
                    En Curso
                </button>
                <button class="filter-btn" data-filter="terminadas">
                    <i class="ph-check-circle"></i>
                    Terminadas
                </button>
            </div>
            <div class="partidas-list">
                ${partidasHTML}
            </div>
        `;

        // Add event listeners for delete buttons and click events
        addDeletePartidaListeners();
        addPartidaClickListeners();
        addFilterListeners();
    }

    // Function to create partida item HTML
    function createPartidaItem(partida) {
        const is1v1 = partida.type === '1v1';
        const typeIcon = is1v1 ? 'ph-sword' : 'ph-users';
        const typeText = is1v1 ? '1v1' : 'En Equipo';
        
        let characters = '';
        if (is1v1) {
            // Usar nombre de personaje1 o estadoPersonaje1
            const nombre1 = partida.personaje1?.nombre || partida.estadoPersonaje1?.Nombre || 'Personaje no encontrado';
            const nombre2 = partida.personaje2?.nombre || partida.estadoPersonaje2?.Nombre || 'Personaje no encontrado';
            characters = `<strong>${nombre1}</strong> vs <strong>${nombre2}</strong>`;
        } else {
            // Para batallas 3v3, los datos vienen como array de objetos con nombre
            const equipo1 = partida.equipo1?.map(p => p.nombre).join(', ') || 'N/A';
            const equipo2 = partida.equipo2?.map(p => p.nombre).join(', ') || 'N/A';
            
            characters = `<strong>Equipo 1:</strong> ${equipo1} | <strong>Equipo 2:</strong> ${equipo2}`;
        }

        const statusClass = getStatusClass(partida.estado);
        const statusText = getStatusText(partida.estado);
        
        // Manejar fechas correctamente
        let createdAt = 'Fecha no disponible';
        try {
            if (partida.createdAt) {
                createdAt = new Date(partida.createdAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } else if (partida._id) {
                // Usar el timestamp del ObjectId como fallback
                const timestamp = new Date(parseInt(partida._id.toString().substring(0, 8), 16) * 1000);
                createdAt = timestamp.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } else if (partida.id) {
                // Usar el timestamp del ObjectId como fallback (cuando viene como 'id')
                const timestamp = new Date(parseInt(partida.id.toString().substring(0, 8), 16) * 1000);
                createdAt = timestamp.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
        } catch (error) {
            console.error('Error parsing date:', error);
        }

        return `
            <div class="partida-item clickable" data-partida-id="${partida.id || partida._id}" data-partida-type="${partida.type}">
                <div class="partida-header">
                    <div class="partida-type">
                        <i class="${typeIcon}"></i>
                        <span>${typeText}</span>
                    </div>
                    <span class="partida-status ${statusClass}">${statusText}</span>
                </div>
                <div class="partida-content">
                    <div class="partida-info">
                        <div class="partida-characters">
                            ${characters}
                        </div>
                        <div class="partida-details">
                            <span>Creada: ${createdAt}</span>
                            ${partida.ganador ? `<span>Ganador: ${partida.ganador}</span>` : ''}
                        </div>
                    </div>
                    <div class="partida-actions">
                        <button class="delete-partida-btn" data-partida-id="${partida.id || partida._id}" data-partida-type="${partida.type}">
                            <i class="ph-trash"></i>
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Function to get status class
    function getStatusClass(estado) {
        switch (estado?.toLowerCase()) {
            case 'en curso':
            case 'activa':
                return 'en-curso';
            case 'finalizada':
            case 'completada':
                return 'finalizada';
            case 'cancelada':
            case 'abandonada':
                return 'cancelada';
            default:
                return 'en-curso';
        }
    }

    // Function to get status text
    function getStatusText(estado) {
        switch (estado?.toLowerCase()) {
            case 'en curso':
            case 'activa':
                return 'En Curso';
            case 'finalizada':
            case 'completada':
                return 'Finalizada';
            case 'cancelada':
            case 'abandonada':
                return 'Cancelada';
            default:
                return 'En Curso';
        }
    }

    // Function to add delete partida listeners
    function addDeletePartidaListeners() {
        const deleteButtons = document.querySelectorAll('.delete-partida-btn');
        
        deleteButtons.forEach(button => {
            button.addEventListener('click', async function(e) {
                e.preventDefault();
                e.stopPropagation(); // Prevent triggering partida click
                
                const partidaId = this.getAttribute('data-partida-id');
                const partidaType = this.getAttribute('data-partida-type');
                
                if (confirm('¿Estás seguro de que quieres eliminar esta partida? Esta acción no se puede deshacer.')) {
                    await deletePartida(partidaId, partidaType);
                }
            });
        });
    }

    // Function to add partida click listeners
    function addPartidaClickListeners() {
        const partidaItems = document.querySelectorAll('.partida-item.clickable');
        
        partidaItems.forEach(item => {
            item.addEventListener('click', function(e) {
                // Don't trigger if clicking on delete button
                if (e.target.closest('.delete-partida-btn')) {
                    return;
                }
                
                const partidaId = this.getAttribute('data-partida-id');
                const partidaType = this.getAttribute('data-partida-type');
                
                console.log('🖱️ Click en partida:', { partidaId, partidaType });
                
                showPartidaDetails(partidaId, partidaType);
            });
        });
    }

    // Function to add filter listeners
    function addFilterListeners() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                const filter = this.getAttribute('data-filter');
                
                // Update active filter button
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Apply filter
                applyPartidaFilter(filter);
            });
        });
    }

    // Function to apply partida filter
    function applyPartidaFilter(filter) {
        const partidaItems = document.querySelectorAll('.partida-item');
        
        partidaItems.forEach(item => {
            const partidaType = item.getAttribute('data-partida-type');
            const statusElement = item.querySelector('.partida-status');
            const status = statusElement ? statusElement.textContent.toLowerCase() : '';
            
            let shouldShow = true;
            
            switch (filter) {
                case '1v1':
                    shouldShow = partidaType === '1v1';
                    break;
                case '3v3':
                    shouldShow = partidaType === '3v3';
                    break;
                case 'en-curso':
                    shouldShow = status.includes('en curso') || status.includes('activa');
                    break;
                case 'terminadas':
                    shouldShow = status.includes('finalizada') || status.includes('completada');
                    break;
                case 'all':
                default:
                    shouldShow = true;
                    break;
            }
            
            item.style.display = shouldShow ? 'block' : 'none';
        });
    }

    // Function to show partida details
    async function showPartidaDetails(partidaId, partidaType) {
        try {
            console.log('🔍 Iniciando showPartidaDetails:', { partidaId, partidaType });
            
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No se encontró token de autenticación');
            }
            console.log('✅ Token encontrado');

            const endpoint = partidaType === '1v1' ? 'batallas' : 'batallas3v3';
            const url = `${API_BASE_URL}/api/${endpoint}/${partidaId}`;
            console.log('🌐 URL de la petición:', url);
            console.log('🔑 Headers:', {
                'Authorization': `Bearer ${token.substring(0, 20)}...`,
                'Content-Type': 'application/json'
            });

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📡 Respuesta del servidor:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error response body:', errorText);
                throw new Error(`Error al obtener detalles de la partida (${response.status}): ${errorText}`);
            }

            const partida = await response.json();
            console.log('📦 Datos de la partida recibidos:', partida);
            
            showPartidaModal(partida, partidaType);

        } catch (error) {
            console.error('💥 Error completo en showPartidaDetails:', error);
            showMessage(`Error al cargar detalles: ${error.message}`, 'error');
        }
    }

    // Function to show partida modal
    function showPartidaModal(partida, partidaType) {
        const is1v1 = partidaType === '1v1';
        const typeText = is1v1 ? '1v1' : 'En Equipo';
        
        let charactersInfo = '';
        if (is1v1) {
            // Usar nombre de personaje1 o estadoPersonaje1
            const nombre1 = partida.personaje1?.nombre || partida.estadoPersonaje1?.Nombre || 'Personaje no encontrado';
            const nombre2 = partida.personaje2?.nombre || partida.estadoPersonaje2?.Nombre || 'Personaje no encontrado';
            const hp1 = partida.estadoPersonaje1?.HP || 'N/A';
            const hp2 = partida.estadoPersonaje2?.HP || 'N/A';
            const energia1 = partida.estadoPersonaje1?.Energia || 'N/A';
            const energia2 = partida.estadoPersonaje2?.Energia || 'N/A';
            
            charactersInfo = `
                <div class="partida-detail-characters">
                    <div class="character-vs">
                        <div class="character-info">
                            <h4>${nombre1}</h4>
                            <p>HP: ${hp1}</p>
                            <p>Energía: ${energia1}</p>
                        </div>
                        <div class="vs-separator">VS</div>
                        <div class="character-info">
                            <h4>${nombre2}</h4>
                            <p>HP: ${hp2}</p>
                            <p>Energía: ${energia2}</p>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Para batallas 3v3, los datos vienen como array de objetos con {id, nombre}
            console.log('📋 Datos de partida recibidos en modal:', partida);
            console.log('👥 Equipo1 recibido:', partida.equipo1);
            console.log('👥 Equipo2 recibido:', partida.equipo2);
            
            // Procesar los nombres de personajes correctamente
            const equipo1Personajes = partida.equipo1?.map(p => {
                console.log('👤 Personaje equipo1:', p);
                // La API devuelve objetos con {id, nombre}
                return p?.nombre || 'Personaje no encontrado';
            }) || [];
            
            const equipo2Personajes = partida.equipo2?.map(p => {
                console.log('👤 Personaje equipo2:', p);
                // La API devuelve objetos con {id, nombre}
                return p?.nombre || 'Personaje no encontrado';
            }) || [];
            
            console.log('📝 Equipo1 nombres procesados:', equipo1Personajes);
            console.log('📝 Equipo2 nombres procesados:', equipo2Personajes);
            console.log('📝 Equipo2 nombres procesados:', equipo2Personajes);
            charactersInfo = `
                <div class="partida-detail-characters">
                    <div class="team-info">
                        <h4 class="team-title">⚔️ Equipo 1</h4>
                        <div class="team-members">
                            ${equipo1Personajes.map((personaje, index) => `
                                <div class="team-member">
                                    <span class="member-number">${index + 1}</span>
                                    <span class="member-name">${personaje}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="vs-separator">
                        <div class="vs-circle">VS</div>
                    </div>
                    <div class="team-info">
                        <h4 class="team-title">⚔️ Equipo 2</h4>
                        <div class="team-members">
                            ${equipo2Personajes.map((personaje, index) => `
                                <div class="team-member">
                                    <span class="member-number">${index + 1}</span>
                                    <span class="member-name">${personaje}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }

        const statusClass = getStatusClass(partida.estado);
        const statusText = getStatusText(partida.estado);
        
        // Manejar fechas correctamente
        let createdAt = 'Fecha no disponible';
        try {
            if (partida.createdAt) {
                createdAt = new Date(partida.createdAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } else if (partida._id) {
                // Usar el timestamp del ObjectId como fallback
                const timestamp = new Date(parseInt(partida._id.toString().substring(0, 8), 16) * 1000);
                createdAt = timestamp.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } else if (partida.id) {
                // Usar el timestamp del ObjectId como fallback (cuando viene como 'id')
                const timestamp = new Date(parseInt(partida.id.toString().substring(0, 8), 16) * 1000);
                createdAt = timestamp.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
        } catch (error) {
            console.error('Error parsing date:', error);
        }

        const content = `
            <div class="partida-detail-content">
                <div class="partida-detail-header">
                    <div class="partida-detail-type">
                        <i class="${is1v1 ? 'ph-sword' : 'ph-users'}"></i>
                        <span>${typeText}</span>
                    </div>
                    <span class="partida-status ${statusClass}">${statusText}</span>
                </div>
                
                ${charactersInfo}
                
                <div class="partida-detail-info">
                    <div class="info-item">
                        <strong>Creada:</strong> ${createdAt}
                    </div>
                    <div class="info-item">
                        <strong>Turno actual:</strong> ${partida.turnoActual || 'N/A'}
                    </div>
                    ${partida.ganador ? `
                        <div class="info-item">
                            <strong>Ganador:</strong> ${partida.ganador}
                        </div>
                    ` : ''}
                    ${partida.historial && partida.historial.length > 0 ? `
                        <div class="info-item">
                            <strong>Acciones realizadas:</strong> ${partida.historial.length}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        showModal(content, `Detalles de Partida - ${typeText}`);
    }

    // Function to delete partida
    async function deletePartida(partidaId, partidaType) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No se encontró token de autenticación');
            }

            const endpoint = partidaType === '1v1' ? 'batallas' : 'batallas3v3';
            const response = await fetch(`${API_BASE_URL}/api/${endpoint}/${partidaId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al eliminar la partida');
            }

            showMessage('Partida eliminada exitosamente', 'success');
            
            // Reload partidas
            await loadUserPartidas();

        } catch (error) {
            console.error('Error deleting partida:', error);
            showMessage(`Error al eliminar la partida: ${error.message}`, 'error');
        }
    }


});