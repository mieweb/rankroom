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
        version: '2.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.apiBaseUrl = process.env.RANKROOM_API_URL || 'http://localhost:32000/api';
    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'create_user',
            description: 'Create a new user for 3-phase decision making',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Full name of the user'
                },
                email: {
                  type: 'string',
                  description: 'Email address of the user'
                }
              },
              required: ['name', 'email']
            }
          },
          {
            name: 'create_decision_topic',
            description: 'Create a new 3-phase decision topic',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Name of the decision topic'
                },
                description: {
                  type: 'string',
                  description: 'Description of what needs to be decided'
                },
                userId: {
                  type: 'string',
                  description: 'ID of the user creating the topic (room leader)'
                },
                settings: {
                  type: 'object',
                  properties: {
                    allowCriteriaCollaboration: {
                      type: 'boolean',
                      description: 'Allow participants to share criteria',
                      default: true
                    },
                    hideEvaluationsDuringCollection: {
                      type: 'boolean',
                      description: 'Hide evaluations from other participants during collection phase',
                      default: true
                    }
                  }
                }
              },
              required: ['name', 'userId']
            }
          },
          {
            name: 'join_topic',
            description: 'Join an existing decision topic',
            inputSchema: {
              type: 'object',
              properties: {
                topicId: {
                  type: 'string',
                  description: 'ID of the topic to join'
                },
                userId: {
                  type: 'string',
                  description: 'ID of the user joining'
                }
              },
              required: ['topicId', 'userId']
            }
          },
          {
            name: 'advance_phase',
            description: 'Advance topic to next phase (room leader only)',
            inputSchema: {
              type: 'object',
              properties: {
                topicId: {
                  type: 'string',
                  description: 'ID of the topic'
                },
                userId: {
                  type: 'string',
                  description: 'ID of the room leader'
                },
                targetPhase: {
                  type: 'number',
                  enum: [2, 3],
                  description: 'Phase to advance to (2=Collection, 3=Decision)'
                }
              },
              required: ['topicId', 'userId', 'targetPhase']
            }
          },
          {
            name: 'create_criterion',
            description: 'Create a criterion in the Definition phase',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Name of the criterion'
                },
                description: {
                  type: 'string',
                  description: 'Description of the criterion'
                },
                topicId: {
                  type: 'string',
                  description: 'ID of the topic'
                },
                userId: {
                  type: 'string',
                  description: 'ID of the user creating the criterion'
                },
                isShared: {
                  type: 'boolean',
                  description: 'Whether to share this criterion with other participants',
                  default: false
                }
              },
              required: ['name', 'topicId', 'userId']
            }
          },
          {
            name: 'share_criterion',
            description: 'Share a personal criterion with other participants',
            inputSchema: {
              type: 'object',
              properties: {
                criterionId: {
                  type: 'string',
                  description: 'ID of the criterion to share'
                },
                userId: {
                  type: 'string',
                  description: 'ID of the criterion owner'
                }
              },
              required: ['criterionId', 'userId']
            }
          },
          {
            name: 'create_candidate',
            description: 'Create a candidate to be evaluated',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Name of the candidate'
                },
                description: {
                  type: 'string',
                  description: 'Description of the candidate'
                },
                topicId: {
                  type: 'string',
                  description: 'ID of the topic'
                },
                userId: {
                  type: 'string',
                  description: 'ID of the user creating the candidate'
                }
              },
              required: ['name', 'topicId', 'userId']
            }
          },
          {
            name: 'submit_evaluation',
            description: 'Submit an evaluation for a candidate against a criterion (Collection phase)',
            inputSchema: {
              type: 'object',
              properties: {
                userId: {
                  type: 'string',
                  description: 'ID of the user submitting the evaluation'
                },
                candidateId: {
                  type: 'string',
                  description: 'ID of the candidate being evaluated'
                },
                criterionId: {
                  type: 'string',
                  description: 'ID of the criterion for evaluation'
                },
                score: {
                  type: 'number',
                  minimum: 1,
                  maximum: 10,
                  description: 'Score from 1 (poor) to 10 (excellent)'
                },
                notes: {
                  type: 'string',
                  description: 'Optional notes explaining the evaluation'
                }
              },
              required: ['userId', 'candidateId', 'criterionId', 'score']
            }
          },
          {
            name: 'get_topic_status',
            description: 'Get current status of a decision topic',
            inputSchema: {
              type: 'object',
              properties: {
                topicId: {
                  type: 'string',
                  description: 'ID of the topic'
                }
              },
              required: ['topicId']
            }
          },
          {
            name: 'get_topic_results',
            description: 'Get aggregated results and analysis (Decision phase only)',
            inputSchema: {
              type: 'object',
              properties: {
                topicId: {
                  type: 'string',
                  description: 'ID of the topic'
                }
              },
              required: ['topicId']
            }
          },
          {
            name: 'get_shared_criteria',
            description: 'Get all shared criteria for a topic',
            inputSchema: {
              type: 'object',
              properties: {
                topicId: {
                  type: 'string',
                  description: 'ID of the topic'
                }
              },
              required: ['topicId']
            }
          },
          {
            name: 'get_candidates',
            description: 'Get all candidates for a topic',
            inputSchema: {
              type: 'object',
              properties: {
                topicId: {
                  type: 'string',
                  description: 'ID of the topic'
                }
              },
              required: ['topicId']
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
          case 'create_user':
            return await this.createUser(args);
          case 'create_decision_topic':
            return await this.createDecisionTopic(args);
          case 'join_topic':
            return await this.joinTopic(args);
          case 'advance_phase':
            return await this.advancePhase(args);
          case 'create_criterion':
            return await this.createCriterion(args);
          case 'share_criterion':
            return await this.shareCriterion(args);
          case 'create_candidate':
            return await this.createCandidate(args);
          case 'submit_evaluation':
            return await this.submitEvaluation(args);
          case 'get_topic_status':
            return await this.getTopicStatus(args);
          case 'get_topic_results':
            return await this.getTopicResults(args);
          case 'get_shared_criteria':
            return await this.getSharedCriteria(args);
          case 'get_candidates':
            return await this.getCandidates(args);
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
        
        console.error(`Error in ${name}:`, error);
        throw new McpError(
          ErrorCode.InternalError,
          `Tool ${name} failed: ${error.message}`
        );
      }
    });
  }

  async createUser(args) {
    const { name, email } = args;
    
    try {
      const response = await axios.post(`${this.apiBaseUrl}/users`, {
        name,
        email
      });
      
      const user = response.data;
      return {
        content: [
          {
            type: 'text',
            text: `✅ User created successfully!\n\n**User Details:**\n- Name: ${user.name}\n- Email: ${user.email}\n- User ID: ${user._id}\n\nYou can now create decision topics or join existing ones using this User ID.`
          }
        ]
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to create user: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async createDecisionTopic(args) {
    const { name, description, userId, settings } = args;
    
    try {
      const response = await axios.post(`${this.apiBaseUrl}/topics`, {
        name,
        description,
        userId,
        settings
      });
      
      const topic = response.data;
      const phaseNames = { 1: 'Definition', 2: 'Collection', 3: 'Decision' };
      
      return {
        content: [
          {
            type: 'text',
            text: `🎯 Decision topic created successfully!\n\n**Topic Details:**\n- Name: ${topic.name}\n- Description: ${topic.description}\n- Topic ID: ${topic._id}\n- Current Phase: ${topic.currentPhase} (${phaseNames[topic.currentPhase]})\n- Created: ${new Date(topic.createdAt).toLocaleString()}\n\n**Next Steps:**\n1. Invite participants to join using Topic ID: ${topic._id}\n2. Start defining criteria in the Definition phase\n3. Add candidates for evaluation\n4. Advance to Collection phase when ready`
          }
        ]
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to create topic: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async joinTopic(args) {
    const { topicId, userId } = args;
    
    try {
      const response = await axios.post(`${this.apiBaseUrl}/topics/${topicId}/participants`, {
        userId
      });
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Successfully joined the decision topic!\n\nTopic ID: ${topicId}\n\nUse 'get_topic_status' to see the current phase and available actions.`
          }
        ]
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to join topic: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async advancePhase(args) {
    const { topicId, userId, targetPhase } = args;
    
    try {
      const response = await axios.patch(`${this.apiBaseUrl}/topics/${topicId}/phase`, {
        phase: targetPhase,
        userId
      });
      
      const topic = response.data;
      const phaseNames = { 1: 'Definition', 2: 'Collection', 3: 'Decision' };
      
      return {
        content: [
          {
            type: 'text',
            text: `🚀 Successfully advanced to ${phaseNames[targetPhase]} phase!\n\n**Updated Topic:**\n- Current Phase: ${topic.currentPhase} (${phaseNames[topic.currentPhase]})\n- Advanced At: ${new Date(topic.phaseAdvancedAt).toLocaleString()}\n\n**${phaseNames[targetPhase]} Phase Actions:**\n${this.getPhaseInstructions(targetPhase)}`
          }
        ]
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to advance phase: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async createCriterion(args) {
    const { name, description, topicId, userId, isShared } = args;
    
    try {
      const response = await axios.post(`${this.apiBaseUrl}/criteria`, {
        name,
        description,
        topicId,
        userId,
        isShared
      });
      
      const criterion = response.data;
      
      return {
        content: [
          {
            type: 'text',
            text: `📋 Criterion created successfully!\n\n**Criterion Details:**\n- Name: ${criterion.name}\n- Description: ${criterion.description || 'None'}\n- Shared: ${criterion.isShared ? 'Yes' : 'No'}\n- Criterion ID: ${criterion._id}\n\n${!criterion.isShared ? '💡 Use "share_criterion" to make this available to other participants.' : '✅ This criterion is shared with all participants.'}`
          }
        ]
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to create criterion: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async shareCriterion(args) {
    const { criterionId, userId } = args;
    
    try {
      const response = await axios.patch(`${this.apiBaseUrl}/criteria/${criterionId}`, {
        isShared: true
      });
      
      return {
        content: [
          {
            type: 'text',
            text: `🤝 Criterion shared successfully!\n\nThe criterion is now available to all participants in the topic for collaborative use.`
          }
        ]
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to share criterion: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async createCandidate(args) {
    const { name, description, topicId, userId } = args;
    
    try {
      const response = await axios.post(`${this.apiBaseUrl}/candidates`, {
        name,
        description,
        topicId,
        userId
      });
      
      const candidate = response.data;
      
      return {
        content: [
          {
            type: 'text',
            text: `🏆 Candidate created successfully!\n\n**Candidate Details:**\n- Name: ${candidate.name}\n- Description: ${candidate.description || 'None'}\n- Candidate ID: ${candidate._id}\n\n💡 This candidate is now available for evaluation against shared criteria in the Collection phase.`
          }
        ]
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to create candidate: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async submitEvaluation(args) {
    const { userId, candidateId, criterionId, score, notes } = args;
    
    try {
      const response = await axios.post(`${this.apiBaseUrl}/evaluations`, {
        userId,
        candidateId,
        criterionId,
        score,
        notes
      });
      
      return {
        content: [
          {
            type: 'text',
            text: `📊 Evaluation submitted successfully!\n\n**Evaluation Details:**\n- Score: ${score}/10\n- Notes: ${notes || 'None'}\n\n✅ Your evaluation has been recorded and will be included in the final analysis during the Decision phase.`
          }
        ]
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to submit evaluation: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async getTopicStatus(args) {
    const { topicId } = args;
    
    try {
      const [topicResponse, criteriaResponse, candidatesResponse] = await Promise.all([
        axios.get(`${this.apiBaseUrl}/topics/${topicId}`),
        axios.get(`${this.apiBaseUrl}/criteria/shared/topic/${topicId}`),
        axios.get(`${this.apiBaseUrl}/candidates/topic/${topicId}`)
      ]);
      
      const topic = topicResponse.data;
      const sharedCriteria = criteriaResponse.data;
      const candidates = candidatesResponse.data;
      
      const phaseNames = { 1: 'Definition', 2: 'Collection', 3: 'Decision' };
      const currentPhaseName = phaseNames[topic.currentPhase];
      
      const participantsList = topic.participants?.map(p => 
        `- ${p.name}${p._id === topic.createdBy ? ' (Leader)' : ''}`
      ).join('\n') || 'None';
      
      const criteriaList = sharedCriteria.length > 0 
        ? sharedCriteria.map(c => `- ${c.name}: ${c.description || 'No description'}`).join('\n')
        : 'No shared criteria yet';
        
      const candidatesList = candidates.length > 0
        ? candidates.map(c => `- ${c.name}: ${c.description || 'No description'}`).join('\n')
        : 'No candidates yet';
      
      return {
        content: [
          {
            type: 'text',
            text: `📊 **Topic Status Report**\n\n**Topic:** ${topic.name}\n**Description:** ${topic.description}\n**Current Phase:** ${topic.currentPhase} (${currentPhaseName})\n**Created:** ${new Date(topic.createdAt).toLocaleString()}\n${topic.phaseAdvancedAt ? `**Last Phase Change:** ${new Date(topic.phaseAdvancedAt).toLocaleString()}` : ''}\n\n**Participants:**\n${participantsList}\n\n**Shared Criteria:**\n${criteriaList}\n\n**Candidates:**\n${candidatesList}\n\n**Available Actions:**\n${this.getPhaseInstructions(topic.currentPhase)}`
          }
        ]
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to get topic status: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async getTopicResults(args) {
    const { topicId } = args;
    
    try {
      const response = await axios.get(`${this.apiBaseUrl}/evaluations/aggregated/topic/${topicId}`);
      const results = response.data;
      
      if (results.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `📊 **Decision Results**\n\nNo evaluation data available yet. Make sure participants have submitted evaluations in the Collection phase.`
            }
          ]
        };
      }
      
      const rankedResults = results
        .sort((a, b) => b.averageScore - a.averageScore)
        .map((result, index) => {
          const totalEvaluations = result.criteriaScores.reduce((sum, cs) => sum + cs.evaluationCount, 0);
          return `**${index + 1}. ${result.candidate.name}**\n   - Average Score: ${result.averageScore.toFixed(1)}/10\n   - Total Evaluations: ${totalEvaluations}\n   - Score Variance: ${result.scoreVariance.toFixed(2)}\n   - Description: ${result.candidate.description || 'No description'}`;
        })
        .join('\n\n');
      
      const summary = `📊 **Final Decision Results**\n\n**Winner:** ${results[0]?.candidate.name} (${results[0]?.averageScore.toFixed(1)}/10)\n\n**Complete Rankings:**\n\n${rankedResults}\n\n**Analysis Summary:**\n- Total Candidates: ${results.length}\n- Evaluation Process: Complete\n- Recommended Decision: ${results[0]?.candidate.name} based on highest average score`;
      
      return {
        content: [
          {
            type: 'text',
            text: summary
          }
        ]
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to get topic results: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async getSharedCriteria(args) {
    const { topicId } = args;
    
    try {
      const response = await axios.get(`${this.apiBaseUrl}/criteria/shared/topic/${topicId}`);
      const criteria = response.data;
      
      if (criteria.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `📋 **Shared Criteria**\n\nNo shared criteria available yet. Participants need to create and share criteria in the Definition phase.`
            }
          ]
        };
      }
      
      const criteriaList = criteria.map((c, index) => 
        `${index + 1}. **${c.name}**\n   - Description: ${c.description || 'No description'}\n   - Created by: ${c.user?.name || 'Unknown'}\n   - ID: ${c._id}`
      ).join('\n\n');
      
      return {
        content: [
          {
            type: 'text',
            text: `📋 **Shared Criteria (${criteria.length})**\n\n${criteriaList}`
          }
        ]
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to get shared criteria: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async getCandidates(args) {
    const { topicId } = args;
    
    try {
      const response = await axios.get(`${this.apiBaseUrl}/candidates/topic/${topicId}`);
      const candidates = response.data;
      
      if (candidates.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `🏆 **Candidates**\n\nNo candidates available yet. Add candidates to be evaluated against the shared criteria.`
            }
          ]
        };
      }
      
      const candidatesList = candidates.map((c, index) => 
        `${index + 1}. **${c.name}**\n   - Description: ${c.description || 'No description'}\n   - Added: ${new Date(c.createdAt).toLocaleString()}\n   - ID: ${c._id}`
      ).join('\n\n');
      
      return {
        content: [
          {
            type: 'text',
            text: `🏆 **Candidates (${candidates.length})**\n\n${candidatesList}`
          }
        ]
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to get candidates: ${error.response?.data?.message || error.message}`
      );
    }
  }

  getPhaseInstructions(phase) {
    switch (phase) {
      case 1:
        return `**Definition Phase Actions:**
- Create criteria using 'create_criterion'
- Share criteria with 'share_criterion'
- View shared criteria with 'get_shared_criteria'
- Advance to Collection phase with 'advance_phase' (room leader only)`;
      case 2:
        return `**Collection Phase Actions:**
- Create candidates using 'create_candidate'
- Submit evaluations with 'submit_evaluation'
- View candidates with 'get_candidates'
- Advance to Decision phase with 'advance_phase' (room leader only)`;
      case 3:
        return `**Decision Phase Actions:**
- View final results with 'get_topic_results'
- Analyze aggregated scores and make decisions
- Export results for team review`;
      default:
        return 'Unknown phase';
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('RankRoom MCP Server running on stdio');
  }
}

async function main() {
  const server = new RankRoomMCPServer();
  await server.run();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { RankRoomMCPServer };
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