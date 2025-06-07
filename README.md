# RankRoom - Decision Room App & Embeddable Widget

A comprehensive solution for collaborative decision-making, featuring a Meteor-based app, embeddable NPM widget, and MCP server integration for AI workflows.

## 🚀 Overview

RankRoom provides multiple ways to enable collaborative voting and idea generation:

1. **Meteor Standalone App**: Full-featured web application with real-time collaboration
2. **Embeddable NPM Widget**: Drop-in component for any JavaScript application  
3. **MCP Server**: Integration with AI assistants and automation tools
4. **Express API**: RESTful backend for custom integrations

## 📦 Components

### 1. Meteor Application (`meteor-app/`)

A full-stack Meteor application with Blaze templates for real-time decision-making.

**Features:**
- Real-time idea submission and voting
- Multiple voting systems (dot voting, first-past-the-post, alternative voting)
- Anonymous and authenticated participation
- Mobile-responsive Blaze templates
- Built-in reactivity and live updates

**Quick Start:**
```bash
cd meteor-app
meteor npm install
meteor
```

See [meteor-app/README.md](meteor-app/README.md) for full documentation.

### 2. Embeddable Widget (`npm-package/`)

Lightweight JavaScript widget for embedding decision rooms in any web application.

**Features:**
- Framework-agnostic (works with React, Vue, Angular, vanilla JS)
- Configurable via JavaScript or YAML
- Real-time updates via Socket.IO
- Multiple themes and customization options

**Quick Start:**
```html
<div id="rankroom-widget"></div>
<script src="rankroom-widget.js"></script>
<script>
  RankRoomWidget.create({
    containerId: 'rankroom-widget',
    serverUrl: 'http://localhost:3000'
  });
</script>
```

See [npm-package/README.md](npm-package/README.md) for full documentation.

### 3. MCP Server (`mcp-server/`)

Model Context Protocol server for AI assistant integration.

**Features:**
- Create and manage decision rooms via AI conversation
- Submit ideas and vote through natural language
- Generate summaries and reports
- Integrate with Claude, GPT, and other AI systems

**Quick Start:**
```bash
cd mcp-server
npm install
node src/index.js
```

See [mcp-server/README.md](mcp-server/README.md) for full documentation.

### 4. Express API Backend

RESTful API server supporting all components.

**Key Endpoints:**
- `POST /api/rooms` - Create decision room
- `POST /api/rooms/:id/ideas` - Submit ideas
- `POST /api/rooms/:id/vote` - Cast votes
- `GET /api/rooms/:id/results` - Get results

## 🎯 Use Cases

### Team Decision Making
- Feature prioritization
- Meeting scheduling  
- Budget allocation
- Vendor selection

### Product Management
- User story prioritization
- Release planning
- Roadmap decisions
- A/B test planning

### Event Planning
- Activity selection
- Venue choosing
- Menu planning
- Speaker selection

### Education & Training
- Course topic voting
- Assignment priorities
- Group project selection
- Learning path planning

## 🔧 Voting Systems

### Dot Voting
Participants get a fixed number of votes to distribute among options.
```javascript
{
  votingSystem: 'dot-voting',
  votesPerParticipant: 3
}
```

### First Past the Post
Simple majority voting - each participant gets one vote per option.
```javascript
{
  votingSystem: 'first-past-the-post',
  votesPerParticipant: 1
}
```

### Alternative Voting (Ranked Choice)
Participants rank options in order of preference.
```javascript
{
  votingSystem: 'alternative-voting',
  votesPerParticipant: 5
}
```

## 🔐 Authentication Options

### Anonymous Access
Anyone with the room URL can participate without login.

### Required Authentication  
Participants must log in with email/password or SSO.

### Single Sign-On (SSO)
Integration with Google, Apple, Microsoft, and other identity providers.

## 📱 Mobile Support

All components are designed mobile-first:
- Responsive design for tablets and phones
- Touch-friendly voting interfaces
- Optimized for thumb navigation
- Progressive Web App capabilities

## 🔗 Integration Examples

### React Application
```jsx
import RankRoomWidget from 'rankroom-widget';

function MyComponent() {
  useEffect(() => {
    const widget = RankRoomWidget.create({
      containerId: 'decision-widget',
      serverUrl: process.env.REACT_APP_RANKROOM_URL
    });
    
    return () => widget.destroy();
  }, []);

  return <div id="decision-widget" />;
}
```

### AI Assistant Workflow
```
User: Help me decide what features to build next

AI: I'll create a decision room for your team to vote on feature priorities.

[Creates room via MCP server]

✅ Created "Feature Prioritization" room
🔗 Share: https://app.com/room/abc123

Added these ideas from your backlog:
• Dark mode support
• Mobile app improvements  
• API documentation
• Performance optimization

Your team can vote with 3 dots each. I'll summarize results tomorrow.
```

### Webhook Integration
```javascript
// Automatically create rooms from calendar events
app.post('/webhook/calendar', (req, res) => {
  const event = req.body;
  
  if (event.title.includes('Decision')) {
    createDecisionRoom({
      title: event.title,
      description: event.description,
      votingSystem: 'dot-voting'
    });
  }
});
```

## 🚀 Deployment

### Development
```bash
# Start Express API server
npm start

# Start Meteor app (separate terminal)
cd meteor-app && meteor

# Test widget demo
open http://localhost:3000/widget-demo.html
```

### Production

#### Meteor App
```bash
cd meteor-app
meteor build ../build --architecture os.linux.x86_64
# Deploy built application to hosting platform
```

#### NPM Widget
```bash
cd npm-package
npm run build
npm publish
```

#### MCP Server
```bash
cd mcp-server
npm start
# Configure in Claude Desktop or other MCP client
```

## 📊 Demo & Testing

Visit the widget demo at: `http://localhost:3000/widget-demo.html`

This interactive demo shows:
- Widget embedding examples
- API usage patterns
- Real-time voting simulation
- Configuration options

## 🛠 Development

### Prerequisites
- Node.js 18+
- MongoDB (for data persistence)
- Meteor (for Meteor app development)

### Local Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Start MongoDB
4. Start the Express server: `npm start`
5. (Optional) Start Meteor app: `cd meteor-app && meteor`

### Project Structure
```
rankroom/
├── meteor-app/           # Meteor application
├── npm-package/          # Embeddable widget
├── mcp-server/           # AI integration server
├── routes/               # Express API routes
├── models/               # Database models
├── public/               # Static assets & demos
└── views/                # EJS templates
```

## 📄 License

ISC
