/**
 * The Arcade Madness - Scoreboard
 * Manages score display and persistence
 */

class Scoreboard {
    constructor(gameName) {
        this.gameName = gameName;
        this.currentScore = 0;
        this.highScore = this.loadHighScore();
    }

    loadHighScore() {
        const saved = localStorage.getItem(${this.gameName}_highScore);
        return saved ? parseInt(saved, 10) : 0;
    }

    saveHighScore() {
        localStorage.setItem(${this.gameName}_highScore, this.highScore.toString());
    }

    addScore(points) {
        this.currentScore += points;
        
        if (this.currentScore > this.highScore) {
            this.highScore = this.currentScore;
            this.saveHighScore();
        }
    }

    reset() {
        this.currentScore = 0;
    }

    getScore() {
        return this.currentScore;
    }

    getHighScore() {
        return this.highScore;
    }
}
