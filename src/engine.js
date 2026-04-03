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
      musicEnabled: false
    };
    this.audio = new Audio();
    this.audio.src = './audio_epic.mp3'; // Changed from absolute to relative for portability
    this.audio.crossOrigin = 'anonymous';
    this.audio.preload = 'auto';
    this.audio.loop = true;
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
            <img src="./gold_frame.png" class="shield-frame">
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
              <button id="btn-start" class="btn-primary">COMENZAR AVENTURA</button>
              <button id="btn-credits" class="btn-secondary">CRÉDITOS</button>
              <button id="btn-music-toggle" class="btn-icon">🔇</button>
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
      this.container.querySelector('.title-screen').classList.add('fade-out');
      setTimeout(() => this.render(), 800);
    });

    document.getElementById('btn-credits').addEventListener('click', () => {
      document.getElementById('credits-panel').classList.remove('hidden');
    });
    document.getElementById('close-credits').addEventListener('click', () => {
      document.getElementById('credits-panel').classList.add('hidden');
    });

    document.getElementById('btn-music-toggle').addEventListener('click', () => this.toggleMusic());
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

  render() {
    const node = this.storyData.nodes[this.currentState];
    if (!node) return;
    
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
                this.gameState.inventory.map(item => `<div class="inv-item" title="${item}">${item.charAt(0)}</div>`).join('') : 
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
          <button id="map-toggle" class="map-btn">Plan del Palacio</button>
          <button id="btn-hud-music" class="map-btn" style="margin-left: 1rem; width: 50px;">${this.gameState.musicEnabled ? '🔊' : '🔇'}</button>
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
      </div>
    `;

    const textElement = document.getElementById('story-text');
    this.typeWriter(node.text, textElement);
    this.setupNavEvents();
  }

  setupNavEvents() {
    const mapToggle = document.getElementById('map-toggle');
    const navOverlay = document.getElementById('nav-overlay');
    const closeMap = document.getElementById('close-map');
    const navLocs = document.querySelectorAll('.nav-loc');

    mapToggle.addEventListener('click', () => navOverlay.classList.remove('hidden'));
    closeMap.addEventListener('click', () => navOverlay.classList.add('hidden'));

    navLocs.forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.isTyping || btn.classList.contains('active')) return;
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
    
    const availableOptions = node.options.filter(opt => {
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
        <button class="pro-option game-over-btn" onclick="location.reload()">
          <span class="opt-text">REINTENTAR AVENTURA</span>
        </button>
      `;
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
        if (this.isTyping) return;
        
        const node = this.storyData.nodes[this.currentState];
        const nextNodeId = btn.dataset.next;
        const opt = node.options.find(o => o.nextNode === nextNodeId);

        const impact = JSON.parse(btn.dataset.impact || '{}');
        if (impact.royalFavor) this.gameState.royalFavor = Math.min(100, Math.max(0, this.gameState.royalFavor + impact.royalFavor));
        if (impact.armadaReadiness) this.gameState.armadaReadiness = Math.min(100, Math.max(0, this.gameState.armadaReadiness + impact.armadaReadiness));
        
        // Collection logic
        if (opt && opt.collectItem && !this.gameState.inventory.includes(opt.collectItem)) {
          this.gameState.inventory.push(opt.collectItem);
        }

        this.currentState = nextNodeId;
        this.render();
      });
    });
  }
}

// Cinematic Engine v2.1 - RPG Expansion Ready
