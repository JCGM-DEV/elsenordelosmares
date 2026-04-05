export class GameEngine {
  constructor(storyData, containerId) {
    this.storyData = storyData;
    this.nodes = storyData.nodes;
    this.container = document.getElementById(containerId);
    this.startNode = storyData.startNode;
    this.currentState = this.startNode;
    this.isTyping = false;
    this.gameState = {
      royalFavor: 45,
      armadaReadiness: 30,
      daysRemaining: 13,
      inventory: [],
      visitedRooms: ['patio'],
      musicEnabled: true
    };
    this.tracks = {
        act1: 'https://cdn.pixabay.com/audio/2026/03/24/audio_0d4f0907cb.mp3',
        act2: 'https://cdn.pixabay.com/audio/2025/04/28/audio_80aa4ceff2.mp3',
        act3: 'https://cdn.pixabay.com/audio/2025/06/17/audio_3ae4c7db2c.mp3'
    };
    this.currentTrack = 'act1';
    this.audio = new Audio();
    this.audio.src = this.tracks.act1;
    this.audio.preload = 'auto';
    this.audio.loop = true;
    this.audio.volume = 0.6;
    this.actx = null;
    this.ttsEnabled = localStorage.getItem('elsenormares_tts') !== 'false'; // Default to true if not set
    if (localStorage.getItem('elsenormares_tts') === null) {
      localStorage.setItem('elsenormares_tts', 'true');
    }
  }

  playSfx(type = 'click') {
    if (!this.gameState.musicEnabled) return;
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!this.actx) this.actx = new AudioContext();
        const osc = this.actx.createOscillator();
        const gain = this.actx.createGain();
        osc.connect(gain);
        gain.connect(this.actx.destination);

        const sfxMap = {
          click:    { type: 'triangle', freq: 400, endFreq: 100, dur: 0.1, vol: 0.2 },
          item:     { type: 'sine',     freq: 600, endFreq: 900, dur: 0.15, vol: 0.25 },
          gold:     { type: 'sine',     freq: 800, endFreq: 1200, dur: 0.2, vol: 0.2 },
          sword:    { type: 'sawtooth', freq: 300, endFreq: 80,  dur: 0.2, vol: 0.3 },
          scroll:   { type: 'sine',     freq: 350, endFreq: 500, dur: 0.12, vol: 0.15 },
          negative: { type: 'sawtooth', freq: 200, endFreq: 60,  dur: 0.25, vol: 0.3 },
        };
        const s = sfxMap[type] || sfxMap.click;
        osc.type = s.type;
        osc.frequency.setValueAtTime(s.freq, this.actx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(s.endFreq, this.actx.currentTime + s.dur);
        gain.gain.setValueAtTime(s.vol, this.actx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.actx.currentTime + s.dur);
        osc.start();
        osc.stop(this.actx.currentTime + s.dur);
    } catch (e) {}
  }

  init() {
    this._showLoadingScreen();
  }

  _showLoadingScreen() {
    this.container.innerHTML = `
      <div class="loading-screen" id="loading-screen">
        <div class="loading-bg"></div>
        <div class="loading-content">
          <img src="./escudo.svg" alt="Escudo" class="loading-crest">
          <h1 class="loading-title">EL SEÑOR<br>DE LOS MARES</h1>
          <div class="loading-bar-wrap">
            <div class="loading-bar" id="loading-bar"></div>
          </div>
          <p class="loading-text" id="loading-text">Cargando la epopeya...</p>
        </div>
      </div>
    `;

    const criticalImages = [
      'alvaro_hero.webp', 'patio.webp', 'clean_parchment.webp',
      'despacho.webp', 'escalera.webp', 'bodegas.webp', 'calles.webp',
      'palacio_viso_epic.webp', 'don_alvaro.webp'
    ];

    const bar = document.getElementById('loading-bar');
    const txt = document.getElementById('loading-text');
    const messages = ['Preparando la flota...', 'Cargando los mapas...', 'Afilando las espadas...', 'Listo para zarpar...'];
    let loaded = 0;

    const advance = () => {
      loaded++;
      const pct = Math.round((loaded / criticalImages.length) * 100);
      if (bar) bar.style.width = pct + '%';
      const msgIdx = Math.min(Math.floor(pct / 30), messages.length - 1);
      if (txt) txt.textContent = messages[msgIdx];
      if (loaded >= criticalImages.length) {
        setTimeout(() => {
          const screen = document.getElementById('loading-screen');
          if (screen) screen.classList.add('loading-fade-out');
          setTimeout(() => this.showTitleScreen(), 600);
        }, 200);
      }
    };

    // Safety timeout — never get stuck, always proceed after 4s max
    const safetyTimer = setTimeout(() => {
      const screen = document.getElementById('loading-screen');
      if (screen) screen.classList.add('loading-fade-out');
      setTimeout(() => this.showTitleScreen(), 600);
    }, 4000);

    let pending = criticalImages.length;
    criticalImages.forEach(src => {
      const img = new Image();
      img.onload = img.onerror = () => {
        pending--;
        advance();
        if (pending <= 0) clearTimeout(safetyTimer);
      };
      img.src = './' + src;
    });
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
            <img src="./alvaro_hero.webp" alt="Don Álvaro de Bazán">
          </div>
          
          <div class="title-text-block">
            <div class="crest-container animate-fade-down">
                <img src="./escudo.svg" alt="Escudo Viso del Marqués" class="hero-crest" style="width: 85px; filter: drop-shadow(0 0 12px rgba(197,160,33,0.5));">
            </div>
            <div class="title-pretitle animate-fade-down delay-1">Memoria de una Epopeya</div>
            <h1 class="title-main animate-fade-down delay-2">EL SEÑOR<br>DE LOS MARES</h1>
            <div class="title-subtitle animate-fade-down delay-2">"El rayo de la guerra, el que nunca conoció la derrota en el mar"</div>
            <div class="title-separator animate-fade-down delay-3">⚓ · ⚔ · ⚓</div>
            
            <div class="how-to-play animate-fade-up delay-4">
              <h3>ORDEN DE OPERACIÓN</h3>
              <p>Como Marqués de Santa Cruz, tus órdenes decidirán el futuro del Imperio. Gestiona con prudencia la Armada y el Favor Real.</p>
            </div>

            <div class="title-actions animate-fade-up delay-4">
              ${localStorage.getItem('elsenormares_save') ? '<button id="btn-continue" class="btn-primary" style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color:white; border-color:#60a5fa;">CONTINUAR PARTIDA</button>' : ''}
              <button id="btn-start" class="btn-primary">NUEVA AVENTURA</button>
              <div style="display:flex; gap:10px; width:100%; justify-content:center;">
                <button id="btn-credits" class="btn-secondary" style="flex:1;">CRÉDITOS</button>
                <button id="btn-achievements" class="btn-secondary" style="flex:1;">LOGROS</button>
                <button id="btn-music-toggle" class="btn-icon">🔊</button>
              </div>
            </div>
          </div>
        </div>

        <div class="title-footer">
          <span>Palacio de Viso del Marqués · Siglo XVI</span>
          <a href="https://jcgm.dev" target="_blank" class="copyright-link">© 2026 JCGM.DEV</a>
        </div>

        <div id="credits-panel" class="credits-panel hidden">
          <div class="credits-body">
            <h3>El Señor de los Mares</h3>
            <p>Una epopeya histórica inspirada en la vida de Don Álvaro de Bazán.</p>
            <p style="font-size:0.9rem; margin-top:1rem; opacity:0.8;">Diseño y Desarrollo: JCGM.DEV</p>
            <button id="close-credits" class="btn-primary" style="margin-top:2rem; width:100%;">Cerrar</button>
          </div>
        </div>

        <div id="achievements-panel" class="credits-panel hidden">
          <div class="credits-body">
            <h3>⚓ Logros</h3>
            ${this._renderAchievementsList()}
            <button id="close-achievements" class="btn-primary" style="margin-top:2rem; width:100%;">Cerrar</button>
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
            // Ensure visitedRooms is always a plain array (not a Set)
            saved.state.visitedRooms = Array.isArray(saved.state.visitedRooms)
                ? saved.state.visitedRooms
                : Array.from(saved.state.visitedRooms || []);
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

    document.getElementById('btn-achievements').addEventListener('click', () => {
      document.getElementById('achievements-panel').classList.remove('hidden');
    });
    document.getElementById('close-achievements').addEventListener('click', () => {
      document.getElementById('achievements-panel').classList.add('hidden');
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

  toggleTts() {
    this.playSfx();
    this.ttsEnabled = !this.ttsEnabled;
    localStorage.setItem('elsenormares_tts', this.ttsEnabled);
    const btn = document.getElementById('btn-hud-tts');
    if (btn) btn.innerText = this.ttsEnabled ? '🗣️' : '🤫';
    if (!this.ttsEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  _speakText(text) {
      if (!this.ttsEnabled || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/<[^>]*>?/gm, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'es-ES';
      utterance.rate = 1.05;
      utterance.pitch = 0.9;
      
      const voices = window.speechSynthesis.getVoices();
      const esVoice = voices.find(v => v.lang.startsWith('es') && (v.name.includes('Google') || v.name.includes('Natural')));
      if (esVoice) utterance.voice = esVoice;

      window.speechSynthesis.speak(utterance);
  }

  _highlightLore(text) {
      const keywords = [
          'Felipe II', 'Álvaro de Bazán', 'Santa Cruz', 'Armada', 'Lisboa', 'Azores', 'Madrid', 'El Viso', 'Viso del Marqués', 'San Martín', 'Ingleses', 'Inglaterra', 'Pólvora', 'Provisiones', 'Sello Real', 'Oro', 'Mapa', 'Isabel', 'Drake', 'Códice', 'Lepanto'
      ];
      let highlighted = text;
      keywords.forEach(kw => {
          const regex = new RegExp(`\\b(${kw})\\b`, 'gi');
          highlighted = highlighted.replace(regex, '<span class="lore-gold">$1</span>');
      });
      return highlighted;
  }

  _checkCinematicMode() {
      const epicNodes = ['madrid_consejo', 'madrid_felipe_ii', 'azores_batalla', 'final_logic', 'final_gratitud', 'final_homenaje_viso'];
      if (epicNodes.includes(this.currentState)) {
          document.body.classList.add('cinematic-mode', 'active-bars');
      } else {
          document.body.classList.remove('active-bars');
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

  typeWriter(rawText, element, speed = 20) {
    this.isTyping = true;
    element.innerHTML = '';

    const text = this._highlightLore(rawText);

    if (this._typingInterval) clearInterval(this._typingInterval);
    
    this._skipTyping = () => {
        clearInterval(this._typingInterval);
        element.innerHTML = text;
        this.isTyping = false;
        this._typingInterval = null;
        this._speakText(rawText);
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        this.showOptions();
    };

    const container = element.parentElement;
    if (container) {
        container.onclick = (e) => {
            // Only skip typing if clicking directly on the text area, not on option buttons
            if (this.isTyping && this._skipTyping && !e.target.closest('.pro-option')) {
                this._skipTyping();
                this.playSfx();
            }
        };
        container.style.cursor = 'pointer';
    }

    // Show options dimmed while typing so player knows they exist
    const optionsContainer = document.getElementById('options-container');
    if (optionsContainer) optionsContainer.classList.add('options-typing');

    let i = 0;
    this._typingInterval = setInterval(() => {
      if (i < text.length) {
        if (text.charAt(i) === '<') {
            const closingIdx = text.indexOf('>', i);
            if (closingIdx !== -1) i = closingIdx + 1;
        } else {
            i++;
        }
        element.innerHTML = text.substring(0, i);
      } else {
        clearInterval(this._typingInterval);
        this.isTyping = false;
        this._typingInterval = null;
        this._speakText(rawText);
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

  _triggerDamage() {
      const app = document.getElementById('app');
      if (app) {
          app.classList.add('shake', 'damage-flash');
          setTimeout(() => app.classList.remove('shake', 'damage-flash'), 500);
      }
      if (!this.gameState.musicEnabled) return;
      try {
          const actx = window.AudioContext || window.webkitAudioContext;
          if (!this.actx) this.actx = new actx();
          const osc = this.actx.createOscillator();
          const gain = this.actx.createGain();
          osc.connect(gain); gain.connect(this.actx.destination);
          osc.type = 'sawtooth'; osc.frequency.setValueAtTime(80, this.actx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(10, this.actx.currentTime + 0.3);
          gain.gain.setValueAtTime(0.5, this.actx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, this.actx.currentTime + 0.3);
          osc.start(); osc.stop(this.actx.currentTime + 0.3);
      } catch(e){}
  }

  _getVignetteClass() {
      const indoors = ['despacho', 'despacho_notas', 'bodegas', 'taberna', 'taberna_intro', 'taberna_posadero', 'convento_intro', 'convento_mensaje', 'iglesia_intro', 'iglesia_tumbas', 'madrid_consejo', 'madrid_felipe_ii', 'san_martin_camarote'];
      return indoors.includes(this.currentState) ? 'fx-candle' : '';
  }

  _getVfxLayer() {
      const smokeNodes = ['azores_batalla', 'lisboa_incendio', 'bodega_polvora'];
      return smokeNodes.includes(this.currentState) ? '<div class="fx-smoke"></div>' : '';
  }

  isMapAvailable() {
      // Map only available in Act 1 (El Viso)
      const act1Nodes = ['patio', 'despacho', 'calles_intro', 'convento_intro', 'iglesia_intro', 'escalera', 'bodegas', 'taberna_intro', 'plaza_mercado'];
      return act1Nodes.includes(this.currentState);
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
    
    this._checkCinematicMode();
    this._checkAchievements();

    if (node.type !== 'gameover' && !node.video) {
        this.saveGame();
    }

    let nextTrack = 'act1';
    if (this.currentState.startsWith('madrid_')) nextTrack = 'act2';
    if (this.currentState.startsWith('lisboa_') || this.currentState.startsWith('azores_') || this.currentState.startsWith('san_martin_') || this.currentState.startsWith('victoria_') || this.currentState.startsWith('final_')) nextTrack = 'act3';
    
    // Determine act label for HUD
    this._currentActLabel = nextTrack === 'act1' ? 'Acto I · El Viso' : nextTrack === 'act2' ? 'Acto II · Madrid' : 'Acto III · Lisboa';
    
    if (nextTrack !== this.currentTrack) {
       this.currentTrack = nextTrack;
       const wasPlaying = !this.audio.paused && this.gameState.musicEnabled;
       this.audio.src = this.tracks[this.currentTrack];
       if (wasPlaying) {
           this.audio.play().catch(e => console.warn("Track change autoplay block:", e));
       }
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

    // Bug fix #3: apply node-level impact (not tied to an option click)
    if (node.impact && !node._impactApplied) {
        node._impactApplied = true;
        if (node.impact.royalFavor) this.gameState.royalFavor = Math.min(100, Math.max(0, this.gameState.royalFavor + node.impact.royalFavor));
        if (node.impact.armadaReadiness) this.gameState.armadaReadiness = Math.min(100, Math.max(0, this.gameState.armadaReadiness + node.impact.armadaReadiness));
        if (node.impact.days) this.gameState.daysRemaining = Math.max(0, this.gameState.daysRemaining + node.impact.days);
    }

    this.container.innerHTML = `
      <div class="pro-container scene-fade-in">
        <div class="background-blur" style="background-image: url('${node.image || ''}')"></div>
        <div class="background-art" style="background-image: url('${node.image || ''}')"></div>
        <div class="vignette"></div>

        <div class="status-dashboard">
          <div class="act-label">${this._currentActLabel || 'Acto I · El Viso'}</div>
          <div class="status-item">
            <span class="status-label">Días</span>
            <span class="status-value ${this.gameState.daysRemaining <= 5 ? 'urgency-flash' : ''}" style="font-size: 1.5rem; font-weight: bold; color: ${this.gameState.daysRemaining <= 5 ? '#ff4444' : 'var(--gold)'}; text-shadow: 0 0 5px rgba(0,0,0,0.8);">${this.gameState.daysRemaining}</span>
          </div>
          <div class="status-item">
            <span class="status-label">Favor Real</span>
            <div class="status-bar-container">
              <div id="bar-favor" class="status-bar favor" style="width: ${this.gameState.royalFavor}%">${this.gameState.royalFavor}%</div>
            </div>
          </div>
          <div class="status-item">
            <span class="status-label">Estado Armada</span>
            <div class="status-bar-container">
              <div id="bar-armada" class="status-bar armada" style="width: ${this.gameState.armadaReadiness}%">${this.gameState.armadaReadiness}%</div>
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
          <button id="btn-hud-tts" class="map-btn" style="margin-left: 0.5rem; width: 50px;" title="Narrador">${this.ttsEnabled ? '🗣️' : '🤫'}</button>
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
                <button class="nav-loc ${this.currentState === 'calles_intro' ? 'active' : ''}" data-node="calles_intro">Calles de Viso</button>
                <button class="nav-loc ${this.currentState === 'convento_intro' ? 'active' : ''}" data-node="convento_intro">El Convento</button>
                <button class="nav-loc ${this.currentState === 'iglesia_intro' ? 'active' : ''}" data-node="iglesia_intro">La Iglesia</button>
              </div>
              <button id="close-map" class="close-btn">Cerrar</button>
           </div>
        </div>

        <div class="title-footer">
          <span>Palacio de Viso del Marqués · Siglo XVI</span>
          <a href="https://jcgm.dev" target="_blank" class="copyright-link">© 2026 JCGM.DEV</a>
        </div>
      </div>
    `;

    const textElement = document.getElementById('story-text');
    this.typeWriter(node.text, textElement);
    this.setupNavEvents();

    // Animate stat bars if there was an impact
    if (this._pendingImpact) {
      const { prev, impact } = this._pendingImpact;
      this._pendingImpact = null;
      requestAnimationFrame(() => this._animateStatBars(prev, impact));
    }
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

    const ttsBtn = document.getElementById('btn-hud-tts');
    if (ttsBtn) ttsBtn.addEventListener('click', () => this.toggleTts());
  }

  showOptions() {
    const node = this.storyData.nodes[this.currentState];
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.classList.remove('hidden');
    optionsContainer.classList.remove('options-typing');

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
          // Support: "!hasItem:ItemName" and "hasItem:ItemName"
          if (opt.condition.startsWith('!hasItem:')) {
            const item = opt.condition.replace('!hasItem:', '');
            if (this.gameState.inventory.includes(item)) return false;
          } else if (opt.condition.startsWith('hasItem:')) {
            const item = opt.condition.replace('hasItem:', '');
            if (!this.gameState.inventory.includes(item)) return false;
          } else {
            const [variable, operator, value] = opt.condition.split(' ');
            const varValue = this.gameState[variable];
            const numValue = parseInt(value);
            if (operator === '>') if (!(varValue > numValue)) return false;
            if (operator === '<') if (!(varValue < numValue)) return false;
            if (operator === '>=') if (!(varValue >= numValue)) return false;
            if (operator === '<=') if (!(varValue <= numValue)) return false;
          }
        } catch (e) {}
      }

      // Item requirement check
      if (opt.requireItem && !this.gameState.inventory.includes(opt.requireItem)) {
        return false;
      }

      return true;
    });

    if (node.type === 'gameover') {
      const isHappyEnding = this.currentState === 'final_despedida';
      if (!isHappyEnding) {
        this.audio.pause();
        this._triggerDamage();
      }
      optionsContainer.innerHTML = `
        <button class="pro-option game-over-btn" id="btn-restart-game">
          <span class="opt-text">${isHappyEnding ? '⚓ VOLVER AL INICIO' : 'REINICIAR TODO'}</span>
        </button>
      `;
      if (!isHappyEnding && localStorage.getItem('elsenormares_save')) {
          optionsContainer.innerHTML += `
            <button class="pro-option" id="btn-load-game" style="background:var(--gold); color:#000; justify-content:center;">
              <span class="opt-text">CARGAR ÚLTIMO PUNTO</span>
            </button>
          `;
      }
      
      requestAnimationFrame(() => {
          document.getElementById('btn-restart-game').addEventListener('click', () => this._restartFullGame());
          const loadBtn = document.getElementById('btn-load-game');
          if (loadBtn) loadBtn.addEventListener('click', () => { window.location.reload(); });
      });
      return;
    }  optionsContainer.innerHTML = availableOptions.map((opt, index) => `
        <button class="pro-option" data-next="${opt.nextNode}" data-impact='${JSON.stringify(opt.impact || {})}'>
          <span class="opt-num">${index + 1}</span>
          <span class="opt-text">${opt.text}</span>
        </button>
      `).join('');

    // Show locked options as hints (items required but not owned)
    const lockedOptions = node.options.filter(opt => {
      if (opt.singleUse && this.gameState.usedOptions && this.gameState.usedOptions.includes(opt.text)) return false;
      if (opt.requireItem && !this.gameState.inventory.includes(opt.requireItem)) return true;
      return false;
    });
    if (lockedOptions.length > 0) {
      optionsContainer.innerHTML += lockedOptions.map(opt => `
        <button class="pro-option locked-option" disabled>
          <span class="opt-num">🔒</span>
          <span class="opt-text">${opt.text} <em style="font-size:0.85em; opacity:0.6;">(Necesitas: ${opt.requireItem})</em></span>
        </button>
      `).join('');
    }

    this.bindEvents();
  }

  bindEvents() {
    const buttons = this.container.querySelectorAll('.pro-option');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.isTyping) {
          // Skip typing animation and let the click proceed
          if (this._skipTyping) this._skipTyping();
        }

        // Contextual SFX based on action type
        const impact = JSON.parse(btn.dataset.impact || '{}');
        let sfxType = 'click';
        if (opt?.collectItem) {
          sfxType = (opt.collectItem.includes('Oro') || opt.collectItem.includes('Bolsa')) ? 'gold' : 'item';
        } else if (opt?.requireItem) {
          sfxType = 'scroll';
        } else if (impact.royalFavor < 0 || impact.armadaReadiness < 0) {
          sfxType = 'negative';
        }
        this.playSfx(sfxType);
        
        const node = this.storyData.nodes[this.currentState];
        const nextNodeId = btn.dataset.next;
        const opt = node.options.find(o => o.nextNode === nextNodeId);

        this._applyImpactAnimated(impact);
        if (this.gameState.daysRemaining <= 0 && nextNodeId !== 'gameover' && !nextNodeId.startsWith('final_')) {
            this.currentState = 'gameover_tiempo';
            this.render();
            return;
        }
        
        // Single use logic
        if (opt && opt.singleUse) {
          if (!this.gameState.usedOptions) this.gameState.usedOptions = [];
          this.gameState.usedOptions.push(opt.text);
        }

        // Collection logic
        if (opt && opt.collectItem && !this.gameState.inventory.includes(opt.collectItem)) {
          this.gameState.inventory.push(opt.collectItem);
        }

        this.currentState = this._resolveEnding(nextNodeId);
        this.render();
      });
    });
  }

  _resolveEnding(nextNodeId) {
    // Multiple endings based on stats when reaching final_logic
    if (nextNodeId !== 'final_logic') return nextNodeId;
    const { royalFavor, armadaReadiness, inventory } = this.gameState;
    const hasPolvora = inventory.includes('Pólvora Superior');
    // Glorious victory: high favor + high armada + gunpowder
    if (royalFavor >= 70 && armadaReadiness >= 75 && hasPolvora) {
      return 'final_victoria_total';
    }
    // Pyrrhic victory: won but at great cost
    if (armadaReadiness < 50 || royalFavor < 40) {
      return 'final_victoria_pírrica';
    }
    // Standard good ending
    return 'final_logic';
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
        this.playSfx('scroll');
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
          this.playSfx('sword');
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
          if (rolls > 12) {
            clearInterval(interval);
            const finalVal = Math.floor(Math.random() * 6) + 1;
            diceRes.innerText = finalVal;
            setTimeout(() => this.checkPuzzleResult(finalVal >= puzzle.target, puzzle), 600);
          }
        }, 80);
      });
    }
  }

  checkPuzzleResult(success, puzzle) {
    if (success) {
      this.currentState = this._resolveEnding(puzzle.successNode);
    } else {
      if (puzzle.failImpact) {
        if (puzzle.failImpact.royalFavor) this.gameState.royalFavor = Math.max(0, this.gameState.royalFavor + puzzle.failImpact.royalFavor);
        if (puzzle.failImpact.armadaReadiness) this.gameState.armadaReadiness = Math.max(0, this.gameState.armadaReadiness + puzzle.failImpact.armadaReadiness);
        if (puzzle.failImpact.days) this.gameState.daysRemaining = Math.max(0, this.gameState.daysRemaining + puzzle.failImpact.days);
      }
      if (this.gameState.daysRemaining <= 0) {
          this.currentState = 'gameover_tiempo';
      } else {
          this.currentState = puzzle.failNode;
      }
    }
    this.render();
  }

  _applyImpactAnimated(impact) {
    if (!impact || Object.keys(impact).length === 0) return;
    const prev = {
      royalFavor: this.gameState.royalFavor,
      armadaReadiness: this.gameState.armadaReadiness,
      daysRemaining: this.gameState.daysRemaining
    };
    if (impact.royalFavor) this.gameState.royalFavor = Math.min(100, Math.max(0, this.gameState.royalFavor + impact.royalFavor));
    if (impact.armadaReadiness) this.gameState.armadaReadiness = Math.min(100, Math.max(0, this.gameState.armadaReadiness + impact.armadaReadiness));
    if (impact.days) this.gameState.daysRemaining = Math.max(0, this.gameState.daysRemaining + impact.days);

    if (impact.royalFavor < 0 || impact.armadaReadiness < 0 || (impact.days && impact.days < 0)) {
      this._triggerDamage();
    }

    // Animate bars after render (called via requestAnimationFrame in render)
    this._pendingImpact = { prev, impact };
  }

  _animateStatBars(prev, impact) {
    const animateBar = (barId, delta) => {
      const bar = document.getElementById(barId);
      if (!bar) return;
      const dir = delta > 0 ? 'positive' : 'negative';
      bar.classList.add(delta > 0 ? 'stat-up' : 'stat-down');
      setTimeout(() => bar.classList.remove('stat-up', 'stat-down'), 900);

      const delta_el = document.createElement('span');
      delta_el.className = `stat-delta ${dir}`;
      delta_el.textContent = (delta > 0 ? '+' : '') + delta;
      bar.parentElement.parentElement.style.position = 'relative';
      bar.parentElement.parentElement.appendChild(delta_el);
      setTimeout(() => delta_el.remove(), 1300);
    };

    if (impact.royalFavor) animateBar('bar-favor', impact.royalFavor);
    if (impact.armadaReadiness) animateBar('bar-armada', impact.armadaReadiness);
  }

  _renderAchievementsList() {
    const ALL_ACHIEVEMENTS = [
      { id: 'coleccionista',    icon: '🎒', label: 'El Coleccionista',           hint: 'Recoge 5 objetos' },
      { id: 'favorito_rey',     icon: '👑', label: 'Favorito del Rey',            hint: 'Favor Real al 90%' },
      { id: 'armada_lista',     icon: '⚓', label: 'Armada Invencible',           hint: 'Armada al 90%' },
      { id: 'veloz',            icon: '⚡', label: 'Veloz como el Rayo',          hint: 'Llega a Madrid con 10+ días' },
      { id: 'gloria_total',     icon: '🌟', label: 'Gloria Eterna',               hint: 'Consigue el final glorioso' },
      { id: 'victoria_amarga',  icon: '⚔️', label: 'Victoria Amarga',             hint: 'Consigue el final agridulce' },
      { id: 'cazaespias',       icon: '🕵️', label: 'Cazaespías',                  hint: 'Interroga al agente inglés' },
      { id: 'espadachin',       icon: '🗡️', label: 'Espadachín del Escorial',     hint: 'Gana el duelo en Madrid' },
      { id: 'preparado',        icon: '📋', label: 'Perfectamente Preparado',     hint: 'Lleva Pólvora, Lista y Orden Real' },
      { id: 'red_rota',         icon: '🕸️', label: 'Red Rota',                    hint: 'Descubre al traidor en Lisboa' },
    ];
    const unlocked = this._getAchievements();
    return `<div class="achv-list">${ALL_ACHIEVEMENTS.map(a => {
      const done = unlocked.includes(a.id);
      return `<div class="achv-item ${done ? '' : 'locked'}">
        <span style="font-size:1.3rem">${done ? a.icon : '🔒'}</span>
        <span style="margin-left:0.5rem"><strong>${done ? a.label : '???'}</strong><br>
        <small style="opacity:0.6">${done ? a.hint : 'Sin desbloquear'}</small></span>
      </div>`;
    }).join('')}</div>`;
  }

  _restartFullGame() {
    localStorage.removeItem('elsenormares_save');
    this.gameState = {
      royalFavor: 45,
      armadaReadiness: 30,
      daysRemaining: 13,
      inventory: [],
      visitedRooms: ['patio'],
      musicEnabled: this.gameState.musicEnabled
    };
    this.currentState = this.startNode;
    this.currentTrack = 'act1';
    this.audio.src = this.tracks.act1;
    if (this.gameState.musicEnabled) this.audio.play().catch(e => {});
    this.showTitleScreen();
  }

  // ── ACHIEVEMENTS ──────────────────────────────────────────────
  _getAchievements() {
    return JSON.parse(localStorage.getItem('elsenormares_achv') || '[]');
  }

  _unlockAchievement(id, label, icon) {
    const achieved = this._getAchievements();
    if (achieved.includes(id)) return;
    achieved.push(id);
    localStorage.setItem('elsenormares_achv', JSON.stringify(achieved));
    this._showAchievementToast(label, icon);
  }

  _showAchievementToast(label, icon) {
    const toast = document.createElement('div');
    toast.className = 'achv-toast';
    toast.innerHTML = `${icon} <strong>Logro desbloqueado:</strong> ${label}`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 600); }, 3500);
  }

  _checkAchievements() {
    const { royalFavor, armadaReadiness, daysRemaining, inventory } = this.gameState;
    const node = this.currentState;

    if (inventory.length >= 5) this._unlockAchievement('coleccionista', 'El Coleccionista', '🎒');
    if (royalFavor >= 90) this._unlockAchievement('favorito_rey', 'Favorito del Rey', '👑');
    if (armadaReadiness >= 90) this._unlockAchievement('armada_lista', 'Armada Invencible', '⚓');
    if (daysRemaining >= 10 && node.startsWith('madrid_')) this._unlockAchievement('veloz', 'Veloz como el Rayo', '⚡');
    if (node === 'final_victoria_total') this._unlockAchievement('gloria_total', 'Gloria Eterna', '🌟');
    if (node === 'final_victoria_pírrica') this._unlockAchievement('victoria_amarga', 'Victoria Amarga', '⚔️');
    if (node === 'espia_interrogatorio') this._unlockAchievement('cazaespias', 'Cazaespías', '🕵️');
    if (node === 'madrid_duelo_victoria') this._unlockAchievement('espadachin', 'Espadachín del Escorial', '🗡️');
    if (inventory.includes('Pólvora Superior') && inventory.includes('Lista de Traidores') && inventory.includes('Orden Real')) {
      this._unlockAchievement('preparado', 'Perfectamente Preparado', '📋');
    }
    if (node === 'lisboa_alfama_traidor') this._unlockAchievement('red_rota', 'Red Rota', '🕸️');
  }
}

// Cinematic Engine v2.1 - RPG Expansion Ready
