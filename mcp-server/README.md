# RankRoom MCP Server

Model Context Protocol (MCP) server for integrating RankRoom decision-making capabilities with AI assistants and automation tools.

## Overview

The RankRoom MCP Server enables AI assistants to create and manage decision rooms, submit ideas, vote on proposals, and summarize results. This allows for seamless integration of collaborative decision-making into AI-driven workflows.

## Installation

```bash
cd mcp-server
npm install
```

## Configuration

Set the RankRoom API URL via environment variable:

```bash
export RANKROOM_API_URL=http://localhost:3000/api
```

Or use the default `http://localhost:3000/api`.

## Usage

### With Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "rankroom": {
      "command": "node",
      "args": ["/path/to/rankroom/mcp-server/src/index.js"],
      "env": {
        "RANKROOM_API_URL": "http://localhost:3000/api"
      }
    }
  }
}
```

### With Other MCP Clients

Run the server directly:

```bash
node src/index.js
```

Or start in development mode:

```bash
npm run dev
```

## Available Tools

### `create_decision_room`

Create a new decision room for collaborative voting.

**Parameters:**
- `title` (required): Title of the decision room
- `description` (optional): Description of what needs to be decided
- `votingSystem` (optional): 'dot-voting', 'first-past-the-post', or 'alternative-voting'
- `votesPerParticipant` (optional): Number of votes each participant gets
- `authentication` (optional): 'anonymous', 'required', or 'sso'

**Example:**
```
Please create a decision room titled "Q2 Project Priorities" with dot voting and 5 votes per participant.
```

### `join_room`

Join an existing decision room.

**Parameters:**
- `roomId` (required): ID of the room to join
- `participantName` (optional): Name of the participant

**Example:**
```
Join room abc123 as "AI Assistant"
```

### `submit_idea`

Submit an idea to a decision room.

**Parameters:**
- `roomId` (required): ID of the room
- `ideaText` (required): The idea to submit

**Example:**
```
Submit the idea "Implement mobile app" to room abc123
```

### `vote_on_idea`

Vote on an idea in a decision room.

**Parameters:**
- `roomId` (required): ID of the room
- `ideaId` (required): ID of the idea to vote on

**Example:**
```
Vote on idea xyz789 in room abc123
```

### `get_room_status`

Get current status and ideas in a decision room.

**Parameters:**
- `roomId` (required): ID of the room

**Example:**
```
What's the current status of room abc123?
```

### `get_room_results`

Get final results and summary of a decision room.

**Parameters:**
- `roomId` (required): ID of the room

**Example:**
```
Show me the final results for room abc123
```

### `end_voting`

End voting in a decision room (creator only).

**Parameters:**
- `roomId` (required): ID of the room

**Example:**
```
End voting in room abc123
```

### `generate_invite_url`

Generate an invite URL for a decision room.

**Parameters:**
- `roomId` (required): ID of the room
- `inviteType` (optional): 'room' or 'individual'

**Example:**
```
Generate an invite URL for room abc123
```

## AI Conversation Examples

### Creating and Managing a Decision Room

```
User: I need to make a decision about our next product features. Can you help me set up a voting session?

AI: I'll create a decision room for your product feature voting. Let me set that up for you.

[Uses create_decision_room with title "Product Feature Priorities"]

✅ Decision room created successfully!

📊 Room Details:
• Title: Product Feature Priorities
• Room ID: abc123
• Voting System: dot-voting
• Votes per Participant: 3
• Authentication: anonymous

🔗 Share this URL with participants: /room/abc123

Would you like me to add some initial feature ideas to get started?

User: Yes, please add "Dark mode support" and "Mobile app" as ideas.

AI: I'll add those ideas to the decision room.

[Uses submit_idea twice]

✅ Both ideas submitted successfully! Your team members can now vote on:
1. "Dark mode support"
2. "Mobile app"

I can monitor the voting progress and provide updates as votes come in.
```

### Monitoring and Summarizing Results

```
User: Can you check on the voting progress for our feature decision?

AI: Let me check the current status of your decision room.

[Uses get_room_status]

📊 Decision Room Status

🏷️ Title: Product Feature Priorities
👥 Participants: 8
💡 Ideas: 5
📊 Status: active

🔥 Current Ideas:
1. "Dark mode support" (12 votes)
2. "Mobile app" (10 votes)
3. "API improvements" (8 votes)
4. "Better analytics" (5 votes)
5. "Integration with Slack" (3 votes)

✅ Voting is active - participants can submit ideas and vote.

It looks like "Dark mode support" is currently leading with 12 votes, followed closely by "Mobile app" with 10 votes. The voting is still active if you'd like to keep it open for more participants.

User: Let's end the voting and see the final results.

AI: I'll end the voting and get the final results for you.

[Uses end_voting then get_room_results]

🏆 Decision Room Results

📊 Product Feature Priorities

📈 Statistics:
• Total Ideas: 5
• Total Votes: 38
• Participants: 8
• Average Votes per Idea: 7.6

🥇 Final Rankings:
1. "Dark mode support" - 12 votes
2. "Mobile app" - 10 votes
3. "API improvements" - 8 votes
4. "Better analytics" - 5 votes
5. "Integration with Slack" - 3 votes

The team has spoken! Dark mode support is the clear winner with 12 votes. This shows strong consensus around improving the user interface experience. The mobile app came in second, indicating mobile functionality is also a priority for your users.
```

### Automated Workflow Integration

```
AI: I've detected that our weekly feature discussion is scheduled. Let me automatically create a decision room for this week's topics.

[Uses create_decision_room]

I've created "Week 15 Feature Discussion" and added the topics from our backlog:

[Uses submit_idea multiple times]

✅ Added 6 feature ideas from the backlog
🔗 Invite URL: /room/week15-features

I'll monitor the voting throughout the week and provide a summary report on Friday. Team members can vote on their priorities anytime before then.

[Later that week...]

AI: The weekly feature voting ends today. Here's the final summary:

[Uses get_room_results]

📊 This week's priorities are clear: Performance improvements lead with 24 votes, followed by user dashboard enhancements. I've automatically created tickets for the top 3 items and added them to the sprint planning board.

Would you like me to set up next week's decision room with the remaining items?
```

## Development

### Project Structure

```
mcp-server/
├── src/
│   └── index.js          # Main MCP server implementation
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

### Dependencies

- `@modelcontextprotocol/sdk`: MCP SDK for server implementation
- `axios`: HTTP client for API calls
- `zod`: Schema validation

### Adding New Tools

To add a new tool, update the `setupToolHandlers()` method:

1. Add tool definition to `ListToolsRequestSchema` handler
2. Add case to `CallToolRequestSchema` handler
3. Implement the tool method

```javascript
async myNewTool(args) {
    const schema = z.object({
        // Define parameters
    });
    
    const validated = schema.parse(args);
    
    // Implement tool logic
    
    return {
        content: [
            {
                type: 'text',
                text: 'Tool response'
            }
        ]
    };
}
```

### Error Handling

The server uses structured error handling with MCP error codes:

```javascript
throw new McpError(
    ErrorCode.InternalError,
    `Error message: ${error.message}`
);
```

### Testing

Test the server with an MCP client or use the included test scripts:

```bash
# Test tool listing
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node src/index.js

# Test tool execution
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"create_decision_room","arguments":{"title":"Test Room"}}}' | node src/index.js
```

## Integration Examples

### With GitHub Actions

```yaml
name: Weekly Feature Voting
on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9 AM

jobs:
  create-voting:
    runs-on: ubuntu-latest
    steps:
      - name: Create Decision Room
        run: |
          echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"create_decision_room","arguments":{"title":"Weekly Feature Voting"}}}' | \
          node mcp-server/src/index.js
```

### With Zapier/Make.com

Use webhooks to trigger decision room creation and result compilation based on external events like:

- Calendar events
- Slack messages
- Form submissions
- Project milestones

### With Custom AI Assistants

Integrate with custom GPT models or other AI assistants to provide decision-making capabilities in specialized domains like:

- Product management
- Team coordination
- Resource allocation
- Strategic planning

## License

ISC