/**
 * The Arcade Madness - Enhanced Menu System
 * Retro 8-bit style game selection
 */

document.addEventListener('DOMContentLoaded', () => {
    const gameSelection = document.getElementById('game-selection');
    
    const games = [
        {
            name: 'TETRIS',
            description: 'STACK FALLING BLOCKS AND CLEAR LINES',
            url: 'js/games/tetris/tetris.html',
            icon: '🎮',
            status: 'Available'
        },
        {
            name: 'SNAKE',
            description: 'EAT FOOD AND GROW WITHOUT HITTING WALLS',
            url: 'js/games/snake/snake.html',
            icon: '🐍',
            status: 'Available'
        },
        {
            name: 'SOKOBAN',
            description: 'PUSH BOXES TO THEIR GOAL POSITIONS',
            url: 'js/games/sokoban/sokoban.html',
            icon: '📦',
            status: 'coming-soon'
        },
        {
            name: 'PAC-MAN',
            description: 'EAT PELLETS AND AVOID THE GHOSTS',
            url: 'js/games/pacman/pacman.html',
            icon: '👻',
            status: 'coming-soon'
        },
        {
            name: 'Demo Engine',
            description: 'TEST NEW GAME MECHANICS AND FEATURES',
            url: 'js/games/demo/demo.html',
            icon: '🛠️',
            status: 'Available'
        }
    ];

    // Create game cards
    games.forEach((game, index) => {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.setAttribute('data-game', game.name.toLowerCase());
        
        // Add status badge if coming soon
        let statusBadge = '';
        if (game.status === 'coming-soon') {
            statusBadge = '<span class="status-badge">COMING SOON</span>';
        }
        
        card.innerHTML = `
            ${statusBadge}
            <div class="game-icon">${game.icon}</div>
            <h2>${game.name}</h2>
            <p>${game.description}</p>
            <button class="pixel-btn">
                <span class="btn-icon">▶</span> PLAY NOW
            </button>
        `;
        
        // Add click handler
        const button = card.querySelector('.pixel-btn');
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            handleGameClick(game);
        });
        
        card.addEventListener('click', () => {
            handleGameClick(game);
        });
        
        // Add entrance animation with stagger
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100 * index);
        
        gameSelection.appendChild(card);
    });
    
    function handleGameClick(game) {
        if (game.status === 'coming-soon') {
            showComingSoonMessage(game.name);
        } else {
            // Add loading effect
            const card = document.querySelector(`[data-game="${game.name.toLowerCase()}"]`);
            card.style.transform = 'scale(0.95)';
            
            setTimeout(() => {
                window.location.href = game.url;
            }, 200);
        }
    }
    
    function showComingSoonMessage(gameName) {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            animation: fadeIn 0.3s ease;
        `;
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: #1a1a1a;
            border: 4px solid #FF10F0;
            padding: 3rem 4rem;
            text-align: center;
            box-shadow: 0 0 40px rgba(255, 16, 240, 0.6);
            animation: scaleIn 0.3s ease;
        `;
        
        modal.innerHTML = `
            <h2 style="
                font-family: 'Press Start 2P', cursive;
                font-size: 1.5rem;
                color: #FF10F0;
                text-shadow: 0 0 10px #FF10F0;
                margin-bottom: 1.5rem;
            ">${gameName}</h2>
            <p style="
                font-family: 'Press Start 2P', cursive;
                font-size: 0.8rem;
                color: #00F0FF;
                margin-bottom: 2rem;
                line-height: 2;
            ">UNDER DEVELOPMENT<br>CHECK BACK SOON!</p>
            <button class="pixel-btn" style="
                background: #FF10F0;
                color: #000;
            ">
                <span class="btn-icon">✖</span> CLOSE
            </button>
        `;
        
        // Add animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes scaleIn {
                from { transform: scale(0.8); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Close handlers
        const closeBtn = modal.querySelector('.pixel-btn');
        closeBtn.addEventListener('click', () => {
            overlay.style.animation = 'fadeIn 0.3s ease reverse';
            setTimeout(() => overlay.remove(), 300);
        });
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.style.animation = 'fadeIn 0.3s ease reverse';
                setTimeout(() => overlay.remove(), 300);
            }
        });
        
        // Play beep sound (optional - can add later)
        playSound('beep');
    }
    
    function playSound(soundName) {
        // Placeholder for sound effects
        // Will be implemented when audio files are added
        console.log(`Playing sound: ${soundName}`);
    }
    
    // Add keyboard navigation (arrow keys)
    let selectedIndex = 0;
    const cards = document.querySelectorAll('.game-card');
    
    document.addEventListener('keydown', (e) => {
        if (cards.length === 0) return;
        
        switch(e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                selectedIndex = (selectedIndex + 1) % cards.length;
                focusCard(selectedIndex);
                e.preventDefault();
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                selectedIndex = (selectedIndex - 1 + cards.length) % cards.length;
                focusCard(selectedIndex);
                e.preventDefault();
                break;
            case 'Enter':
            case ' ':
                cards[selectedIndex].click();
                e.preventDefault();
                break;
        }
    });
    
    function focusCard(index) {
        cards.forEach(card => card.style.outline = 'none');
        cards[index].style.outline = '3px solid #FFFF00';
        cards[index].style.outlineOffset = '5px';
        cards[index].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    // Easter egg: Konami code
    let konamiCode = [];
    const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    
    document.addEventListener('keydown', (e) => {
        konamiCode.push(e.key);
        konamiCode = konamiCode.slice(-10);
        
        if (konamiCode.join(',') === konamiSequence.join(',')) {
            activateEasterEgg();
        }
    });
    
    function activateEasterEgg() {
        // Rainbow effect on cards
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.animation = 'rainbow 2s infinite';
            }, index * 100);
        });
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes rainbow {
                0% { filter: hue-rotate(0deg); }
                100% { filter: hue-rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        
        console.log('🎮 KONAMI CODE ACTIVATED! 🎮');
    }
});
