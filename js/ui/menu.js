/**
 * The Arcade Madness - Menu System
 */

document.addEventListener('DOMContentLoaded', () => {
    const gameSelection = document.getElementById('game-selection');
    
    const games = [
        {
            name: 'Tetris',
            description: 'Stack falling blocks to clear lines',
            url: 'js/games/tetris/tetris.html',
            icon: '🎮'
        },
        {
            name: 'Snake',
            description: 'Eat food and grow without hitting walls',
            url: 'js/games/snake/snake.html',
            icon: '🐍'
        },
        {
            name: 'Sokoban',
            description: 'Push boxes to their goal positions',
            url: 'js/games/sokoban/sokoban.html',
            icon: '📦'
        },
        {
            name: 'Pac-Man',
            description: 'Eat pellets and avoid ghosts',
            url: 'js/games/pacman/pacman.html',
            icon: '👻'
        }
    ];

    // Create game grid (placeholder for now)
    gameSelection.innerHTML = '<div class="games-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem;"></div>';
    
    const grid = gameSelection.querySelector('.games-grid');
    
    games.forEach(game => {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.style.cssText = 'background: rgba(255,255,255,0.1); padding: 2rem; border-radius: 10px; text-align: center; cursor: pointer; transition: transform 0.3s;';
        card.innerHTML = 
            <div style="font-size: 4rem;"></div>
            <h2></h2>
            <p style="margin-top: 0.5rem; opacity: 0.8;"></p>
            <button class="btn" style="margin-top: 1rem;">Play Now</button>
        ;
        
        card.addEventListener('mouseenter', () => card.style.transform = 'scale(1.05)');
        card.addEventListener('mouseleave', () => card.style.transform = 'scale(1)');
        card.addEventListener('click', () => {
            window.location.href = game.url;
        });
        
        grid.appendChild(card);
    });
});
