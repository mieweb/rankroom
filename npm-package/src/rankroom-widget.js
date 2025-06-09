class RankRoomWidget {
  constructor(options = {}) {
    this.options = {
      serverUrl: options.serverUrl || 'http://localhost:3000',
      containerId: options.containerId || 'rankroom-widget',
      theme: options.theme || 'default',
      mode: options.mode || '3-phase', // '3-phase' or 'voting' for backward compatibility
      ...options
    };
    
    this.container = null;
    this.socket = null;
    this.currentTopic = null;
    this.currentUser = null;
    this.selectedCandidate = null;
  }

  // Initialize the widget
  init() {
    this.container = document.getElementById(this.options.containerId);
    if (!this.container) {
      throw new Error(`Container element with ID "${this.options.containerId}" not found`);
    }

    this.loadStyles();
    this.setupSocketConnection();
    this.render();
  }

  // Load widget styles
  loadStyles() {
    const styles = `
      .rankroom-widget {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 20px;
        background: white;
        max-width: 800px;
      }
      .rr-header { margin-bottom: 20px; }
      .rr-title { margin: 0 0 10px 0; font-size: 18px; font-weight: 600; }
      .rr-description { color: #6c757d; margin: 0; }
      .rr-phase-indicator {
        background: #f8f9fa; padding: 10px; border-radius: 4px;
        margin-bottom: 20px; font-size: 14px;
      }
      .rr-phase-progress {
        background: #e9ecef; height: 8px; border-radius: 4px; margin: 10px 0;
      }
      .rr-phase-bar {
        height: 100%; border-radius: 4px; transition: width 0.3s ease;
      }
      .rr-phase-1 { background: #007bff; }
      .rr-phase-2 { background: #ffc107; }
      .rr-phase-3 { background: #28a745; }
      .rr-form { margin-bottom: 20px; }
      .rr-input, .rr-select, .rr-textarea {
        width: 100%; padding: 8px 12px; border: 1px solid #ced4da;
        border-radius: 4px; margin-bottom: 10px; font-size: 14px;
        box-sizing: border-box;
      }
      .rr-button {
        background: #007bff; color: white; border: none; padding: 8px 16px;
        border-radius: 4px; cursor: pointer; font-size: 14px; margin-right: 8px;
      }
      .rr-button:hover { background: #0056b3; }
      .rr-button:disabled { background: #6c757d; cursor: not-allowed; }
      .rr-button-success { background: #28a745; }
      .rr-button-success:hover { background: #1e7e34; }
      .rr-button-warning { background: #ffc107; color: #212529; }
      .rr-button-warning:hover { background: #e0a800; }
      .rr-criteria-list, .rr-candidate-list { margin-bottom: 20px; }
      .rr-criterion-item, .rr-candidate-item {
        padding: 12px; border: 1px solid #e9ecef; border-radius: 4px;
        margin-bottom: 8px; background: #f8f9fa;
      }
      .rr-candidate-item.selected {
        border-color: #007bff; background: #e7f3ff;
      }
      .rr-candidate-item:hover { cursor: pointer; background: #f0f8ff; }
      .rr-criterion-name { font-weight: 600; margin-bottom: 4px; }
      .rr-criterion-desc { font-size: 12px; color: #6c757d; margin-bottom: 8px; }
      .rr-shared-badge {
        background: #28a745; color: white; padding: 2px 6px;
        border-radius: 10px; font-size: 10px; font-weight: 600;
      }
      .rr-evaluation-form { margin-top: 20px; }
      .rr-criterion-eval {
        padding: 15px; border: 1px solid #e9ecef; border-radius: 4px;
        margin-bottom: 15px; background: #f8f9fa;
      }
      .rr-score-input {
        width: 100%; margin: 10px 0;
      }
      .rr-score-display {
        text-align: center; font-weight: 600; color: #007bff;
        margin: 5px 0; font-size: 18px;
      }
      .rr-results-table {
        width: 100%; border-collapse: collapse; margin-top: 20px;
      }
      .rr-results-table th, .rr-results-table td {
        padding: 8px 12px; text-align: left; border-bottom: 1px solid #dee2e6;
      }
      .rr-results-table th { background: #f8f9fa; font-weight: 600; }
      .rr-rank-badge {
        background: #007bff; color: white; padding: 4px 8px;
        border-radius: 12px; font-size: 12px; font-weight: 600;
      }
      .rr-score-badge {
        background: #28a745; color: white; padding: 2px 6px;
        border-radius: 10px; font-size: 11px; font-weight: 600;
      }
      .rr-loading { text-align: center; padding: 40px; color: #6c757d; }
      .rr-error { color: #dc3545; padding: 10px; background: #f8d7da; border-radius: 4px; }
      .rr-participants {
        background: #f8f9fa; padding: 10px; border-radius: 4px; margin-bottom: 20px;
      }
      .rr-participant-badge {
        background: #6c757d; color: white; padding: 2px 6px;
        border-radius: 10px; font-size: 11px; margin-right: 5px;
      }
      .rr-participant-badge.leader { background: #007bff; }
      .rr-two-column { display: flex; gap: 20px; }
      .rr-column { flex: 1; }
      @media (max-width: 768px) {
        .rr-two-column { flex-direction: column; }
      }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  // Setup Socket.IO connection for real-time updates
  setupSocketConnection() {
    if (typeof io !== 'undefined') {
      this.socket = io(this.options.serverUrl);
      
      this.socket.on('topicUpdated', (data) => {
        if (data.topicId === this.currentTopic?._id) {
          this.refreshTopic();
        }
      });

      this.socket.on('criteriaUpdated', (data) => {
        if (data.topicId === this.currentTopic?._id) {
          this.refreshTopic();
        }
      });

      this.socket.on('candidateUpdated', (data) => {
        if (data.topicId === this.currentTopic?._id) {
          this.refreshTopic();
        }
      });
    }
  }

  // Render the widget
  render() {
    if (!this.currentUser) {
      this.renderLogin();
    } else if (!this.currentTopic) {
      this.renderCreateTopic();
    } else {
      this.renderTopic();
    }
  }

  // Render login form
  renderLogin() {
    this.container.innerHTML = `
      <div class="rankroom-widget">
        <div class="rr-header">
          <h3 class="rr-title">Welcome to RankRoom</h3>
          <p class="rr-description">3-Phase Collaborative Decision Making</p>
        </div>
        
        <form class="rr-form" id="rr-login-form">
          <input type="text" class="rr-input" placeholder="Your name" required id="rr-name">
          <input type="email" class="rr-input" placeholder="Email address" required id="rr-email">
          <button type="submit" class="rr-button">Get Started</button>
        </form>
        
        <div style="margin-top: 20px; font-size: 12px; color: #6c757d;">
          <strong>3-Phase Process:</strong><br>
          1. Definition - Define criteria<br>
          2. Collection - Evaluate candidates<br>
          3. Decision - Analyze results
        </div>
      </div>
    `;

    const form = this.container.querySelector('#rr-login-form');
    form.addEventListener('submit', (e) => this.handleLogin(e));
  }

  // Render topic creation form
  renderCreateTopic() {
    this.container.innerHTML = `
      <div class="rankroom-widget">
        <div class="rr-header">
          <h3 class="rr-title">Create Decision Topic</h3>
          <p class="rr-description">Start a 3-phase collaborative decision process</p>
        </div>
        
        <form class="rr-form" id="rr-create-form">
          <input type="text" class="rr-input" placeholder="Topic name" required id="rr-name">
          <textarea class="rr-textarea" placeholder="Description (optional)" rows="3" id="rr-description"></textarea>
          <button type="submit" class="rr-button">Create Topic</button>
        </form>
        
        <div style="margin-top: 20px;">
          <p><strong>Current User:</strong> ${this.currentUser.name}</p>
        </div>
      </div>
    `;

    const form = this.container.querySelector('#rr-create-form');
    form.addEventListener('submit', (e) => this.handleCreateTopic(e));
  }

  // Render active topic
  renderTopic() {
    const topic = this.currentTopic;
    const phaseNames = { 1: 'Definition', 2: 'Collection', 3: 'Decision' };
    const currentPhaseName = phaseNames[topic.currentPhase];
    const progress = (topic.currentPhase / 3) * 100;
    const isLeader = topic.createdBy === this.currentUser._id;
    
    this.container.innerHTML = `
      <div class="rankroom-widget">
        <div class="rr-header">
          <h3 class="rr-title">${topic.name}</h3>
          <p class="rr-description">${topic.description}</p>
        </div>

        <div class="rr-phase-indicator">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span><strong>Phase ${topic.currentPhase}:</strong> ${currentPhaseName}</span>
            ${isLeader && topic.currentPhase < 3 ? `
              <button class="rr-button rr-button-success" id="rr-advance-phase">
                Advance to ${phaseNames[topic.currentPhase + 1]}
              </button>
            ` : ''}
          </div>
          <div class="rr-phase-progress">
            <div class="rr-phase-bar rr-phase-${topic.currentPhase}" style="width: ${progress}%"></div>
          </div>
        </div>

        ${this.renderParticipants()}

        <div id="rr-phase-content">
          ${this.renderPhaseContent()}
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  renderParticipants() {
    const topic = this.currentTopic;
    const participants = topic.participants || [];
    
    return `
      <div class="rr-participants">
        <strong>Participants (${participants.length}):</strong>
        ${participants.map(p => `
          <span class="rr-participant-badge ${p._id === topic.createdBy ? 'leader' : ''}">${p.name}${p._id === topic.createdBy ? ' (Leader)' : ''}</span>
        `).join('')}
      </div>
    `;
  }

  renderPhaseContent() {
    const topic = this.currentTopic;
    
    switch (topic.currentPhase) {
      case 1:
        return this.renderDefinitionPhase();
      case 2:
        return this.renderCollectionPhase();
      case 3:
        return this.renderDecisionPhase();
      default:
        return '<div class="rr-error">Invalid phase</div>';
    }
  }

  renderDefinitionPhase() {
    const personalCriteria = this.currentTopic.personalCriteria || [];
    const sharedCriteria = this.currentTopic.sharedCriteria || [];
    
    return `
      <div class="rr-two-column">
        <div class="rr-column">
          <h4>Your Criteria</h4>
          <form class="rr-form" id="rr-criterion-form">
            <input type="text" class="rr-input" placeholder="Criterion name" required id="rr-criterion-name">
            <textarea class="rr-textarea" placeholder="Description (optional)" rows="2" id="rr-criterion-desc"></textarea>
            <label>
              <input type="checkbox" id="rr-criterion-shared"> Share with team
            </label>
            <div style="margin-top: 10px;">
              <button type="submit" class="rr-button">Add Criterion</button>
            </div>
          </form>
          
          <div class="rr-criteria-list">
            ${personalCriteria.map(c => `
              <div class="rr-criterion-item">
                <div class="rr-criterion-name">${c.name}</div>
                <div class="rr-criterion-desc">${c.description}</div>
                ${c.isShared ? '<span class="rr-shared-badge">Shared</span>' : 
                  `<button class="rr-button" onclick="window.rankroomWidget.shareCriterion('${c._id}')">Share</button>`}
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="rr-column">
          <h4>Shared Criteria</h4>
          <div class="rr-criteria-list">
            ${sharedCriteria.map(c => `
              <div class="rr-criterion-item">
                <div class="rr-criterion-name">${c.name}</div>
                <div class="rr-criterion-desc">${c.description}</div>
                <small>by ${c.user?.name || 'Anonymous'}</small>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  renderCollectionPhase() {
    const candidates = this.currentTopic.candidates || [];
    const sharedCriteria = this.currentTopic.sharedCriteria || [];
    
    return `
      <div class="rr-two-column">
        <div class="rr-column">
          <h4>Candidates</h4>
          <form class="rr-form" id="rr-candidate-form">
            <input type="text" class="rr-input" placeholder="Candidate name" required id="rr-candidate-name">
            <textarea class="rr-textarea" placeholder="Description (optional)" rows="2" id="rr-candidate-desc"></textarea>
            <button type="submit" class="rr-button">Add Candidate</button>
          </form>
          
          <div class="rr-candidate-list">
            ${candidates.map(c => `
              <div class="rr-candidate-item ${this.selectedCandidate?._id === c._id ? 'selected' : ''}" 
                   onclick="window.rankroomWidget.selectCandidate('${c._id}')">
                <div class="rr-criterion-name">${c.name}</div>
                <div class="rr-criterion-desc">${c.description}</div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="rr-column">
          <h4>Evaluate Candidate</h4>
          ${this.selectedCandidate ? `
            <h5>Evaluating: ${this.selectedCandidate.name}</h5>
            <form class="rr-evaluation-form" id="rr-evaluation-form">
              ${sharedCriteria.map(c => this.renderCriterionEvaluation(c)).join('')}
              ${sharedCriteria.length > 0 ? '<button type="submit" class="rr-button rr-button-success">Save Evaluations</button>' : ''}
            </form>
          ` : '<p>Select a candidate to start evaluating</p>'}
        </div>
      </div>
    `;
  }

  renderCriterionEvaluation(criterion) {
    const evaluation = this.getEvaluation(criterion._id, this.selectedCandidate?._id);
    const score = evaluation?.score || 5;
    const notes = evaluation?.notes || '';
    
    return `
      <div class="rr-criterion-eval">
        <div class="rr-criterion-name">${criterion.name}</div>
        <div class="rr-criterion-desc">${criterion.description}</div>
        <input type="range" class="rr-score-input" min="1" max="10" value="${score}" 
               data-criterion-id="${criterion._id}" 
               oninput="this.nextElementSibling.textContent = this.value">
        <div class="rr-score-display">${score}</div>
        <textarea class="rr-textarea" placeholder="Notes (optional)" rows="2" 
                  data-criterion-id="${criterion._id}">${notes}</textarea>
      </div>
    `;
  }

  renderDecisionPhase() {
    const results = this.currentTopic.aggregatedResults || [];
    
    return `
      <h4>Decision Results</h4>
      ${results.length > 0 ? `
        <table class="rr-results-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Candidate</th>
              <th>Average Score</th>
              <th>Evaluations</th>
            </tr>
          </thead>
          <tbody>
            ${results.map((result, index) => `
              <tr>
                <td><span class="rr-rank-badge">${index + 1}</span></td>
                <td>
                  <strong>${result.candidate.name}</strong>
                  <div style="font-size: 12px; color: #6c757d;">${result.candidate.description}</div>
                </td>
                <td><span class="rr-score-badge">${result.averageScore.toFixed(1)}</span></td>
                <td>${result.totalEvaluations}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<p>No evaluation data available</p>'}
    `;
  }

  setupEventListeners() {
    // Phase advancement
    const advanceBtn = this.container.querySelector('#rr-advance-phase');
    if (advanceBtn) {
      advanceBtn.addEventListener('click', () => this.handleAdvancePhase());
    }

    // Forms
    const criterionForm = this.container.querySelector('#rr-criterion-form');
    if (criterionForm) {
      criterionForm.addEventListener('submit', (e) => this.handleCreateCriterion(e));
    }

    const candidateForm = this.container.querySelector('#rr-candidate-form');
    if (candidateForm) {
      candidateForm.addEventListener('submit', (e) => this.handleCreateCandidate(e));
    }

    const evaluationForm = this.container.querySelector('#rr-evaluation-form');
    if (evaluationForm) {
      evaluationForm.addEventListener('submit', (e) => this.handleSubmitEvaluations(e));
    }
  }

  // Event handlers
  async handleLogin(event) {
    event.preventDefault();
    
    const name = this.container.querySelector('#rr-name').value.trim();
    const email = this.container.querySelector('#rr-email').value.trim();
    
    try {
      const response = await fetch(`${this.options.serverUrl}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      });
      
      const result = await response.json();
      if (result._id) {
        this.currentUser = result;
        this.render();
      } else {
        throw new Error('Failed to create user');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showError('Failed to login. Please try again.');
    }
  }

  async handleCreateTopic(event) {
    event.preventDefault();
    
    const name = this.container.querySelector('#rr-name').value.trim();
    const description = this.container.querySelector('#rr-description').value.trim();
    
    try {
      const response = await fetch(`${this.options.serverUrl}/api/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          userId: this.currentUser._id
        })
      });
      
      const result = await response.json();
      if (result._id) {
        this.currentTopic = result;
        await this.loadTopicData();
        this.render();
      } else {
        throw new Error('Failed to create topic');
      }
    } catch (error) {
      console.error('Create topic error:', error);
      this.showError('Failed to create topic. Please try again.');
    }
  }

  async handleAdvancePhase() {
    try {
      const response = await fetch(`${this.options.serverUrl}/api/topics/${this.currentTopic._id}/phase`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase: this.currentTopic.currentPhase + 1,
          userId: this.currentUser._id
        })
      });
      
      const result = await response.json();
      if (result.currentPhase) {
        this.currentTopic.currentPhase = result.currentPhase;
        if (this.currentTopic.currentPhase === 3) {
          await this.loadAggregatedResults();
        }
        this.render();
      } else {
        throw new Error(result.message || 'Failed to advance phase');
      }
    } catch (error) {
      console.error('Advance phase error:', error);
      this.showError('Failed to advance phase: ' + error.message);
    }
  }

  async handleCreateCriterion(event) {
    event.preventDefault();
    
    const name = this.container.querySelector('#rr-criterion-name').value.trim();
    const description = this.container.querySelector('#rr-criterion-desc').value.trim();
    const isShared = this.container.querySelector('#rr-criterion-shared').checked;
    
    try {
      const response = await fetch(`${this.options.serverUrl}/api/criteria`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          topicId: this.currentTopic._id,
          userId: this.currentUser._id,
          isShared
        })
      });
      
      const result = await response.json();
      if (result._id) {
        await this.loadTopicData();
        this.render();
      } else {
        throw new Error('Failed to create criterion');
      }
    } catch (error) {
      console.error('Create criterion error:', error);
      this.showError('Failed to create criterion. Please try again.');
    }
  }

  async handleCreateCandidate(event) {
    event.preventDefault();
    
    const name = this.container.querySelector('#rr-candidate-name').value.trim();
    const description = this.container.querySelector('#rr-candidate-desc').value.trim();
    
    try {
      const response = await fetch(`${this.options.serverUrl}/api/candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          topicId: this.currentTopic._id,
          userId: this.currentUser._id
        })
      });
      
      const result = await response.json();
      if (result._id) {
        await this.loadTopicData();
        this.render();
      } else {
        throw new Error('Failed to create candidate');
      }
    } catch (error) {
      console.error('Create candidate error:', error);
      this.showError('Failed to create candidate. Please try again.');
    }
  }

  async handleSubmitEvaluations(event) {
    event.preventDefault();
    
    const ranges = this.container.querySelectorAll('.rr-score-input');
    const textareas = this.container.querySelectorAll('.rr-evaluation-form textarea');
    
    try {
      for (let i = 0; i < ranges.length; i++) {
        const criterionId = ranges[i].getAttribute('data-criterion-id');
        const score = parseInt(ranges[i].value);
        const notes = textareas[i].value.trim();
        
        await fetch(`${this.options.serverUrl}/api/evaluations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: this.currentUser._id,
            candidateId: this.selectedCandidate._id,
            criterionId,
            score,
            notes
          })
        });
      }
      
      this.showSuccess('Evaluations saved successfully!');
    } catch (error) {
      console.error('Submit evaluations error:', error);
      this.showError('Failed to save evaluations. Please try again.');
    }
  }

  // Helper methods
  async loadTopicData() {
    try {
      // Load topic details
      const topicResponse = await fetch(`${this.options.serverUrl}/api/topics/${this.currentTopic._id}`);
      const topic = await topicResponse.json();
      
      // Load criteria
      const criteriaResponse = await fetch(`${this.options.serverUrl}/api/criteria/topic/${this.currentTopic._id}`);
      const allCriteria = await criteriaResponse.json();
      
      // Load candidates
      const candidatesResponse = await fetch(`${this.options.serverUrl}/api/candidates/topic/${this.currentTopic._id}`);
      const candidates = await candidatesResponse.json();
      
      // Load evaluations
      const evaluationsResponse = await fetch(`${this.options.serverUrl}/api/evaluations/user/${this.currentUser._id}/topic/${this.currentTopic._id}`);
      const evaluations = await evaluationsResponse.json();
      
      // Organize data
      this.currentTopic = {
        ...topic,
        personalCriteria: allCriteria.filter(c => c.user === this.currentUser._id),
        sharedCriteria: allCriteria.filter(c => c.isShared),
        candidates: candidates,
        evaluations: evaluations
      };
      
      if (this.currentTopic.currentPhase === 3) {
        await this.loadAggregatedResults();
      }
      
    } catch (error) {
      console.error('Load topic data error:', error);
      this.showError('Failed to load topic data.');
    }
  }

  async loadAggregatedResults() {
    try {
      const response = await fetch(`${this.options.serverUrl}/api/evaluations/aggregated/topic/${this.currentTopic._id}`);
      const results = await response.json();
      
      this.currentTopic.aggregatedResults = results.map(r => ({
        candidate: r.candidate,
        averageScore: r.averageScore,
        totalEvaluations: r.criteriaScores.reduce((sum, cs) => sum + cs.evaluationCount, 0)
      })).sort((a, b) => b.averageScore - a.averageScore);
      
    } catch (error) {
      console.error('Load aggregated results error:', error);
    }
  }

  selectCandidate(candidateId) {
    this.selectedCandidate = this.currentTopic.candidates.find(c => c._id === candidateId);
    this.render();
  }

  async shareCriterion(criterionId) {
    try {
      const response = await fetch(`${this.options.serverUrl}/api/criteria/${criterionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isShared: true })
      });
      
      if (response.ok) {
        await this.loadTopicData();
        this.render();
      }
    } catch (error) {
      console.error('Share criterion error:', error);
      this.showError('Failed to share criterion.');
    }
  }

  getEvaluation(criterionId, candidateId) {
    if (!this.currentTopic.evaluations) return null;
    return this.currentTopic.evaluations.find(e => 
      e.criterion === criterionId && e.candidate === candidateId
    );
  }

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'rr-error';
    errorDiv.textContent = message;
    this.container.prepend(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
  }

  showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'rr-error';
    successDiv.style.background = '#d4edda';
    successDiv.style.color = '#155724';
    successDiv.textContent = message;
    this.container.prepend(successDiv);
    setTimeout(() => successDiv.remove(), 3000);
  }

  refreshTopic() {
    if (this.currentTopic) {
      this.loadTopicData().then(() => this.render());
    }
  }

  // Static factory method
  static create(options) {
    const widget = new RankRoomWidget(options);
    widget.init();
    
    // Make widget globally accessible for event handlers
    window.rankroomWidget = widget;
    
    return widget;
  }

  // Destroy widget
  destroy() {
    if (this.socket) {
      this.socket.disconnect();
    }
    if (this.container) {
      this.container.innerHTML = '';
    }
    if (window.rankroomWidget === this) {
      delete window.rankroomWidget;
    }
  }
// Export for use in different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RankRoomWidget;
} else if (typeof window !== 'undefined') {
  window.RankRoomWidget = RankRoomWidget;
}

export default RankRoomWidget;