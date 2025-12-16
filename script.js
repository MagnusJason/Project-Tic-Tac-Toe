// Gameboard Module (IIFE - single instance)
const Gameboard = (() => {
    const board = ['', '', '', '', '', '', '', '', ''];

    const getBoard = () => board;

    const setCell = (index, marker) => {
        if (index >= 0 && index < 9 && board[index] === '') {
            board[index] = marker;
            return true;
        }
        return false;
    };

    const getCell = (index) => {
        if (index >= 0 && index < 9) {
            return board[index];
        }
        return null;
    };

    const reset = () => {
        for (let i = 0; i < 9; i++) {
            board[i] = '';
        }
    };

    const isFull = () => {
        return board.every(cell => cell !== '');
    };

    return {
        getBoard,
        setCell,
        getCell,
        reset,
        isFull
    };
})();

// Player Factory
const Player = (name, marker) => {
    return {
        name,
        marker
    };
};

// AI Module (IIFE - single instance) - Minimax Algorithm
const AI = (() => {
    const winConditions = [
        [0, 1, 2], // top row
        [3, 4, 5], // middle row
        [6, 7, 8], // bottom row
        [0, 3, 6], // left column
        [1, 4, 7], // middle column
        [2, 5, 8], // right column
        [0, 4, 8], // diagonal top-left to bottom-right
        [2, 4, 6]  // diagonal top-right to bottom-left
    ];

    // Check if a player has won
    const checkWinner = (board, marker) => {
        return winConditions.some(condition => {
            return condition.every(index => board[index] === marker);
        });
    };

    // Check if board is full
    const isBoardFull = (board) => {
        return board.every(cell => cell !== '');
    };

    // Evaluate the board state
    // Returns: 10 if computer wins, -10 if player wins, 0 for tie
    const evaluate = (board, computerMarker, playerMarker) => {
        if (checkWinner(board, computerMarker)) {
            return 10;
        } else if (checkWinner(board, playerMarker)) {
            return -10;
        } else {
            return 0;
        }
    };

    // Minimax algorithm
    const minimax = (board, depth, isMaximizing, computerMarker, playerMarker) => {
        // Base cases: check if game is over
        const score = evaluate(board, computerMarker, playerMarker);
        
        // If computer wins, return positive score (adjusted by depth for faster wins)
        if (score === 10) {
            return score - depth;
        }
        
        // If player wins, return negative score (adjusted by depth for slower losses)
        if (score === -10) {
            return score + depth;
        }
        
        // If board is full (tie), return 0
        if (isBoardFull(board)) {
            return 0;
        }

        if (isMaximizing) {
            // Computer's turn - maximize score
            let bestScore = -Infinity;
            
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    // Make move
                    board[i] = computerMarker;
                    
                    // Recursively evaluate this move
                    const score = minimax(board, depth + 1, false, computerMarker, playerMarker);
                    
                    // Undo move
                    board[i] = '';
                    
                    // Update best score
                    bestScore = Math.max(score, bestScore);
                }
            }
            
            return bestScore;
        } else {
            // Player's turn - minimize score
            let bestScore = Infinity;
            
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    // Make move
                    board[i] = playerMarker;
                    
                    // Recursively evaluate this move
                    const score = minimax(board, depth + 1, true, computerMarker, playerMarker);
                    
                    // Undo move
                    board[i] = '';
                    
                    // Update best score
                    bestScore = Math.min(score, bestScore);
                }
            }
            
            return bestScore;
        }
    };

    // Get the best move using minimax
    const getBestMove = (board, computerMarker, playerMarker) => {
        // Create a copy of the board to avoid modifying the original
        const boardCopy = [...board];
        
        let bestScore = -Infinity;
        let bestMove = null;
        
        // Try all possible moves
        for (let i = 0; i < 9; i++) {
            if (boardCopy[i] === '') {
                // Make move
                boardCopy[i] = computerMarker;
                
                // Evaluate this move
                const score = minimax(boardCopy, 0, false, computerMarker, playerMarker);
                
                // Undo move
                boardCopy[i] = '';
                
                // Update best move if this is better
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }
        
        return bestMove;
    };

    return {
        getBestMove
    };
})();

// Game Controller
const GameController = (() => {
    let player1 = null;
    let player2 = null;
    let currentPlayer = null;
    let gameOver = false;
    let winner = null;
    let vsComputer = false;
    let computerMarker = 'O';

    const initialize = (name1, name2, isVsComputer = false) => {
        player1 = Player(name1 || 'Player 1', 'X');
        if (isVsComputer) {
            player2 = Player('Computer', 'O');
            vsComputer = true;
            computerMarker = 'O';
        } else {
            player2 = Player(name2 || 'Player 2', 'O');
            vsComputer = false;
        }
        currentPlayer = player1;
        gameOver = false;
        winner = null;
        Gameboard.reset();
    };

    const getCurrentPlayer = () => currentPlayer;

    const switchPlayer = () => {
        currentPlayer = currentPlayer === player1 ? player2 : player1;
    };

    const makeMove = (index) => {
        if (gameOver) {
            return { success: false, message: 'Game is over!' };
        }

        if (Gameboard.getCell(index) !== '') {
            return { success: false, message: 'Cell is already taken!' };
        }

        Gameboard.setCell(index, currentPlayer.marker);

        if (checkWinner()) {
            gameOver = true;
            winner = currentPlayer;
            return { success: true, gameOver: true, winner: currentPlayer };
        }

        if (Gameboard.isFull()) {
            gameOver = true;
            return { success: true, gameOver: true, winner: null };
        }

        switchPlayer();
        return { success: true, gameOver: false };
    };

    const checkWinner = () => {
        const board = Gameboard.getBoard();
        const marker = currentPlayer.marker;

        // Winning combinations
        const winConditions = [
            [0, 1, 2], // top row
            [3, 4, 5], // middle row
            [6, 7, 8], // bottom row
            [0, 3, 6], // left column
            [1, 4, 7], // middle column
            [2, 5, 8], // right column
            [0, 4, 8], // diagonal top-left to bottom-right
            [2, 4, 6]  // diagonal top-right to bottom-left
        ];

        return winConditions.some(condition => {
            return condition.every(index => board[index] === marker);
        });
    };

    const getWinningCells = () => {
        if (!gameOver || !winner) return null;

        const board = Gameboard.getBoard();
        const marker = winner.marker;

        const winConditions = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6]
        ];

        for (const condition of winConditions) {
            if (condition.every(index => board[index] === marker)) {
                return condition;
            }
        }

        return null;
    };

    const isGameOver = () => gameOver;

    const getWinner = () => winner;

    const isVsComputer = () => vsComputer;

    const isComputerTurn = () => {
        return vsComputer && currentPlayer.marker === computerMarker;
    };

    const makeComputerMove = () => {
        if (!isComputerTurn() || gameOver) {
            return { success: false };
        }

        const board = Gameboard.getBoard();
        const playerMarker = player1.marker;
        const move = AI.getBestMove(board, computerMarker, playerMarker);

        if (move !== null) {
            return makeMove(move);
        }

        return { success: false };
    };

    return {
        initialize,
        getCurrentPlayer,
        makeMove,
        makeComputerMove,
        isGameOver,
        getWinner,
        getWinningCells,
        isVsComputer,
        isComputerTurn
    };
})();

// Display Controller (IIFE - single instance)
const DisplayController = (() => {
    const gameboardElement = document.getElementById('gameboard');
    const statusElement = document.getElementById('game-status');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const player1Input = document.getElementById('player1-name');
    const player2Input = document.getElementById('player2-name');
    const player2Container = document.getElementById('player2-container');
    const gameModeRadios = document.querySelectorAll('input[name="game-mode"]');

    const render = () => {
        gameboardElement.innerHTML = '';
        const board = Gameboard.getBoard();

        board.forEach((cell, index) => {
            const cellElement = document.createElement('div');
            cellElement.classList.add('cell');
            cellElement.dataset.index = index;

            if (cell === 'X') {
                cellElement.textContent = 'X';
                cellElement.classList.add('x');
            } else if (cell === 'O') {
                cellElement.textContent = 'O';
                cellElement.classList.add('o');
            }

            if (GameController.isGameOver() || cell !== '') {
                cellElement.classList.add('disabled');
            } else {
                cellElement.addEventListener('click', handleCellClick);
            }

            gameboardElement.appendChild(cellElement);
        });

        // Highlight winning cells
        const winningCells = GameController.getWinningCells();
        if (winningCells) {
            winningCells.forEach(index => {
                const cell = gameboardElement.children[index];
                if (cell) {
                    cell.classList.add('winning');
                }
            });
        }
    };

    const handleCellClick = (e) => {
        const index = parseInt(e.target.dataset.index);
        const result = GameController.makeMove(index);

        if (result.success) {
            render();
            updateStatus();

            if (result.gameOver) {
                disableBoard();
                restartBtn.style.display = 'block';
            } else if (GameController.isVsComputer() && GameController.isComputerTurn()) {
                // Computer's turn - make move after a short delay
                setTimeout(() => {
                    const computerResult = GameController.makeComputerMove();
                    if (computerResult.success) {
                        render();
                        updateStatus();

                        if (computerResult.gameOver) {
                            disableBoard();
                            restartBtn.style.display = 'block';
                        }
                    }
                }, 500);
            }
        }
    };

    const updateStatus = () => {
        if (GameController.isGameOver()) {
            const winner = GameController.getWinner();
            if (winner) {
                statusElement.textContent = `${winner.name} wins!`;
                statusElement.style.color = '#28a745';
            } else {
                statusElement.textContent = "It's a tie!";
                statusElement.style.color = '#ffc107';
            }
        } else {
            const currentPlayer = GameController.getCurrentPlayer();
            statusElement.textContent = `${currentPlayer.name}'s turn (${currentPlayer.marker})`;
            statusElement.style.color = '#333';
        }
    };

    const disableBoard = () => {
        const cells = gameboardElement.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.classList.add('disabled');
            cell.replaceWith(cell.cloneNode(true));
        });
    };

    const getGameMode = () => {
        const selectedMode = document.querySelector('input[name="game-mode"]:checked');
        return selectedMode ? selectedMode.value : 'two-player';
    };

    const updatePlayer2Visibility = () => {
        const isVsComputer = getGameMode() === 'computer';
        if (isVsComputer) {
            player2Container.style.display = 'none';
        } else {
            player2Container.style.display = 'block';
        }
    };

    const startGame = () => {
        const name1 = player1Input.value.trim() || 'Player 1';
        const gameMode = getGameMode();
        const isVsComputer = gameMode === 'computer';
        const name2 = isVsComputer ? 'Computer' : (player2Input.value.trim() || 'Player 2');

        GameController.initialize(name1, name2, isVsComputer);
        render();
        updateStatus();

        startBtn.style.display = 'none';
        restartBtn.style.display = 'none';
        player1Input.disabled = true;
        player2Input.disabled = true;
        gameModeRadios.forEach(radio => radio.disabled = true);
    };

    const restartGame = () => {
        const name1 = player1Input.value.trim() || 'Player 1';
        const gameMode = getGameMode();
        const isVsComputer = gameMode === 'computer';
        const name2 = isVsComputer ? 'Computer' : (player2Input.value.trim() || 'Player 2');

        GameController.initialize(name1, name2, isVsComputer);
        render();
        updateStatus();

        restartBtn.style.display = 'none';
    };

    // Event Listeners
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', restartGame);
    
    gameModeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            updatePlayer2Visibility();
            // Re-enable inputs if game hasn't started
            if (startBtn.style.display !== 'none') {
                player1Input.disabled = false;
                player2Input.disabled = false;
            }
        });
    });

    // Initialize display
    render();
    updatePlayer2Visibility();
    statusElement.textContent = 'Enter player names and click Start Game';

    return {
        render,
        updateStatus
    };
})();

