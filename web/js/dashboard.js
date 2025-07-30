// Dashboard Navigation and Interactions
document.addEventListener('DOMContentLoaded', function() {
    
    // Verificar autenticación
    if (!apiService || !apiService.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Cargar datos del usuario
    loadUserData();
    
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
    
    // Deck selection functionality
    const deckBtns = document.querySelectorAll('.deck-btn');
    deckBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all deck buttons
            deckBtns.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            const deckNumber = this.getAttribute('data-deck');
            showMessage(`Deck ${deckNumber} seleccionado`, 'success');
        });
    });
    
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
            modeDisplay.innerHTML = '<img src="../Images/runa.png" alt="Runa" class="mode-rune-icon"><span>1v1</span>';
            
            // Update setup content for 1v1 mode
            updateSetupContentFor1v1();
        } else if (mode === 'team') {
            setupTitle.textContent = 'Configuración En Equipo';
            modeDisplay.innerHTML = '<img src="../Images/runa.png" alt="Runa" class="mode-rune-icon"><span>En Equipo</span>';
            
            // Update setup content for team mode
            updateSetupContentForTeam();
        }
        
        // Change arena image to runa when configuring
        const arenaImage = document.getElementById('arenaImage');
        if (arenaImage) {
            arenaImage.src = '../Images/runa.png';
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
        
        // Add character ID inputs section
        const characterSection = document.createElement('div');
        characterSection.className = 'setup-section';
        characterSection.innerHTML = `
            <label for="character1Id">ID del Personaje 1:</label>
            <input type="text" id="character1Id" placeholder="Ingresa el ID del primer personaje" maxlength="10">
            <div class="character-preview" id="character1Preview">
                <i class="ph-question"></i>
                <span>Personaje no seleccionado</span>
            </div>
        `;
        setupContent.appendChild(characterSection);
        
        const character2Section = document.createElement('div');
        character2Section.className = 'setup-section';
        character2Section.innerHTML = `
            <label for="character2Id">ID del Personaje 2:</label>
            <input type="text" id="character2Id" placeholder="Ingresa el ID del segundo personaje" maxlength="10">
            <div class="character-preview" id="character2Preview">
                <i class="ph-question"></i>
                <span>Personaje no seleccionado</span>
            </div>
        `;
        setupContent.appendChild(character2Section);
        
        // Add event listeners for character ID inputs
        addCharacterIdEventListeners();
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
                    <input type="text" id="team1Char1" placeholder="ID del personaje" maxlength="10">
                    <div class="character-preview" id="team1Char1Preview">
                        <i class="ph-question"></i>
                        <span>No seleccionado</span>
                    </div>
                </div>
                <div class="character-input-group">
                    <label for="team1Char2">Personaje 2:</label>
                    <input type="text" id="team1Char2" placeholder="ID del personaje" maxlength="10">
                    <div class="character-preview" id="team1Char2Preview">
                        <i class="ph-question"></i>
                        <span>No seleccionado</span>
                    </div>
                </div>
                <div class="character-input-group">
                    <label for="team1Char3">Personaje 3:</label>
                    <input type="text" id="team1Char3" placeholder="ID del personaje" maxlength="10">
                    <div class="character-preview" id="team1Char3Preview">
                        <i class="ph-question"></i>
                        <span>No seleccionado</span>
                    </div>
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
                    <input type="text" id="team2Char1" placeholder="ID del personaje" maxlength="10">
                    <div class="character-preview" id="team2Char1Preview">
                        <i class="ph-question"></i>
                        <span>No seleccionado</span>
                    </div>
                </div>
                <div class="character-input-group">
                    <label for="team2Char2">Personaje 2:</label>
                    <input type="text" id="team2Char2" placeholder="ID del personaje" maxlength="10">
                    <div class="character-preview" id="team2Char2Preview">
                        <i class="ph-question"></i>
                        <span>No seleccionado</span>
                    </div>
                </div>
                <div class="character-input-group">
                    <label for="team2Char3">Personaje 3:</label>
                    <input type="text" id="team2Char3" placeholder="ID del personaje" maxlength="10">
                    <div class="character-preview" id="team2Char3Preview">
                        <i class="ph-question"></i>
                        <span>No seleccionado</span>
                    </div>
                </div>
            </div>
        `;
        setupContent.appendChild(team2Section);
        
        // Add event listeners for team character ID inputs
        addTeamCharacterIdEventListeners();
    }
    
    function addCharacterIdEventListeners() {
        const character1Input = document.getElementById('character1Id');
        const character2Input = document.getElementById('character2Id');
        const character1Preview = document.getElementById('character1Preview');
        const character2Preview = document.getElementById('character2Preview');
        
        if (character1Input) {
            character1Input.addEventListener('input', function() {
                const characterId = this.value.trim();
                if (characterId) {
                    // Simulate character lookup
                    character1Preview.innerHTML = `
                        <i class="ph-sword"></i>
                        <span>Personaje ID: ${characterId}</span>
                    `;
                    character1Preview.classList.add('character-found');
                } else {
                    character1Preview.innerHTML = `
                        <i class="ph-question"></i>
                        <span>Personaje no seleccionado</span>
                    `;
                    character1Preview.classList.remove('character-found');
                }
            });
        }
        
        if (character2Input) {
            character2Input.addEventListener('input', function() {
                const characterId = this.value.trim();
                if (characterId) {
                    // Simulate character lookup
                    character2Preview.innerHTML = `
                        <i class="ph-sword"></i>
                        <span>Personaje ID: ${characterId}</span>
                    `;
                    character2Preview.classList.add('character-found');
                } else {
                    character2Preview.innerHTML = `
                        <i class="ph-question"></i>
                        <span>Personaje no seleccionado</span>
                    `;
                    character2Preview.classList.remove('character-found');
                }
            });
        }
    }
    
    function addTeamCharacterIdEventListeners() {
        const team1Inputs = ['team1Char1', 'team1Char2', 'team1Char3'];
        const team2Inputs = ['team2Char1', 'team2Char2', 'team2Char3'];
        
        // Add listeners for team 1
        team1Inputs.forEach((inputId, index) => {
            const input = document.getElementById(inputId);
            const preview = document.getElementById(inputId + 'Preview');
            
            if (input && preview) {
                input.addEventListener('input', function() {
                    const characterId = this.value.trim();
                    if (characterId) {
                        preview.innerHTML = `
                            <i class="ph-sword"></i>
                            <span>Personaje ID: ${characterId}</span>
                        `;
                        preview.classList.add('character-found');
                    } else {
                        preview.innerHTML = `
                            <i class="ph-question"></i>
                            <span>No seleccionado</span>
                        `;
                        preview.classList.remove('character-found');
                    }
                });
            }
        });
        
        // Add listeners for team 2
        team2Inputs.forEach((inputId, index) => {
            const input = document.getElementById(inputId);
            const preview = document.getElementById(inputId + 'Preview');
            
            if (input && preview) {
                input.addEventListener('input', function() {
                    const characterId = this.value.trim();
                    if (characterId) {
                        preview.innerHTML = `
                            <i class="ph-sword"></i>
                            <span>Personaje ID: ${characterId}</span>
                        `;
                        preview.classList.add('character-found');
                    } else {
                        preview.innerHTML = `
                            <i class="ph-question"></i>
                            <span>No seleccionado</span>
                        `;
                        preview.classList.remove('character-found');
                    }
                });
            }
        });
    }
    
    function hideGameSetupPanel() {
        gameSetupPanel.classList.remove('show');
        // Reset button text
        const buttonText = newGameBtn.querySelector('span');
        buttonText.textContent = 'Nueva Partida';
        
        // Change arena image back to coliseum
        const arenaImage = document.getElementById('arenaImage');
        if (arenaImage) {
            arenaImage.src = '../Images/campus.png';
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
        startGameBtn.addEventListener('click', function() {
            // Hide setup panel immediately
            hideGameSetupPanel();
            
            // Show success message
            showMessage('¡Partida iniciada!', 'success');
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

    // ===== FUNCIONES DE API =====
    
    // Cargar datos del usuario
    async function loadUserData() {
        try {
            const userSession = localStorage.getItem('userSession');
            if (userSession) {
                const user = JSON.parse(userSession);
                updateUserProfile(user);
            }
            
            // Cargar personajes
            await loadPersonajes();
            
            // Cargar batallas
            await loadBatallas();
            
        } catch (error) {
            console.error('Error cargando datos del usuario:', error);
            showMessage('Error al cargar datos del usuario', 'error');
        }
    }
    
    // Actualizar perfil del usuario
    function updateUserProfile(user) {
        const userNameElement = document.querySelector('.user-name');
        const userEmailElement = document.querySelector('.user-email');
        
        if (userNameElement) {
            userNameElement.textContent = user.nombre || 'Usuario';
        }
        
        if (userEmailElement) {
            userEmailElement.textContent = user.correo || 'usuario@email.com';
        }
    }
    
    // Cargar personajes desde la API
    async function loadPersonajes() {
        try {
            const personajes = await apiService.getPersonajes();
            displayPersonajes(personajes);
        } catch (error) {
            console.error('Error cargando personajes:', error);
            showMessage('Error al cargar personajes', 'error');
        }
    }
    
    // Mostrar personajes en la interfaz
    function displayPersonajes(personajes) {
        const charactersContainer = document.querySelector('.characters-grid');
        if (!charactersContainer) return;
        
        charactersContainer.innerHTML = '';
        
        personajes.forEach(personaje => {
            const characterCard = createCharacterCard(personaje);
            charactersContainer.appendChild(characterCard);
        });
    }
    
    // Crear tarjeta de personaje
    function createCharacterCard(personaje) {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.innerHTML = `
            <div class="character-image">
                <img src="../Images/knight.png" alt="${personaje.Nombre}">
            </div>
            <div class="character-info">
                <h3>${personaje.Nombre}</h3>
                <p class="character-category">${personaje.Categoria}</p>
                <p class="character-saga">${personaje.Saga}</p>
                <div class="character-stats">
                    <span class="stat">HP: ${personaje.Vida}</span>
                    <span class="stat">Energía: ${personaje.Energia}</span>
                </div>
                <div class="character-actions">
                    <button class="action-btn select-btn" data-id="${personaje.id}">Seleccionar</button>
                    <button class="action-btn edit-btn" data-id="${personaje.id}">Editar</button>
                </div>
            </div>
        `;
        
        // Agregar event listeners
        const selectBtn = card.querySelector('.select-btn');
        const editBtn = card.querySelector('.edit-btn');
        
        selectBtn.addEventListener('click', () => selectCharacter(personaje.id));
        editBtn.addEventListener('click', () => editCharacter(personaje.id));
        
        return card;
    }
    
    // Seleccionar personaje
    function selectCharacter(characterId) {
        showMessage(`Personaje ${characterId} seleccionado`, 'success');
        // Aquí puedes implementar la lógica para seleccionar personajes para batallas
    }
    
    // Editar personaje
    function editCharacter(characterId) {
        showMessage(`Editando personaje ${characterId}`, 'info');
        // Aquí puedes implementar la lógica para editar personajes
    }
    
    // Cargar batallas desde la API
    async function loadBatallas() {
        try {
            const batallas = await apiService.getBatallas();
            displayBatallas(batallas);
        } catch (error) {
            console.error('Error cargando batallas:', error);
            showMessage('Error al cargar batallas', 'error');
        }
    }
    
    // Mostrar batallas en la interfaz
    function displayBatallas(batallas) {
        const battlesContainer = document.querySelector('.battles-list');
        if (!battlesContainer) return;
        
        battlesContainer.innerHTML = '';
        
        if (batallas.length === 0) {
            battlesContainer.innerHTML = '<p class="no-battles">No hay batallas registradas</p>';
            return;
        }
        
        batallas.forEach(batalla => {
            const battleItem = createBattleItem(batalla);
            battlesContainer.appendChild(battleItem);
        });
    }
    
    // Crear elemento de batalla
    function createBattleItem(batalla) {
        const item = document.createElement('div');
        item.className = 'battle-item';
        item.innerHTML = `
            <div class="battle-info">
                <h4>${batalla.Personaje1?.nombre || 'Personaje 1'} vs ${batalla.Personaje2?.nombre || 'Personaje 2'}</h4>
                <p class="battle-status">Estado: ${batalla.Estado}</p>
                <p class="battle-turn">Turno: ${batalla.TurnoActual}</p>
            </div>
            <div class="battle-actions">
                <button class="action-btn continue-btn" data-id="${batalla.id}">Continuar</button>
                <button class="action-btn delete-btn" data-id="${batalla.id}">Eliminar</button>
            </div>
        `;
        
        // Agregar event listeners
        const continueBtn = item.querySelector('.continue-btn');
        const deleteBtn = item.querySelector('.delete-btn');
        
        continueBtn.addEventListener('click', () => continueBattle(batalla.id));
        deleteBtn.addEventListener('click', () => deleteBattle(batalla.id));
        
        return item;
    }
    
    // Continuar batalla
    async function continueBattle(battleId) {
        try {
            const batalla = await apiService.getBatallaById(battleId);
            showBattleInterface(batalla);
        } catch (error) {
            console.error('Error cargando batalla:', error);
            showMessage('Error al cargar la batalla', 'error');
        }
    }
    
    // Eliminar batalla
    async function deleteBattle(battleId) {
        if (confirm('¿Estás seguro de que quieres eliminar esta batalla?')) {
            try {
                await apiService.eliminarBatalla(battleId);
                showMessage('Batalla eliminada', 'success');
                loadBatallas(); // Recargar lista
            } catch (error) {
                console.error('Error eliminando batalla:', error);
                showMessage('Error al eliminar la batalla', 'error');
            }
        }
    }
    
    // Mostrar interfaz de batalla
    function showBattleInterface(batalla) {
        // Aquí puedes implementar la interfaz de batalla
        showMessage(`Iniciando batalla: ${batalla.Personaje1?.nombre} vs ${batalla.Personaje2?.nombre}`, 'info');
    }
    
    // Crear nueva batalla
    async function createNewBattle(personaje1Id, personaje2Id) {
        try {
            const nuevaBatalla = await apiService.crearBatalla(personaje1Id, personaje2Id);
            showMessage('¡Nueva batalla creada!', 'success');
            loadBatallas(); // Recargar lista
            return nuevaBatalla;
        } catch (error) {
            console.error('Error creando batalla:', error);
            showMessage(error.message || 'Error al crear la batalla', 'error');
            throw error;
        }
    }
    
    // Ejecutar acción en batalla
    async function executeBattleAction(batallaId, personajeId, accion) {
        try {
            const resultado = await apiService.ejecutarAccion(batallaId, personajeId, accion);
            showMessage(resultado.mensaje, 'success');
            return resultado;
        } catch (error) {
            console.error('Error ejecutando acción:', error);
            showMessage(error.message || 'Error al ejecutar la acción', 'error');
            throw error;
        }
    }
    
    // Actualizar logout para usar la API
    const logoutBtn = document.querySelector('[data-section="logout"]');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                showMessage('Cerrando sesión...', 'info');
                
                setTimeout(() => {
                    if (apiService) {
                        apiService.logout();
                    }
                    window.location.href = '../index.html';
                }, 1500);
            }
        });
    }
    
    // Botón de actualizar batallas
    const refreshBattlesBtn = document.querySelector('.refresh-battles-btn');
    if (refreshBattlesBtn) {
        refreshBattlesBtn.addEventListener('click', async function() {
            try {
                setLoadingState(this, true);
                this.innerHTML = '<i class="ph-spinner"></i> <span>Actualizando...</span>';
                
                await loadBatallas();
                showMessage('Batallas actualizadas', 'success');
                
            } catch (error) {
                console.error('Error actualizando batallas:', error);
                showMessage('Error al actualizar batallas', 'error');
            } finally {
                setLoadingState(this, false);
                this.innerHTML = '<i class="ph-arrows-clockwise"></i> <span>Actualizar</span>';
            }
        });
    }

}); 