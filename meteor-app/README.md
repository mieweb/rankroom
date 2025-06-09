# RankRoom Meteor App

A Meteor-based decision room application for collaborative voting and idea generation.

## Overview

This Meteor application provides real-time decision-making capabilities with:

- Multiple voting systems (dot voting, first-past-the-post, alternative voting)
- Real-time idea submission and voting
- Anonymous and authenticated participation
- Mobile-friendly interface using Blaze templates

## Features

- **Create Decision Rooms**: Set up rooms with custom voting systems and participation rules
- **Real-time Collaboration**: Live updates as participants submit ideas and vote
- **Multiple Voting Systems**: Support for different voting methodologies
- **Authentication Options**: Anonymous access or SSO integration
- **Mobile Responsive**: Works seamlessly on mobile devices

## Development Setup

1. Install Meteor (if not already installed):
   ```bash
   curl https://install.meteor.com/ | sh
   ```

2. Navigate to the Meteor app directory:
   ```bash
   cd meteor-app
   ```

3. Install dependencies:
   ```bash
   meteor npm install
   ```

4. Start the development server:
   ```bash
   meteor
   ```

5. Open http://localhost:3000 in your browser

## Project Structure

```
meteor-app/
├── .meteor/           # Meteor configuration
├── client/           # Client-side code
│   ├── main.html     # Blaze templates
│   └── main.js       # Client JavaScript
├── server/           # Server-side code
│   └── main.js       # Server startup
├── imports/          # Shared code
│   ├── api/          # Collections and methods
│   └── ui/           # UI components
└── public/           # Static assets
```

## Collections

- **DecisionRooms**: Room configuration and metadata
- **Ideas**: Ideas submitted by participants
- **Votes**: Vote records
- **Participants**: Participant information

## Methods

- `rooms.create`: Create a new decision room
- `rooms.join`: Join an existing room
- `ideas.submit`: Submit an idea
- `ideas.vote`: Vote on an idea
- `rooms.endVoting`: End voting phase
- `rooms.destroy`: Destroy a room

## Usage

### Creating a Room

```javascript
Meteor.call('rooms.create', {
  title: 'Project Planning',
  votingSystem: 'dot-voting',
  votesPerParticipant: 3,
  phases: { ideaSubmission: true, voting: true, combined: true },
  authentication: 'anonymous'
});
```

### Submitting Ideas

```javascript
Meteor.call('ideas.submit', roomId, 'Implement new feature');
```

### Voting

```javascript
Meteor.call('ideas.vote', roomId, ideaId);
```

## Blaze Templates

The application uses Blaze (Meteor's default templating system) as requested. Key templates include:

- `applicationLayout`: Main application layout
- `home`: Landing page with room creation
- `room`: Decision room interface
- `loading`: Loading indicator

## Real-time Features

The application uses Meteor's built-in reactivity for real-time updates:

- Live idea submission
- Real-time vote counting
- Participant tracking
- Status updates

## Authentication

Supports multiple authentication modes:
- Anonymous participation
- Meteor accounts
- Google/Apple SSO (configurable)

## Deployment

For production deployment, follow Meteor's deployment guide:

```bash
meteor build ../build --architecture os.linux.x86_64
```

Then deploy the built application to your hosting platform.