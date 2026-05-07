const gameListEl = document.getElementById('game-list');
const gameHeader = document.getElementById('game-header');
const gameArea = document.getElementById('game-area');
let currentGameId = null;
let gameState = null;

async function loadGameList() {
  try {
    const response = await fetch('games.json');
    const games = await response.json();
    renderGameList(games);
  } catch (error) {
    gameListEl.innerHTML = '<div class="placeholder">Unable to load games.json locally. Run a local server or open the site from the same folder.</div>';
    console.error(error);
  }
}

function renderGameList(games) {
  gameListEl.innerHTML = games.map(game => `
    <button class="game-card" data-game="${game.id}" type="button">
      <h3>${game.name}</h3>
      <p>${game.description}</p>
    </button>
  `).join('');

  document.querySelectorAll('.game-card').forEach(button => {
    button.addEventListener('click', () => selectGame(button.dataset.game));
  });
}

function selectGame(gameId) {
  if (currentGameId === gameId) return;
  currentGameId = gameId;
  document.querySelectorAll('.game-card').forEach(button => {
    button.classList.toggle('active', button.dataset.game === gameId);
  });

  gameHeader.textContent = {
    'tic-tac-toe': 'Tic-Tac-Toe',
    'snake': 'Snake',
    'memory-match': 'Memory Match'
  }[gameId] || 'Game';

  if (gameId === 'tic-tac-toe') {
    initTicTacToe();
  } else if (gameId === 'snake') {
    initSnake();
  } else if (gameId === 'memory-match') {
    initMemoryMatch();
  }
}

function clearGameArea() {
  gameArea.innerHTML = '';
  gameState = null;
}

function createBoard(rows, cols) {
  const board = document.createElement('div');
  board.className = 'board';
  board.style.display = 'grid';
  board.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
  board.style.gap = '0.6rem';
  return board;
}

function initTicTacToe() {
  clearGameArea();
  gameState = {
    turn: 'X',
    cells: Array(9).fill(''),
    finished: false,
  };

  const board = createBoard(3, 3);
  board.style.maxWidth = '360px';

  for (let i = 0; i < 9; i += 1) {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'select-button';
    cell.style.minHeight = '88px';
    cell.style.fontSize = '2rem';
    cell.textContent = '';
    cell.addEventListener('click', () => makeMove(i, cell));
    board.appendChild(cell);
  }

  const status = document.createElement('div');
  status.className = 'game-message';
  status.textContent = 'X goes first.';

  const reset = document.createElement('button');
  reset.type = 'button';
  reset.textContent = 'Restart';
  reset.addEventListener('click', () => initTicTacToe());

  const controls = document.createElement('div');
  controls.className = 'game-controls';
  controls.append(reset);

  gameArea.append(board, status, controls);

  function makeMove(index, cell) {
    if (gameState.finished || gameState.cells[index]) return;
    gameState.cells[index] = gameState.turn;
    cell.textContent = gameState.turn;

    const winner = checkTicTacToeWinner(gameState.cells);
    if (winner) {
      gameState.finished = true;
      status.textContent = `Winner: ${winner}`;
      return;
    }

    if (gameState.cells.every(Boolean)) {
      gameState.finished = true;
      status.textContent = 'Draw. Try again!';
      return;
    }

    gameState.turn = gameState.turn === 'X' ? 'O' : 'X';
    status.textContent = `${gameState.turn} to move.`;
  }
}

function checkTicTacToeWinner(cells) {
  const wins = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  for (const [a, b, c] of wins) {
    if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
      return cells[a];
    }
  }
  return null;
}

function initSnake() {
  clearGameArea();

  const canvas = document.createElement('canvas');
  canvas.width = 360;
  canvas.height = 360;
  gameArea.append(canvas);
  const ctx = canvas.getContext('2d');

  const grid = 18;
  const state = {
    snake: [{ x: 9, y: 9 }],
    dir: { x: 0, y: 0 },
    apple: randomApple([{ x: 9, y: 9 }]),
    score: 0,
    running: true,
  };

  const scoreMsg = document.createElement('div');
  scoreMsg.className = 'game-message';
  scoreMsg.textContent = 'Use arrow keys to move.';
  gameArea.append(scoreMsg);

  const reset = document.createElement('button');
  reset.type = 'button';
  reset.textContent = 'Restart';
  reset.addEventListener('click', start);

  const controls = document.createElement('div');
  controls.className = 'game-controls';
  controls.append(reset);
  gameArea.append(controls);

  window.addEventListener('keydown', handleKey);
  let timer = null;

  function start() {
    state.snake = [{ x: 9, y: 9 }];
    state.dir = { x: 0, y: 0 };
    state.apple = randomApple(state.snake);
    state.score = 0;
    state.running = true;
    scoreMsg.textContent = 'Use arrow keys to move.';
    if (timer) {
      clearInterval(timer);
    }
    timer = setInterval(step, 120);
    draw();
  }

  function handleKey(event) {
    if (!state.running) return;
    const keys = {
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 }
    };
    const next = keys[event.key];
    if (next && (next.x !== -state.dir.x || next.y !== -state.dir.y)) {
      state.dir = next;
    }
  }

  function step() {
    if (!state.running) return;
    const head = { x: state.snake[0].x + state.dir.x, y: state.snake[0].y + state.dir.y };

    if (!state.dir.x && !state.dir.y) {
      draw();
      return;
    }

    if (head.x < 0 || head.x >= grid || head.y < 0 || head.y >= grid || state.snake.some(s => s.x === head.x && s.y === head.y)) {
      state.running = false;
      scoreMsg.textContent = `Game over. Score: ${state.score}`;
      clearInterval(timer);
      return;
    }

    state.snake.unshift(head);
    if (head.x === state.apple.x && head.y === state.apple.y) {
      state.score += 1;
      state.apple = randomApple(state.snake);
    } else {
      state.snake.pop();
    }

    draw();
  }

  function draw() {
    ctx.fillStyle = '#08101d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const cellSize = canvas.width / grid;

    ctx.fillStyle = '#22c55e';
    state.snake.forEach(segment => {
      ctx.fillRect(segment.x * cellSize + 2, segment.y * cellSize + 2, cellSize - 4, cellSize - 4);
    });

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(state.apple.x * cellSize + 2, state.apple.y * cellSize + 2, cellSize - 4, cellSize - 4);
  }

  function randomApple(snake) {
    const positions = [];
    for (let x = 0; x < grid; x += 1) {
      for (let y = 0; y < grid; y += 1) {
        if (!snake.some(s => s.x === x && s.y === y)) {
          positions.push({ x, y });
        }
      }
    }
    return positions[Math.floor(Math.random() * positions.length)];
  }

  start();
}

function initMemoryMatch() {
  clearGameArea();

  const pairs = ['🍎','🎈','🐶','🚀','🎵','🐢'];
  const cards = shuffle([...pairs, ...pairs]);
  const board = createBoard(3, 4);
  board.style.maxWidth = '540px';
  const status = document.createElement('div');
  status.className = 'game-message';
  status.textContent = 'Find matching pairs.';

  const state = {
    first: null,
    second: null,
    locked: false,
    matches: 0,
  };

  cards.forEach((emoji, index) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'select-button';
    card.style.minHeight = '100px';
    card.style.fontSize = '2rem';
    card.textContent = '?';
    card.dataset.value = emoji;
    card.addEventListener('click', () => flipCard(card));
    board.appendChild(card);
  });

  const reset = document.createElement('button');
  reset.type = 'button';
  reset.textContent = 'Restart';
  reset.addEventListener('click', () => initMemoryMatch());

  const controls = document.createElement('div');
  controls.className = 'game-controls';
  controls.append(reset);

  gameArea.append(board, status, controls);

  function flipCard(card) {
    if (state.locked || card.textContent !== '?') return;
    card.textContent = card.dataset.value;

    if (!state.first) {
      state.first = card;
      return;
    }

    state.second = card;
    state.locked = true;

    if (state.first.dataset.value === state.second.dataset.value) {
      state.matches += 1;
      status.textContent = `Pairs found: ${state.matches}/${pairs.length}`;
      state.first.disabled = true;
      state.second.disabled = true;
      state.first = null;
      state.second = null;
      state.locked = false;

      if (state.matches === pairs.length) {
        status.textContent = 'Great job! You matched them all.';
      }
      return;
    }

    setTimeout(() => {
      state.first.textContent = '?';
      state.second.textContent = '?';
      state.first = null;
      state.second = null;
      state.locked = false;
    }, 750);
  }
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

loadGameList();
