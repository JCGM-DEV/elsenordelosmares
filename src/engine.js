export class GameEngine {
  constructor(storyData, containerId) {
    this.storyData = storyData;
    this.container = document.getElementById(containerId);
    this.currentState = storyData.startNode;
    this.isTyping = false;
    this.gameState = {
      royalFavor: 50,
      armadaReadiness: 30,
      inventory: [],
      visitedRooms: new Set(['patio']),
      musicEnabled: true
    };
    this.audio = new Audio();
    this.audio.src = 'https://cdn.pixabay.com/audio/2026/03/24/audio_0d4f0907cb.mp3';
    this.audio.crossOrigin = 'anonymous';
    this.audio.preload = 'auto';
    this.audio.loop = true;
    this.actx = null;
  }

  playSfx() {
    if (!this.gameState.musicEnabled) return;
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!this.actx) this.actx = new AudioContext();
        const osc = this.actx.createOscillator();
        const gain = this.actx.createGain();
        osc.connect(gain);
        gain.connect(this.actx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, this.actx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.actx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, this.actx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.actx.currentTime + 0.1);
        osc.start();
        osc.stop(this.actx.currentTime + 0.1);
    } catch (e) {}
  }

  init() {
    this.showTitleScreen();
  }
  showTitleScreen() {
    this.container.innerHTML = `
      <div class="title-screen">
        <div class="title-bg"></div>
        <div class="title-bg title-bg-2"></div>
        <div class="title-overlay"></div>
        <div class="particles" id="particles"></div>

        <div class="title-content">
          <div class="hero-portrait animate-rise">
            <img src="./alvaro_hero.png" alt="Don Álvaro de Bazán">
          </div>
          
          <div class="title-text-block">
            <div class="title-pretitle animate-fade-down">La Historia de</div>
            <h1 class="title-main animate-fade-down delay-1">El Señor<br>de los Mares</h1>
            <div class="title-subtitle animate-fade-down delay-2">"El rayo de la guerra, el que nunca conoció la derrota"</div>
            <div class="title-separator animate-fade-down delay-3">⚓ · ⚔ · ⚓</div>
            
            <div class="how-to-play animate-fade-up delay-4">
              <h3>INSTRUCCIONES</h3>
              <p>Toma decisiones críticas, gestiona tu inventario y mantén el Favor del Rey para evitar el fracaso. Cada objeto recogido puede ser la llave de tu victoria o tu perdición.</p>
            </div>

            <div class="title-actions animate-fade-up delay-4" style="margin-top: 2rem;">
              ${localStorage.getItem('elsenormares_save') ? '<button id="btn-continue" class="btn-primary" style="background:#5b21b6; color:white; border-color:#8b5cf6; margin-bottom: 10px;">CONTINUAR PARTIDA</button>' : ''}
              <button id="btn-start" class="btn-primary">NUEVA AVENTURA</button>
              <button id="btn-credits" class="btn-secondary">CRÉDITOS</button>
              <button id="btn-music-toggle" class="btn-icon">🔊</button>
            </div>
          </div>
        </div>

        <div class="title-footer">
          <span>Palacio del Viso del Marqués · Siglo XVI</span>
          <a href="https://jcgm.dev" target="_blank" class="copyright-link">© 2026 JCGM.DEV</a>
        </div>

        <div id="credits-panel" class="credits-panel hidden">
          <div class="credits-body">
            <h3>El Señor de los Mares</h3>
            <p>Una epopeya histórica sobre Don Álvaro de Bazán, Marqués de Santa Cruz.</p>
            <button id="close-credits" class="btn-secondary" style="margin-top:2rem;">Cerrar</button>
          </div>
        </div>
      </div>
    `;

    this._spawnParticles();

    document.getElementById('btn-start').addEventListener('click', () => {
      this.playSfx();
      localStorage.removeItem('elsenormares_save');
      this.container.querySelector('.title-screen').classList.add('fade-out');
      setTimeout(() => this.render(), 800);
    });

    const btnCont = document.getElementById('btn-continue');
    if (btnCont) {
        btnCont.addEventListener('click', () => {
            this.playSfx();
            const saved = JSON.parse(localStorage.getItem('elsenormares_save'));
            this.currentState = saved.node;
            this.gameState = saved.state;
            this.container.querySelector('.title-screen').classList.add('fade-out');
            setTimeout(() => this.render(), 800);
        });
    }

    document.getElementById('btn-credits').addEventListener('click', () => {
      document.getElementById('credits-panel').classList.remove('hidden');
    });
    document.getElementById('close-credits').addEventListener('click', () => {
      document.getElementById('credits-panel').classList.add('hidden');
    });

    document.getElementById('btn-music-toggle').addEventListener('click', () => this.toggleMusic());

    // Music autoplay on first interaction
    const startMusic = () => {
      if (this.gameState.musicEnabled && this.audio.paused) {
        this.audio.play().catch(e => console.log("Interacción requerida"));
      }
      document.body.removeEventListener('click', startMusic);
      document.body.removeEventListener('keydown', startMusic);
    };
    document.body.addEventListener('click', startMusic);
    document.body.addEventListener('keydown', startMusic);
  }

  toggleMusic() {
    this.gameState.musicEnabled = !this.gameState.musicEnabled;
    const btn = document.getElementById('btn-music-toggle') || document.getElementById('btn-hud-music');
    if (this.gameState.musicEnabled) {
      this.audio.play().catch(e => console.log("Interacción requerida"));
      if (btn) btn.innerText = '🔊';
    } else {
      this.audio.pause();
      if (btn) btn.innerText = '🔇';
    }
  }

  _spawnParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    for (let i = 0; i < 40; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDelay = Math.random() * 10 + 's';
      p.style.animationDuration = (8 + Math.random() * 8) + 's';
      p.style.opacity = Math.random() * 0.5 + 0.1;
      p.style.width = p.style.height = (2 + Math.random() * 3) + 'px';
      container.appendChild(p);
    }
  }

  typeWriter(text, element, speed = 20) {
    this.isTyping = true;
    element.innerHTML = '';
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        element.innerHTML += text.charAt(i);
        i++;
      } else {
        clearInterval(timer);
        this.isTyping = false;
        this.showOptions();
      }
    }, speed);
  }

  saveGame() {
    localStorage.setItem('elsenormares_save', JSON.stringify({
        node: this.currentState,
        state: this.gameState
    }));
  }

  isMapAvailable() {
      return ['patio', 'despacho', 'calles_intro', 'convento_intro', 'iglesia_intro'].includes(this.currentState);
  }

  getIconFor(item) {
     const icons = {
         'Provisiones': '🥩',
         'Provisiones Extra': '🥩',
         'Mapa de Lisboa': '🗺️',
         'Bolsa de Oro': '💰',
         'Sello Real': '📜',
         'Llave Antigua': '🔑',
         'Carta del Informador': '✉️',
         'Lista de Traidores': '📝',
         'Orden Real': '👑',
         'Pólvora Superior': '💣'
     };
     return icons[item] || item.charAt(0);
  }

  render() {
    const node = this.storyData.nodes[this.currentState];
    if (!node) return;
    
    if (node.type !== 'gameover' && !node.video) {
        this.saveGame();
    }

    const container = this.container.querySelector('.pro-container');
    if (container) {
      container.classList.add('scene-fade-out');
      setTimeout(() => {
        this._renderNodeContent(node);
      }, 500);
    } else {
      this._renderNodeContent(node);
    }
  }

  _renderNodeContent(node) {
    if (node.video) {
        this._renderVideoCinematic(node);
        return;
    }

    this.container.innerHTML = `
      <div class="pro-container scene-fade-in">
        <div class="background-blur" style="background-image: url('${node.image || ''}')"></div>
        <div class="background-art" style="background-image: url('${node.image || ''}')"></div>
        <div class="vignette"></div>

        <div class="status-dashboard">
          <div class="status-item">
            <span class="status-label">Favor Real</span>
            <div class="status-bar-container">
              <div id="bar-favor" class="status-bar favor" style="width: ${this.gameState.royalFavor}%"></div>
            </div>
          </div>
          <div class="status-item">
            <span class="status-label">Estado Armada</span>
            <div class="status-bar-container">
              <div id="bar-armada" class="status-bar armada" style="width: ${this.gameState.armadaReadiness}%"></div>
            </div>
          </div>
          
          <div class="inventory-bar">
            <span class="status-label">Inventario</span>
            <div class="inventory-slots">
              ${this.gameState.inventory.length > 0 ? 
                this.gameState.inventory.map(item => `<div class="inv-item" title="${item}">${this.getIconFor(item)}</div>`).join('') : 
                '<span class="empty-inv">Vacío</span>'}
            </div>
          </div>
        </div>
        
        ${node.character ? `
          <div class="portrait-container animate-fade-in">
              <img src="${node.character.image}" alt="${node.character.name}" class="portrait-img">
              <div class="portrait-name">${node.character.name}</div>
          </div>
        ` : ''}

        <div class="hud-box animate-slide-up">
          <div class="parchment-sheet">
            <div id="story-text" class="pro-text"></div>
            <div id="options-container" class="pro-options hidden"></div>
          </div>
        </div>

        <div class="nav-control">
          ${ this.isMapAvailable() ? `<button id="map-toggle" class="map-btn">Plan del Palacio</button>` : ''}
          <button id="btn-hud-music" class="map-btn" style="margin-left: ${this.isMapAvailable() ? '1rem' : '0'}; width: 50px;">${this.gameState.musicEnabled ? '🔊' : '🔇'}</button>
        </div>

        <div class="header-overlay">
          <h2>El Señor de los Mares</h2>
        </div>

        <div id="nav-overlay" class="nav-overlay hidden">
           <div class="nav-menu">
              <h3>Mapa de la Aventura</h3>
              <div class="nav-grid">
                <button class="nav-loc ${this.currentState === 'patio' ? 'active' : ''}" data-node="patio">Patio de Honor</button>
                <button class="nav-loc ${this.currentState === 'despacho' ? 'active' : ''}" data-node="despacho">Despacho Personal</button>
                <button class="nav-loc ${this.currentState === 'calles_intro' ? 'active' : ''}" data-node="calles_intro">Calles del Viso</button>
                <button class="nav-loc ${this.currentState === 'convento_intro' ? 'active' : ''}" data-node="convento_intro">El Convento</button>
                <button class="nav-loc ${this.currentState === 'iglesia_intro' ? 'active' : ''}" data-node="iglesia_intro">La Iglesia</button>
              </div>
              <button id="close-map" class="close-btn">Cerrar</button>
           </div>
        </div>

        <div class="title-footer">
          <span>Palacio del Viso del Marqués · Siglo XVI</span>
          <a href="https://jcgm.dev" target="_blank" class="copyright-link">© 2026 JCGM.DEV</a>
        </div>
      </div>
    `;

    const textElement = document.getElementById('story-text');
    this.typeWriter(node.text, textElement);
    this.setupNavEvents();
  }

  _renderVideoCinematic(node) {
    // Mute game music during cinematic
    const wasMusicEnabled = this.gameState.musicEnabled;
    if (wasMusicEnabled) {
        this.audio.pause();
    }

    // Attempt to handle base path correctly for Vite
    // If the path doesn't start with / and we have a base, we might need to adjust it
    const videoSrc = node.video.startsWith('http') || node.video.startsWith('/') 
        ? node.video 
        : `./${node.video}`;

    this.container.innerHTML = `
      <div class="cinematic-container">
        <video id="cinematic-video" class="cinematic-video" playsinline preload="auto">
          <source src="${videoSrc}" type="video/mp4">
          Tu navegador no soporta videos.
        </video>
        <div class="cinematic-overlay"></div>
        <div id="video-error-msg" class="hidden" style="position:absolute; color:white; z-index:2002; background:rgba(255,0,0,0.5); padding:20px; text-align:center;">
            <h3>Error al cargar el cinemático</h3>
            <p>Ruta: ${videoSrc}</p>
            <button id="error-skip" class="btn-primary" style="margin-top:10px;">Continuar de todos modos</button>
        </div>
        <button id="skip-cinematic" class="skip-cinematic">Saltar</button>
      </div>
    `;

    const video = document.getElementById('cinematic-video');
    const skipBtn = document.getElementById('skip-cinematic');
    const errorMsg = document.getElementById('video-error-msg');
    const errorSkip = document.getElementById('error-skip');

    const endCinematic = () => {
        video.pause();
        video.onended = null;
        if (wasMusicEnabled) {
            this.audio.play();
        }
        this.currentState = node.nextNode;
        this.render();
    };

    video.onerror = (e) => {
        console.error("Video element error:", video.error);
        errorMsg.classList.remove('hidden');
    };

    errorSkip.addEventListener('click', endCinematic);

    // Try to play. If it fails, it might be due to sound. Try muted.
    const playVideo = async () => {
        try {
            await video.play();
        } catch (err) {
            console.warn("Autoplay failed, trying muted:", err);
            video.muted = true;
            try {
                await video.play();
            } catch (err2) {
                console.error("Video failed even when muted:", err2);
                errorMsg.classList.remove('hidden');
            }
        }
    };

    playVideo();

    video.addEventListener('ended', endCinematic);
    skipBtn.addEventListener('click', endCinematic);
  }

  setupNavEvents() {
    const mapToggle = document.getElementById('map-toggle');
    const navOverlay = document.getElementById('nav-overlay');
    const closeMap = document.getElementById('close-map');
    const navLocs = document.querySelectorAll('.nav-loc');

    if (mapToggle) {
        mapToggle.addEventListener('click', () => { this.playSfx(); navOverlay.classList.remove('hidden'); });
    }
    if (closeMap) {
        closeMap.addEventListener('click', () => { this.playSfx(); navOverlay.classList.add('hidden'); });
    }

    navLocs.forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.isTyping || btn.classList.contains('active')) return;
        this.playSfx();
        this.currentState = btn.dataset.node;
        this.render();
      });
    });

    const hudMusic = document.getElementById('btn-hud-music');
    if (hudMusic) hudMusic.addEventListener('click', () => this.toggleMusic());
  }

  showOptions() {
    const node = this.storyData.nodes[this.currentState];
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.classList.remove('hidden');

    if (node.puzzle) {
      this.renderPuzzle(node.puzzle);
      return;
    }

    const availableOptions = node.options.filter(opt => {
      // Single use check
      if (opt.singleUse && this.gameState.usedOptions && this.gameState.usedOptions.includes(opt.text)) return false;

      // Condition check (stats)
      if (opt.condition) {
        try {
          const [variable, operator, value] = opt.condition.split(' ');
          const varValue = this.gameState[variable];
          const numValue = parseInt(value);
          if (operator === '>') if (!(varValue > numValue)) return false;
          if (operator === '<') if (!(varValue < numValue)) return false;
          if (operator === '>=') if (!(varValue >= numValue)) return false;
          if (operator === '<=') if (!(varValue <= numValue)) return false;
        } catch (e) {}
      }

      // Item requirement check
      if (opt.requireItem && !this.gameState.inventory.includes(opt.requireItem)) {
        return false;
      }

      return true;
    });

    if (node.type === 'gameover') {
      optionsContainer.innerHTML = `
        <button class="pro-option game-over-btn" onclick="localStorage.removeItem('elsenormares_save'); location.reload()">
          <span class="opt-text">REINICIAR TODO</span>
        </button>
      `;
      if (localStorage.getItem('elsenormares_save')) {
          optionsContainer.innerHTML += `
            <button class="pro-option" onclick="location.reload()" style="background:var(--gold); color:#000; justify-content:center;">
              <span class="opt-text">CARGAR ÚLTIMO PUNTO</span>
            </button>
          `;
      }
    } else {
      optionsContainer.innerHTML = availableOptions.map((opt, index) => `
        <button class="pro-option" data-next="${opt.nextNode}" data-impact='${JSON.stringify(opt.impact || {})}'>
          <span class="opt-num">${index + 1}</span>
          <span class="opt-text">${opt.text}</span>
        </button>
      `).join('');
    }

    this.bindEvents();
  }

  bindEvents() {
    const buttons = this.container.querySelectorAll('.pro-option');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.isTyping && !btn.classList.contains('game-over-btn')) return;
        this.playSfx();
        
        const node = this.storyData.nodes[this.currentState];
        const nextNodeId = btn.dataset.next;
        const opt = node.options.find(o => o.nextNode === nextNodeId);

        const impact = JSON.parse(btn.dataset.impact || '{}');
        if (impact.royalFavor) this.gameState.royalFavor = Math.min(100, Math.max(0, this.gameState.royalFavor + impact.royalFavor));
        if (impact.armadaReadiness) this.gameState.armadaReadiness = Math.min(100, Math.max(0, this.gameState.armadaReadiness + impact.armadaReadiness));
        
        // Single use logic
        if (opt && opt.singleUse) {
          if (!this.gameState.usedOptions) this.gameState.usedOptions = [];
          this.gameState.usedOptions.push(opt.text);
        }

        // Collection logic
        if (opt && opt.collectItem && !this.gameState.inventory.includes(opt.collectItem)) {
          this.gameState.inventory.push(opt.collectItem);
        }

        this.currentState = nextNodeId;
        this.render();
      });
    });
  }

  renderPuzzle(puzzle) {
    const optionsContainer = document.getElementById('options-container');
    if (puzzle.type === 'quiz') {
      optionsContainer.innerHTML = `
        <div class="puzzle-box">
          <p class="puzzle-q">${puzzle.question}</p>
          ${puzzle.options.map((opt, i) => `
            <button class="pro-option puzzle-opt" data-index="${i}">
              <span class="opt-text">${opt}</span>
            </button>
          `).join('')}
        </div>
      `;
      const buttons = optionsContainer.querySelectorAll('.puzzle-opt');
      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          this.playSfx();
          const index = parseInt(btn.dataset.index);
          this.checkPuzzleResult(index === puzzle.correctIndex, puzzle);
        });
      });
    } else if (puzzle.type === 'cipher') {
      optionsContainer.innerHTML = `
        <div class="puzzle-box">
          <p class="puzzle-q">${puzzle.question}</p>
          <input type="text" id="puzzle-input" class="puzzle-input" placeholder="Escribe aquí..." autofocus>
          <button id="puzzle-submit" class="pro-option puzzle-submit-btn">DESCIFRAR</button>
        </div>
      `;
      const submit = document.getElementById('puzzle-submit');
      const input = document.getElementById('puzzle-input');
      submit.addEventListener('click', () => {
        this.playSfx();
        const val = input.value.trim().toLowerCase();
        this.checkPuzzleResult(val === puzzle.answer.toLowerCase(), puzzle);
      });
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submit.click();
      });
    } else if (puzzle.type === 'sequence') {
      let currentIdx = 0;
      optionsContainer.innerHTML = `
        <div class="puzzle-box">
          <p class="puzzle-q">${puzzle.question}</p>
          <div class="sequence-display" id="seq-display">Repite: ${puzzle.sequence.map(() => '⚪').join(' ')}</div>
          <div class="sequence-btns">
            ${puzzle.buttons.map((btnLabel, i) => `
              <button class="pro-option seq-btn" data-label="${btnLabel}">${btnLabel}</button>
            `).join('')}
          </div>
        </div>
      `;
      const seqBtns = optionsContainer.querySelectorAll('.seq-btn');
      const display = document.getElementById('seq-display');
      seqBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          this.playSfx();
          const label = btn.dataset.label;
          if (label === puzzle.sequence[currentIdx]) {
            currentIdx++;
            display.innerText = 'Racha: ' + puzzle.sequence.slice(0, currentIdx).map(() => '🟢').join(' ') + puzzle.sequence.slice(currentIdx).map(() => '⚪').join(' ');
            if (currentIdx === puzzle.sequence.length) {
              setTimeout(() => this.checkPuzzleResult(true, puzzle), 500);
            }
          } else {
            display.innerText = '¡FALLO!';
            setTimeout(() => this.checkPuzzleResult(false, puzzle), 800);
          }
        });
      });
    } else if (puzzle.type === 'dice') {
      optionsContainer.innerHTML = `
        <div class="puzzle-box">
          <p class="puzzle-q">${puzzle.question}</p>
          <div id="dice-result" class="dice-value">?</div>
          <button id="roll-dice" class="pro-option puzzle-submit-btn">LANZAR DADOS</button>
        </div>
      `;
      const rollBtn = document.getElementById('roll-dice');
      const diceRes = document.getElementById('dice-result');
      rollBtn.addEventListener('click', () => {
        this.playSfx();
        rollBtn.disabled = true;
        let rolls = 0;
        const interval = setInterval(() => {
          diceRes.innerText = Math.floor(Math.random() * 6) + 1;
          rolls++;
          if (rolls > 10) {
            clearInterval(interval);
            const finalVal = Math.floor(Math.random() * 6) + 1;
            diceRes.innerText = finalVal;
            setTimeout(() => this.checkPuzzleResult(finalVal >= puzzle.target, puzzle), 1000);
          }
        }, 500);
      });
    }
  }

  checkPuzzleResult(success, puzzle) {
    if (success) {
      this.currentState = puzzle.successNode;
    } else {
      if (puzzle.failImpact) {
        if (puzzle.failImpact.royalFavor) this.gameState.royalFavor = Math.max(0, this.gameState.royalFavor + puzzle.failImpact.royalFavor);
        if (puzzle.failImpact.armadaReadiness) this.gameState.armadaReadiness = Math.max(0, this.gameState.armadaReadiness + puzzle.failImpact.armadaReadiness);
      }
      this.currentState = puzzle.failNode;
    }
    this.render();
  }
}

// Cinematic Engine v2.1 - RPG Expansion Ready
