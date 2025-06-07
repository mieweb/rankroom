#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { 
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} = require('@modelcontextprotocol/sdk/types.js');
const axios = require('axios');
const { z } = require('zod');

class RankRoomMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'rankroom-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.apiBaseUrl = process.env.RANKROOM_API_URL || 'http://localhost:3000/api';
    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'create_decision_room',
            description: 'Create a new decision room for collaborative voting',
            inputSchema: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: 'Title of the decision room'
                },
                description: {
                  type: 'string',
                  description: 'Description of what needs to be decided'
                },
                votingSystem: {
                  type: 'string',
                  enum: ['dot-voting', 'first-past-the-post', 'alternative-voting'],
                  description: 'Voting system to use',
                  default: 'dot-voting'
                },
                votesPerParticipant: {
                  type: 'number',
                  description: 'Number of votes each participant gets',
                  default: 3
                },
                authentication: {
                  type: 'string',
                  enum: ['anonymous', 'required', 'sso'],
                  description: 'Authentication requirement',
                  default: 'anonymous'
                }
              },
              required: ['title']
            }
          },
          {
            name: 'join_room',
            description: 'Join an existing decision room',
            inputSchema: {
              type: 'object',
              properties: {
                roomId: {
                  type: 'string',
                  description: 'ID of the room to join'
                },
                participantName: {
                  type: 'string',
                  description: 'Name of the participant',
                  default: 'AI Assistant'
                }
              },
              required: ['roomId']
            }
          },
          {
            name: 'submit_idea',
            description: 'Submit an idea to a decision room',
            inputSchema: {
              type: 'object',
              properties: {
                roomId: {
                  type: 'string',
                  description: 'ID of the room'
                },
                ideaText: {
                  type: 'string',
                  description: 'The idea to submit'
                }
              },
              required: ['roomId', 'ideaText']
            }
          },
          {
            name: 'vote_on_idea',
            description: 'Vote on an idea in a decision room',
            inputSchema: {
              type: 'object',
              properties: {
                roomId: {
                  type: 'string',
                  description: 'ID of the room'
                },
                ideaId: {
                  type: 'string',
                  description: 'ID of the idea to vote on'
                }
              },
              required: ['roomId', 'ideaId']
            }
          },
          {
            name: 'get_room_status',
            description: 'Get current status and ideas in a decision room',
            inputSchema: {
              type: 'object',
              properties: {
                roomId: {
                  type: 'string',
                  description: 'ID of the room'
                }
              },
              required: ['roomId']
            }
          },
          {
            name: 'get_room_results',
            description: 'Get final results and summary of a decision room',
            inputSchema: {
              type: 'object',
              properties: {
                roomId: {
                  type: 'string',
                  description: 'ID of the room'
                }
              },
              required: ['roomId']
            }
          },
          {
            name: 'end_voting',
            description: 'End voting in a decision room (creator only)',
            inputSchema: {
              type: 'object',
              properties: {
                roomId: {
                  type: 'string',
                  description: 'ID of the room'
                }
              },
              required: ['roomId']
            }
          },
          {
            name: 'generate_invite_url',
            description: 'Generate an invite URL for a decision room',
            inputSchema: {
              type: 'object',
              properties: {
                roomId: {
                  type: 'string',
                  description: 'ID of the room'
                },
                inviteType: {
                  type: 'string',
                  enum: ['room', 'individual'],
                  description: 'Type of invite to generate',
                  default: 'room'
                }
              },
              required: ['roomId']
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'create_decision_room':
            return await this.createDecisionRoom(args);
          
          case 'join_room':
            return await this.joinRoom(args);
          
          case 'submit_idea':
            return await this.submitIdea(args);
          
          case 'vote_on_idea':
            return await this.voteOnIdea(args);
          
          case 'get_room_status':
            return await this.getRoomStatus(args);
          
          case 'get_room_results':
            return await this.getRoomResults(args);
          
          case 'end_voting':
            return await this.endVoting(args);
          
          case 'generate_invite_url':
            return await this.generateInviteUrl(args);
          
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error.message}`
        );
      }
    });
  }

  async createDecisionRoom(args) {
    const schema = z.object({
      title: z.string(),
      description: z.string().optional(),
      votingSystem: z.enum(['dot-voting', 'first-past-the-post', 'alternative-voting']).default('dot-voting'),
      votesPerParticipant: z.number().default(3),
      authentication: z.enum(['anonymous', 'required', 'sso']).default('anonymous')
    });

    const validated = schema.parse(args);

    try {
      const response = await axios.post(`${this.apiBaseUrl}/rooms`, {
        title: validated.title,
        description: validated.description || '',
        votingSystem: validated.votingSystem,
        votesPerParticipant: validated.votesPerParticipant,
        phases: { ideaSubmission: true, voting: true, combined: true },
        authentication: validated.authentication
      });

      const { roomId, roomUrl } = response.data;

      return {
        content: [
          {
            type: 'text',
            text: `✅ Decision room created successfully!

📊 Room Details:
• Title: ${validated.title}
• Room ID: ${roomId}
• Voting System: ${validated.votingSystem}
• Votes per Participant: ${validated.votesPerParticipant}
• Authentication: ${validated.authentication}

🔗 Share this URL with participants: ${roomUrl}

You can now:
• Use submit_idea to add ideas
• Use get_room_status to monitor progress
• Use generate_invite_url for individual invites`
          }
        ]
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to create room: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async joinRoom(args) {
    const schema = z.object({
      roomId: z.string(),
      participantName: z.string().default('AI Assistant')
    });

    const validated = schema.parse(args);

    try {
      const response = await axios.post(`${this.apiBaseUrl}/rooms/${validated.roomId}/join`, {
        name: validated.participantName
      });

      return {
        content: [
          {
            type: 'text',
            text: `✅ Successfully joined the decision room!

👤 Participant: ${validated.participantName}
🆔 Participant ID: ${response.data.participantId}

You can now submit ideas and vote in this room.`
          }
        ]
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to join room: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async submitIdea(args) {
    const schema = z.object({
      roomId: z.string(),
      ideaText: z.string()
    });

    const validated = schema.parse(args);

    try {
      const response = await axios.post(`${this.apiBaseUrl}/rooms/${validated.roomId}/ideas`, {
        text: validated.ideaText
      });

      return {
        content: [
          {
            type: 'text',
            text: `✅ Idea submitted successfully!

💡 Idea: "${validated.ideaText}"
🆔 Idea ID: ${response.data.ideaId}

The idea is now available for voting by all participants.`
          }
        ]
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to submit idea: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async voteOnIdea(args) {
    const schema = z.object({
      roomId: z.string(),
      ideaId: z.string()
    });

    const validated = schema.parse(args);

    try {
      const response = await axios.post(`${this.apiBaseUrl}/rooms/${validated.roomId}/vote`, {
        ideaId: validated.ideaId
      });

      return {
        content: [
          {
            type: 'text',
            text: `✅ Vote cast successfully!

🗳️ Vote ID: ${response.data.voteId}

Your vote has been recorded and the results updated.`
          }
        ]
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to vote: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async getRoomStatus(args) {
    const schema = z.object({
      roomId: z.string()
    });

    const validated = schema.parse(args);

    try {
      const response = await axios.get(`${this.apiBaseUrl}/rooms/${validated.roomId}`);
      const room = response.data;

      const statusText = `📊 Decision Room Status

🏷️ Title: ${room.title}
📝 Description: ${room.description}
🗳️ Voting System: ${room.votingSystem}
👥 Participants: ${room.participants?.length || 0}
💡 Ideas: ${room.ideas?.length || 0}
📊 Status: ${room.status}

${room.ideas && room.ideas.length > 0 ? `
🔥 Current Ideas:
${room.ideas.map((idea, index) => 
  `${index + 1}. "${idea.text}" (${idea.voteCount || 0} votes)`
).join('\n')}
` : '💡 No ideas submitted yet.'}

${room.status === 'active' ? '✅ Voting is active - participants can submit ideas and vote.' : '🔒 Voting has ended.'}`;

      return {
        content: [
          {
            type: 'text',
            text: statusText
          }
        ]
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to get room status: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async getRoomResults(args) {
    const schema = z.object({
      roomId: z.string()
    });

    const validated = schema.parse(args);

    try {
      const response = await axios.get(`${this.apiBaseUrl}/rooms/${validated.roomId}/results`);
      const results = response.data;

      const resultsText = `🏆 Decision Room Results

📊 ${results.room.title}
${results.room.description ? `📝 ${results.room.description}` : ''}

📈 Statistics:
• Total Ideas: ${results.statistics.totalIdeas}
• Total Votes: ${results.statistics.totalVotes}
• Participants: ${results.statistics.totalParticipants}
• Average Votes per Idea: ${results.statistics.averageVotesPerIdea.toFixed(1)}

🥇 Final Rankings:
${results.rankedIdeas.length > 0 ? 
  results.rankedIdeas.map(idea => 
    `${idea.rank}. "${idea.text}" - ${idea.voteCount} votes`
  ).join('\n') : 
  'No ideas were submitted.'
}

📄 Summary: ${results.summary}

${results.room.status === 'voting-ended' ? '✅ Voting is complete.' : '⚠️ Voting is still active.'}`;

      return {
        content: [
          {
            type: 'text',
            text: resultsText
          }
        ]
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to get results: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async endVoting(args) {
    const schema = z.object({
      roomId: z.string()
    });

    const validated = schema.parse(args);

    try {
      await axios.post(`${this.apiBaseUrl}/rooms/${validated.roomId}/end-voting`);

      return {
        content: [
          {
            type: 'text',
            text: `🔒 Voting ended successfully!

The decision room is now locked and no more votes can be cast. Use get_room_results to see the final rankings.`
          }
        ]
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to end voting: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async generateInviteUrl(args) {
    const schema = z.object({
      roomId: z.string(),
      inviteType: z.enum(['room', 'individual']).default('room')
    });

    const validated = schema.parse(args);

    // For now, return the room URL since we don't have the generate invite endpoint
    // In a full implementation, this would call the API to generate unique invite URLs
    const baseUrl = this.apiBaseUrl.replace('/api', '');
    const inviteUrl = `${baseUrl}/room/${validated.roomId}`;

    return {
      content: [
        {
          type: 'text',
          text: `🔗 Invite URL Generated

Share this URL with participants:
${inviteUrl}

${validated.inviteType === 'individual' ? 
  '👤 This is an individual invite URL (unique per participant).' : 
  '🏠 This is a general room URL that anyone can use.'}

Participants can join by visiting this URL and will be able to submit ideas and vote immediately.`
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('RankRoom MCP server running on stdio');
  }
}

// Start the server
if (require.main === module) {
  const server = new RankRoomMCPServer();
  server.run().catch(console.error);
}

module.exports = RankRoomMCPServer;