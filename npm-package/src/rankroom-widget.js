class RankRoomWidget {
  constructor(options = {}) {
    this.options = {
      serverUrl: options.serverUrl || 'http://localhost:3000',
      containerId: options.containerId || 'rankroom-widget',
      theme: options.theme || 'default',
      ...options
    };
    
    this.container = null;
    this.socket = null;
    this.currentRoom = null;
    this.currentUser = null;
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
        max-width: 600px;
      }
      .rr-header { margin-bottom: 20px; }
      .rr-title { margin: 0 0 10px 0; font-size: 18px; font-weight: 600; }
      .rr-description { color: #6c757d; margin: 0; }
      .rr-form { margin-bottom: 20px; }
      .rr-input, .rr-select, .rr-textarea {
        width: 100%; padding: 8px 12px; border: 1px solid #ced4da;
        border-radius: 4px; margin-bottom: 10px; font-size: 14px;
      }
      .rr-button {
        background: #007bff; color: white; border: none; padding: 8px 16px;
        border-radius: 4px; cursor: pointer; font-size: 14px;
      }
      .rr-button:hover { background: #0056b3; }
      .rr-button:disabled { background: #6c757d; cursor: not-allowed; }
      .rr-idea-list { list-style: none; padding: 0; margin: 0; }
      .rr-idea-item {
        padding: 12px; border: 1px solid #e9ecef; border-radius: 4px;
        margin-bottom: 8px; display: flex; justify-content: space-between;
        align-items: center;
      }
      .rr-vote-count {
        background: #28a745; color: white; padding: 4px 8px;
        border-radius: 12px; font-size: 12px; font-weight: 600;
      }
      .rr-vote-btn {
        background: #17a2b8; color: white; border: none;
        padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;
      }
      .rr-vote-btn:hover { background: #138496; }
      .rr-loading { text-align: center; padding: 40px; color: #6c757d; }
      .rr-error { color: #dc3545; padding: 10px; background: #f8d7da; border-radius: 4px; }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  // Setup Socket.IO connection for real-time updates
  setupSocketConnection() {
    if (typeof io !== 'undefined') {
      this.socket = io(this.options.serverUrl);
      
      this.socket.on('ideaAdded', (data) => {
        if (data.roomId === this.currentRoom?._id) {
          this.refreshIdeas();
        }
      });

      this.socket.on('voteAdded', (data) => {
        if (data.roomId === this.currentRoom?._id) {
          this.refreshIdeas();
        }
      });
    }
  }

  // Render the widget
  render() {
    if (!this.currentRoom) {
      this.renderCreateRoom();
    } else {
      this.renderRoom();
    }
  }

  // Render room creation form
  renderCreateRoom() {
    this.container.innerHTML = `
      <div class="rankroom-widget">
        <div class="rr-header">
          <h3 class="rr-title">Create Decision Room</h3>
          <p class="rr-description">Start a collaborative voting session</p>
        </div>
        
        <form class="rr-form" id="rr-create-form">
          <input type="text" class="rr-input" placeholder="Room title" required id="rr-title">
          <textarea class="rr-textarea" placeholder="Description (optional)" id="rr-description"></textarea>
          
          <select class="rr-select" id="rr-voting-system">
            <option value="dot-voting">Dot Voting</option>
            <option value="first-past-the-post">First Past the Post</option>
            <option value="alternative-voting">Alternative Voting</option>
          </select>
          
          <input type="number" class="rr-input" placeholder="Votes per participant" value="3" min="1" id="rr-votes">
          
          <button type="submit" class="rr-button">Create Room</button>
        </form>
      </div>
    `;

    const form = this.container.querySelector('#rr-create-form');
    form.addEventListener('submit', (e) => this.handleCreateRoom(e));
  }

  // Render active room
  renderRoom() {
    const room = this.currentRoom;
    const ideas = room.ideas || [];
    
    this.container.innerHTML = `
      <div class="rankroom-widget">
        <div class="rr-header">
          <h3 class="rr-title">${room.title}</h3>
          <p class="rr-description">${room.description}</p>
          <small>Voting System: ${room.votingSystem} • ${room.votesPerParticipant} votes per participant</small>
        </div>

        ${!room.endedAt ? `
          <form class="rr-form" id="rr-idea-form">
            <input type="text" class="rr-input" placeholder="Share your idea..." required id="rr-idea-text">
            <button type="submit" class="rr-button">Submit Idea</button>
          </form>
        ` : '<p style="color: #dc3545; font-weight: 600;">Voting has ended</p>'}

        <div class="rr-ideas">
          <h4 style="margin: 0 0 10px 0; font-size: 16px;">Ideas & Votes</h4>
          ${ideas.length > 0 ? `
            <ul class="rr-idea-list">
              ${ideas.map(idea => `
                <li class="rr-idea-item">
                  <span>${idea.text}</span>
                  <div>
                    <span class="rr-vote-count">${idea.voteCount || 0}</span>
                    ${!room.endedAt ? `
                      <button class="rr-vote-btn" onclick="window.rankroomWidget.vote('${idea._id}')">Vote</button>
                    ` : ''}
                  </div>
                </li>
              `).join('')}
            </ul>
          ` : '<p style="color: #6c757d; text-align: center;">No ideas yet. Be the first to submit one!</p>'}
        </div>

        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e9ecef; font-size: 12px; color: #6c757d;">
          Room ID: ${room._id} | Participants: ${room.participants?.length || 0}
        </div>
      </div>
    `;

    const ideaForm = this.container.querySelector('#rr-idea-form');
    if (ideaForm) {
      ideaForm.addEventListener('submit', (e) => this.handleSubmitIdea(e));
    }

    // Make vote function globally accessible for inline onclick
    window.rankroomWidget = this;
  }

  // Handle room creation
  async handleCreateRoom(event) {
    event.preventDefault();
    
    const title = document.getElementById('rr-title').value;
    const description = document.getElementById('rr-description').value;
    const votingSystem = document.getElementById('rr-voting-system').value;
    const votesPerParticipant = parseInt(document.getElementById('rr-votes').value);

    try {
      const response = await fetch(`${this.options.serverUrl}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          votingSystem,
          votesPerParticipant,
          phases: { ideaSubmission: true, voting: true, combined: true },
          authentication: 'anonymous'
        })
      });

      const result = await response.json();
      if (result.success) {
        await this.joinRoom(result.roomId);
      } else {
        this.showError('Failed to create room');
      }
    } catch (error) {
      this.showError('Error creating room: ' + error.message);
    }
  }

  // Handle idea submission
  async handleSubmitIdea(event) {
    event.preventDefault();
    
    const ideaText = document.getElementById('rr-idea-text').value.trim();
    if (!ideaText) return;

    try {
      const response = await fetch(`${this.options.serverUrl}/api/rooms/${this.currentRoom._id}/ideas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ideaText })
      });

      const result = await response.json();
      if (result.success) {
        document.getElementById('rr-idea-text').value = '';
        await this.refreshRoom();
      } else {
        this.showError('Failed to submit idea');
      }
    } catch (error) {
      this.showError('Error submitting idea: ' + error.message);
    }
  }

  // Vote on an idea
  async vote(ideaId) {
    try {
      const response = await fetch(`${this.options.serverUrl}/api/rooms/${this.currentRoom._id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaId })
      });

      const result = await response.json();
      if (result.success) {
        await this.refreshRoom();
      } else {
        this.showError('Failed to vote: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      this.showError('Error voting: ' + error.message);
    }
  }

  // Join an existing room
  async joinRoom(roomId, participantData = {}) {
    try {
      const response = await fetch(`${this.options.serverUrl}/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(participantData)
      });

      const result = await response.json();
      if (result.success) {
        this.currentUser = { id: result.participantId };
        await this.loadRoom(roomId);
        if (this.socket) {
          this.socket.emit('joinRoom', roomId);
        }
      } else {
        this.showError('Failed to join room');
      }
    } catch (error) {
      this.showError('Error joining room: ' + error.message);
    }
  }

  // Load room data
  async loadRoom(roomId) {
    try {
      const response = await fetch(`${this.options.serverUrl}/api/rooms/${roomId}`);
      const room = await response.json();
      
      if (room) {
        this.currentRoom = room;
        this.render();
      } else {
        this.showError('Room not found');
      }
    } catch (error) {
      this.showError('Error loading room: ' + error.message);
    }
  }

  // Refresh room data
  async refreshRoom() {
    if (this.currentRoom) {
      await this.loadRoom(this.currentRoom._id);
    }
  }

  // Refresh ideas only
  async refreshIdeas() {
    if (!this.currentRoom) return;
    
    try {
      const response = await fetch(`${this.options.serverUrl}/api/rooms/${this.currentRoom._id}/ideas`);
      const ideas = await response.json();
      this.currentRoom.ideas = ideas;
      this.render();
    } catch (error) {
      console.error('Error refreshing ideas:', error);
    }
  }

  // Show error message
  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'rr-error';
    errorDiv.textContent = message;
    
    this.container.insertBefore(errorDiv, this.container.firstChild);
    
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 5000);
  }

  // Destroy the widget
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

  // Static factory method
  static create(options) {
    const widget = new RankRoomWidget(options);
    widget.init();
    return widget;
  }

  // Configuration from YAML/JSON
  static fromConfig(config, containerId) {
    const options = {
      containerId,
      ...config
    };
    
    if (config.room) {
      options.initialRoom = config.room;
    }
    
    return RankRoomWidget.create(options);
  }
}

// Export for use in different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RankRoomWidget;
} else if (typeof window !== 'undefined') {
  window.RankRoomWidget = RankRoomWidget;
}

export default RankRoomWidget;