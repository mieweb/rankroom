# RankRoom Widget

An embeddable JavaScript widget for creating decision rooms with collaborative voting and idea generation.

## Installation

```bash
npm install rankroom-widget
```

## Quick Start

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
    <title>My App</title>
</head>
<body>
    <div id="decision-widget"></div>
    
    <!-- Include Socket.IO for real-time features -->
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
    
    <!-- Include the widget -->
    <script src="node_modules/rankroom-widget/dist/rankroom-widget.js"></script>
    
    <script>
        const widget = RankRoomWidget.create({
            containerId: 'decision-widget',
            serverUrl: 'http://localhost:3000'
        });
    </script>
</body>
</html>
```

### Using with Module Systems

```javascript
import RankRoomWidget from 'rankroom-widget';

const widget = RankRoomWidget.create({
    containerId: 'my-widget',
    serverUrl: 'https://your-rankroom-server.com'
});
```

## Configuration

### Basic Configuration

```javascript
const widget = RankRoomWidget.create({
    containerId: 'widget-container',
    serverUrl: 'http://localhost:3000',
    theme: 'default'
});
```

### Configuration from Object

```javascript
const config = {
    room: {
        title: 'Team Lunch Ideas',
        description: 'Where should we go for lunch?',
        votingSystem: 'dot-voting',
        votesPerParticipant: 3
    },
    serverUrl: 'http://localhost:3000'
};

const widget = RankRoomWidget.fromConfig(config, 'widget-container');
```

### Configuration from YAML

```yaml
# config.yaml
room:
  title: "Feature Prioritization"
  description: "Help us decide which features to build next"
  votingSystem: "alternative-voting"
  votesPerParticipant: 5
  authentication: "anonymous"
serverUrl: "https://your-server.com"
```

```javascript
// Load and parse YAML config
const config = YAML.parse(await fetch('/config.yaml').then(r => r.text()));
const widget = RankRoomWidget.fromConfig(config, 'widget-container');
```

## API Reference

### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `containerId` | string | 'rankroom-widget' | ID of container element |
| `serverUrl` | string | 'http://localhost:3000' | RankRoom server URL |
| `theme` | string | 'default' | Widget theme |

### Methods

#### `init()`
Initialize the widget and render initial state.

#### `joinRoom(roomId, participantData)`
Join an existing room.

```javascript
await widget.joinRoom('room-123', { name: 'John Doe' });
```

#### `vote(ideaId)`
Vote on a specific idea.

```javascript
await widget.vote('idea-456');
```

#### `destroy()`
Clean up the widget and disconnect from server.

```javascript
widget.destroy();
```

### Static Methods

#### `RankRoomWidget.create(options)`
Create and initialize a new widget instance.

#### `RankRoomWidget.fromConfig(config, containerId)`
Create a widget from a configuration object.

## Voting Systems

### Dot Voting
Participants get a fixed number of votes to distribute among ideas.

```javascript
{
    votingSystem: 'dot-voting',
    votesPerParticipant: 3
}
```

### First Past the Post
Participants can vote once per idea, winner takes all.

```javascript
{
    votingSystem: 'first-past-the-post',
    votesPerParticipant: 1
}
```

### Alternative Voting
Ranked choice voting where participants rank their preferences.

```javascript
{
    votingSystem: 'alternative-voting',
    votesPerParticipant: 5
}
```

## Authentication Options

### Anonymous
Anyone with the room URL can participate.

```javascript
{
    authentication: 'anonymous'
}
```

### Required Login
Participants must log in to participate.

```javascript
{
    authentication: 'required'
}
```

### Single Sign-On
Integration with Google, Apple, or other SSO providers.

```javascript
{
    authentication: 'sso'
}
```

## Events

The widget emits events that you can listen to:

```javascript
widget.on('roomCreated', (roomData) => {
    console.log('Room created:', roomData);
});

widget.on('ideaSubmitted', (ideaData) => {
    console.log('New idea:', ideaData);
});

widget.on('voteReceived', (voteData) => {
    console.log('Vote cast:', voteData);
});
```

## Styling

### Default Styles
The widget comes with built-in styles that work out of the box.

### Custom Themes
Override default styles by defining custom CSS:

```css
.rankroom-widget {
    border: 2px solid #007bff;
    border-radius: 12px;
}

.rr-button {
    background: #28a745;
}

.rr-button:hover {
    background: #218838;
}
```

### CSS Variables
Use CSS variables for easier theming:

```css
.rankroom-widget {
    --primary-color: #007bff;
    --success-color: #28a745;
    --border-radius: 8px;
}
```

## Real-time Features

The widget automatically connects to the RankRoom server via Socket.IO for real-time updates:

- Live idea submission
- Real-time vote counting
- Participant presence
- Status changes

## Server Integration

### API Endpoints

The widget expects these API endpoints on your server:

- `POST /api/rooms` - Create room
- `GET /api/rooms/:id` - Get room data
- `POST /api/rooms/:id/join` - Join room
- `POST /api/rooms/:id/ideas` - Submit idea
- `POST /api/rooms/:id/vote` - Cast vote
- `GET /api/rooms/:id/results` - Get results

### Socket.IO Events

The widget listens for these Socket.IO events:

- `ideaAdded` - New idea submitted
- `voteAdded` - New vote cast
- `roomUpdated` - Room status changed

## Examples

### React Integration

```jsx
import React, { useEffect, useRef } from 'react';
import RankRoomWidget from 'rankroom-widget';

function DecisionWidget({ roomConfig }) {
    const containerRef = useRef();
    const widgetRef = useRef();

    useEffect(() => {
        if (containerRef.current) {
            widgetRef.current = RankRoomWidget.create({
                containerId: containerRef.current.id,
                serverUrl: process.env.REACT_APP_RANKROOM_URL,
                ...roomConfig
            });
        }

        return () => {
            if (widgetRef.current) {
                widgetRef.current.destroy();
            }
        };
    }, [roomConfig]);

    return <div id={`widget-${Date.now()}`} ref={containerRef} />;
}
```

### Vue Integration

```vue
<template>
    <div :id="widgetId" ref="container"></div>
</template>

<script>
import RankRoomWidget from 'rankroom-widget';

export default {
    props: ['config'],
    data() {
        return {
            widgetId: `widget-${Date.now()}`,
            widget: null
        };
    },
    mounted() {
        this.widget = RankRoomWidget.create({
            containerId: this.widgetId,
            ...this.config
        });
    },
    beforeDestroy() {
        if (this.widget) {
            this.widget.destroy();
        }
    }
};
</script>
```

## Development

### Building

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Testing

```bash
npm test
```

## License

ISC