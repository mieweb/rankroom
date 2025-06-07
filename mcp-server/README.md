# RankRoom MCP Server

Model Context Protocol (MCP) server for integrating RankRoom's 3-phase collaborative decision-making capabilities with AI assistants and automation tools.

## Overview

The RankRoom MCP Server enables AI assistants to manage complete 3-phase decision processes: Definition (criteria setting), Collection (candidate evaluation), and Decision (results analysis). This allows for sophisticated collaborative decision-making workflows integrated into AI-driven automation.

## Installation

```bash
cd mcp-server
npm install
```

## Configuration

Set the RankRoom API URL via environment variable:

```bash
export RANKROOM_API_URL=http://localhost:32000/api
```

Or use the default `http://localhost:32000/api`.

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
        "RANKROOM_API_URL": "http://localhost:32000/api"
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

## 3-Phase Decision Making Process

### Phase 1: Definition
- **Purpose**: Define and collaborate on decision criteria
- **Actions**: Create criteria, share with team, build consensus on what matters
- **Advancement**: Room leader advances to Collection phase when criteria are complete

### Phase 2: Collection
- **Purpose**: Evaluate candidates against shared criteria privately
- **Actions**: Add candidates, score each candidate (1-10) against criteria, add notes
- **Privacy**: Participants can't see each other's evaluations during this phase
- **Advancement**: Room leader advances to Decision phase when evaluations are complete

### Phase 3: Decision
- **Purpose**: Analyze aggregated results and make informed decisions
- **Actions**: View rankings, analyze scores and variance, export results
- **Transparency**: All evaluation data becomes visible for analysis

## Available Tools

### User Management

#### `create_user`
Create a new user for 3-phase decision making.

**Parameters:**
- `name` (required): Full name of the user
- `email` (required): Email address of the user

**Example:**
```
Create a user named "Alice Johnson" with email alice@company.com
```

### Topic Management

#### `create_decision_topic`
Create a new 3-phase decision topic.

**Parameters:**
- `name` (required): Name of the decision topic
- `description` (optional): Description of what needs to be decided
- `userId` (required): ID of the user creating the topic (becomes room leader)
- `settings` (optional): Configuration for collaboration and privacy

**Example:**
```
Create a decision topic called "Q2 Strategic Priorities" for user alice-user-id
```

#### `join_topic`
Join an existing decision topic.

**Parameters:**
- `topicId` (required): ID of the topic to join
- `userId` (required): ID of the user joining

**Example:**
```
Have user bob-user-id join topic topic-123
```

#### `advance_phase`
Advance topic to next phase (room leader only).

**Parameters:**
- `topicId` (required): ID of the topic
- `userId` (required): ID of the room leader
- `targetPhase` (required): Phase to advance to (2=Collection, 3=Decision)

**Example:**
```
Advance topic topic-123 to Collection phase for user alice-user-id
```

### Definition Phase Tools

#### `create_criterion`
Create a criterion in the Definition phase.

**Parameters:**
- `name` (required): Name of the criterion
- `description` (optional): Description of the criterion
- `topicId` (required): ID of the topic
- `userId` (required): ID of the user creating the criterion
- `isShared` (optional): Whether to share with other participants

**Example:**
```
Create a criterion called "Cost Effectiveness" for topic topic-123
```

#### `share_criterion`
Share a personal criterion with other participants.

**Parameters:**
- `criterionId` (required): ID of the criterion to share
- `userId` (required): ID of the criterion owner

**Example:**
```
Share criterion crit-456 for user alice-user-id
```

### Collection Phase Tools

#### `create_candidate`
Create a candidate to be evaluated.

**Parameters:**
- `name` (required): Name of the candidate
- `description` (optional): Description of the candidate
- `topicId` (required): ID of the topic
- `userId` (required): ID of the user creating the candidate

**Example:**
```
Create a candidate called "Option A: Cloud Migration" for topic topic-123
```

#### `submit_evaluation`
Submit an evaluation for a candidate against a criterion.

**Parameters:**
- `userId` (required): ID of the user submitting evaluation
- `candidateId` (required): ID of the candidate being evaluated
- `criterionId` (required): ID of the criterion for evaluation
- `score` (required): Score from 1 (poor) to 10 (excellent)
- `notes` (optional): Optional notes explaining the evaluation

**Example:**
```
Submit evaluation: user alice-user-id, candidate cand-789, criterion crit-456, score 8, notes "Strong cost benefits but implementation complexity"
```

### Analysis Tools

#### `get_topic_status`
Get current status of a decision topic.

**Parameters:**
- `topicId` (required): ID of the topic

**Example:**
```
What's the current status of topic topic-123?
```

#### `get_topic_results`
Get aggregated results and analysis (Decision phase only).

**Parameters:**
- `topicId` (required): ID of the topic

**Example:**
```
Show me the final results for topic topic-123
```

#### `get_shared_criteria`
Get all shared criteria for a topic.

**Parameters:**
- `topicId` (required): ID of the topic

**Example:**
```
List all shared criteria for topic topic-123
```

#### `get_candidates`
Get all candidates for a topic.

**Parameters:**
- `topicId` (required): ID of the topic

**Example:**
```
List all candidates for topic topic-123
```

## AI Conversation Examples

### Complete 3-Phase Workflow

```
User: Help me decide our Q2 strategic priorities using a structured decision process.

AI: I'll set up a comprehensive 3-phase decision process for your Q2 strategic priorities. First, let me create you as a user in the system.

[Uses create_user]

✅ User created: Alice Johnson (alice-123)

Now I'll create a decision topic for your Q2 strategic priorities.

[Uses create_decision_topic]

🎯 Decision topic created successfully!

**Topic Details:**
- Name: Q2 Strategic Priorities
- Topic ID: topic-456
- Current Phase: 1 (Definition)

**Phase 1: Definition**
We're now in the Definition phase where we'll identify what criteria matter most for evaluating your strategic options.

Let me start by creating some common strategic criteria:

[Uses create_criterion multiple times]

📋 Created shared criteria:
1. "Revenue Impact" - Potential to drive revenue growth
2. "Implementation Feasibility" - How realistic is execution
3. "Strategic Alignment" - Fits with company mission
4. "Resource Requirements" - Time, budget, personnel needed
5. "Risk Level" - Potential downsides and uncertainties

These criteria are now shared with all participants. Would you like to add any specific criteria for your business context?

User: Yes, please add "Customer Satisfaction Impact" and "Competitive Advantage"

AI: Excellent additions! Let me create those criteria.

[Uses create_criterion twice]

📋 Added criteria:
- "Customer Satisfaction Impact" - Effect on customer happiness and retention
- "Competitive Advantage" - Strengthens market position vs competitors

Perfect! We now have 7 comprehensive criteria for evaluating your strategic options. Ready to advance to the Collection phase where we'll add candidates and start evaluations?

User: Yes, let's move to evaluation

AI: Great! I'll advance us to the Collection phase.

[Uses advance_phase]

🚀 Successfully advanced to Collection phase!

**Phase 2: Collection**
Now we can add strategic options (candidates) and evaluate them privately against our criteria.

Let me add some common Q2 strategic options to get started:

[Uses create_candidate multiple times]

🏆 Added strategic candidates:
1. "Product Feature Expansion" - Develop new product capabilities
2. "Market Expansion" - Enter new geographic or customer segments  
3. "Operational Efficiency" - Streamline processes and reduce costs
4. "Partnership Development" - Strategic alliances and integrations
5. "Team Expansion" - Hire key talent and build capabilities

Now I'll help you evaluate these options. Let me start with "Product Feature Expansion" against our criteria:

[Uses submit_evaluation multiple times for different criteria]

📊 Evaluation completed for "Product Feature Expansion":
- Revenue Impact: 8/10 - Strong potential for new revenue streams
- Implementation Feasibility: 6/10 - Requires significant development effort
- Strategic Alignment: 9/10 - Core to our product strategy
- Resource Requirements: 4/10 - High investment needed
- Risk Level: 7/10 - Market acceptance uncertainty
- Customer Satisfaction: 8/10 - Addresses key customer requests
- Competitive Advantage: 7/10 - Can differentiate from competitors

Would you like me to continue evaluating the other candidates, or would you prefer to do some evaluations yourself?

User: Please evaluate all candidates and then show me the results

AI: I'll complete evaluations for all candidates across all criteria and then advance to the Decision phase.

[Uses submit_evaluation for all remaining candidates]

✅ All evaluations completed! Now let me advance to the Decision phase for final analysis.

[Uses advance_phase to phase 3]

🚀 Advanced to Decision phase! Let me get the comprehensive results.

[Uses get_topic_results]

📊 **Final Strategic Priority Results**

**Winner:** Product Feature Expansion (7.4/10)

**Complete Rankings:**

**1. Product Feature Expansion**
   - Average Score: 7.4/10
   - Total Evaluations: 7
   - Score Variance: 2.1
   - Description: Develop new product capabilities

**2. Partnership Development**
   - Average Score: 6.8/10
   - Total Evaluations: 7
   - Score Variance: 1.8
   - Description: Strategic alliances and integrations

**3. Market Expansion**
   - Average Score: 6.2/10
   - Total Evaluations: 7
   - Score Variance: 2.4
   - Description: Enter new geographic or customer segments

**4. Team Expansion**
   - Average Score: 5.9/10
   - Total Evaluations: 7
   - Score Variance: 1.6
   - Description: Hire key talent and build capabilities

**5. Operational Efficiency**
   - Average Score: 5.7/10
   - Total Evaluations: 7
   - Score Variance: 1.3
   - Description: Streamline processes and reduce costs

**Analysis Summary:**
- Total Candidates: 5
- Evaluation Process: Complete
- Recommended Decision: Product Feature Expansion based on highest average score

**Key Insights:**
1. **Product Feature Expansion** wins with strong scores in Revenue Impact (8), Strategic Alignment (9), and Customer Satisfaction (8)
2. **Partnership Development** is a close second with lower resource requirements and risk
3. **Market Expansion** shows potential but higher variance indicates less consensus
4. **Low variance on Operational Efficiency** suggests team agreement it's less strategic priority

**Recommendation:** Focus Q2 efforts on Product Feature Expansion while exploring Partnership Development as a parallel, lower-resource initiative.
```

### Collaborative Multi-User Workflow

```
User: Set up a decision process for our team to evaluate vendor options. I need Alice, Bob, and Carol to participate.

AI: I'll set up a collaborative vendor evaluation process for your team. Let me create the users and decision topic.

[Uses create_user for Alice, Bob, Carol]

✅ Created team users:
- Alice Johnson (alice-789)
- Bob Smith (bob-456) 
- Carol Davis (carol-123)

[Uses create_decision_topic with Alice as room leader]

🎯 Created "Vendor Selection Process" topic (topic-999)

Now let me invite Bob and Carol to join:

[Uses join_topic for Bob and Carol]

✅ Team assembled! All participants joined.

**Definition Phase Started**
Let me create initial evaluation criteria for vendor selection:

[Uses create_criterion multiple times]

📋 Shared criteria created:
1. Cost Effectiveness
2. Technical Capabilities  
3. Support Quality
4. Implementation Timeline
5. Security & Compliance
6. Scalability

The team can now add their own criteria and we'll collaborate on the final set. Ready to add vendor candidates and move to evaluation?

User: Yes, add Vendor A, B, and C, then advance to Collection

AI: [Uses create_candidate for each vendor, then advance_phase]

🚀 Now in Collection phase! 

Each team member can privately evaluate the vendors against our 6 criteria. The evaluations will remain private until we advance to Decision phase.

I can guide each team member through their evaluations, or they can evaluate independently. Once everyone completes their assessments, we'll advance to see the aggregated results and make the final vendor decision.

Would you like me to notify the team that evaluation is ready to begin?
```

### Automated Weekly Decision Process

```
AI: Monday morning - time for our weekly feature prioritization! Let me set up this week's decision process.

[Uses create_decision_topic]

🎯 Created "Week 15 Feature Prioritization"

[Uses create_criterion for standard feature criteria]
[Uses create_candidate for backlog items]

✅ Automated setup complete:
- 5 evaluation criteria loaded
- 8 feature candidates from backlog added
- Team notified to begin Definition phase review

The team has until Wednesday to review criteria and Thursday to complete evaluations. I'll automatically advance phases and provide Friday's decision summary.

[Wednesday update]
AI: Midweek update - advancing to Collection phase for feature evaluations.

[Uses advance_phase]

Team members can now privately score each feature. Reminder: evaluations due Thursday 5 PM.

[Friday summary]
AI: Weekly feature prioritization complete! Here are this week's results:

[Uses get_topic_results]

📊 **Week 15 Priority Rankings:**
1. Mobile Performance Optimization (8.9/10)
2. Advanced Search Filters (8.1/10)  
3. User Dashboard Redesign (7.6/10)

Top 3 features automatically added to Sprint 16 planning. Next week's prioritization will focus on remaining backlog items.
```

## Integration Examples

### GitHub Actions Workflow

```yaml
name: Monthly Strategic Planning
on:
  schedule:
    - cron: '0 9 1 * *'  # First day of month at 9 AM

jobs:
  setup-decision-process:
    runs-on: ubuntu-latest
    steps:
      - name: Create Monthly Decision Topic
        run: |
          echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"create_decision_topic","arguments":{"name":"Monthly Strategic Review","userId":"'$TEAM_LEADER_ID'"}}}' | \
          node mcp-server/src/index.js
```

### Slack Integration

Use webhooks to trigger decision processes based on Slack commands:

```
/rankroom create "Feature Voting" 
→ Creates decision topic, sets up criteria, notifies team
```

### Custom AI Assistant Integration

Integrate with domain-specific AI assistants for specialized decision-making:

- **Product Management**: Feature prioritization, roadmap planning
- **HR Decisions**: Candidate evaluation, policy changes  
- **Strategic Planning**: Market analysis, investment decisions
- **Operations**: Vendor selection, process improvements

## Development

### Project Structure

```
mcp-server/
├── src/
│   └── index.js          # Main MCP server with 3-phase tools
├── package.json          # Dependencies and scripts
└── README.md            # This documentation
```

### Key Dependencies

- `@modelcontextprotocol/sdk`: MCP SDK for server implementation
- `axios`: HTTP client for RankRoom API integration
- `zod`: Schema validation for tool parameters

### Error Handling

Comprehensive error handling with structured MCP error responses:

```javascript
throw new McpError(
    ErrorCode.InternalError,
    `Failed to create criterion: ${error.response?.data?.message || error.message}`
);
```

### Testing

Test individual tools with direct JSON-RPC calls:

```bash
# Test user creation
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"create_user","arguments":{"name":"Test User","email":"test@example.com"}}}' | node src/index.js

# Test topic creation  
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"create_decision_topic","arguments":{"name":"Test Topic","userId":"user-123"}}}' | node src/index.js
```

## License

ISC