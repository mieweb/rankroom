export interface RankRoomOptions {
  containerId?: string;
  serverUrl?: string;
  theme?: 'default' | string;
  mode?: '3-phase' | 'voting';
  initialTopic?: string;
}

export interface TopicConfig {
  name: string;
  description?: string;
  settings?: {
    allowCriteriaCollaboration?: boolean;
    hideEvaluationsDuringCollection?: boolean;
  };
}

export interface Topic {
  _id: string;
  name: string;
  description: string;
  currentPhase: 1 | 2 | 3; // Definition, Collection, Decision
  createdBy: string;
  participants: User[];
  settings: {
    allowCriteriaCollaboration: boolean;
    hideEvaluationsDuringCollection: boolean;
  };
  createdAt: Date;
  phaseAdvancedAt?: Date;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  topics: string[];
  createdAt: Date;
}

export interface Criterion {
  _id: string;
  name: string;
  description: string;
  topic: string;
  user: string;
  rank: number;
  isShared: boolean;
  createdAt: Date;
}

export interface Candidate {
  _id: string;
  name: string;
  description: string;
  topic: string;
  createdAt: Date;
}

export interface Evaluation {
  _id: string;
  user: string;
  candidate: string;
  criterion: string;
  score: number; // 1-10
  notes: string;
  createdAt: Date;
}

export interface AggregatedResult {
  candidate: Candidate;
  averageScore: number;
  scoreVariance: number;
  totalEvaluations: number;
  criteriaScores: {
    criterion: Criterion;
    averageScore: number;
    variance: number;
    evaluationCount: number;
  }[];
}

export interface WidgetConfig {
  topic?: TopicConfig;
  serverUrl?: string;
  theme?: string;
  mode?: '3-phase' | 'voting';
}

// Legacy interfaces for backward compatibility
export interface RoomConfig {
  title: string;
  description?: string;
  votingSystem: 'dot-voting' | 'first-past-the-post' | 'alternative-voting';
  votesPerParticipant: number;
  phases?: {
    ideaSubmission?: boolean;
    voting?: boolean;
    combined?: boolean;
  };
  authentication?: 'anonymous' | 'required' | 'sso';
}

export interface Room {
  _id: string;
  title: string;
  description: string;
  createdBy: string;
  votingSystem: string;
  votesPerParticipant: number;
  phases: {
    ideaSubmission: boolean;
    voting: boolean;
    combined: boolean;
  };
  authentication: string;
  status: 'active' | 'voting-ended' | 'destroyed';
  participants: string[];
  inviteUrls: InviteUrl[];
  createdAt: Date;
  endedAt?: Date;
  ideas: Idea[];
}

export interface Idea {
  _id: string;
  roomId: string;
  text: string;
  submittedBy: string;
  submittedAt: Date;
  voteCount: number;
}

export interface Vote {
  _id: string;
  roomId: string;
  ideaId: string;
  participantId: string;
  votedAt: Date;
}

export interface Participant {
  _id: string;
  roomId: string;
  participantId: string;
  name: string;
  joinedAt: Date;
  isAnonymous: boolean;
}

export interface InviteUrl {
  id: string;
  type: 'room' | 'individual';
  url: string;
  createdAt: Date;
  usedBy: string[];
}

export declare class RankRoomWidget {
  constructor(options?: RankRoomOptions);
  
  init(): void;
  render(): void;
  destroy(): void;
  
  // 3-phase methods
  selectCandidate(candidateId: string): void;
  shareCriterion(criterionId: string): Promise<void>;
  getEvaluation(criterionId: string, candidateId: string): Evaluation | null;
  refreshTopic(): void;
  
  // Legacy methods for backward compatibility
  joinRoom(roomId: string, participantData?: { name?: string }): Promise<void>;
  vote(ideaId: string): Promise<void>;
  refreshRoom(): Promise<void>;
  
  static create(options?: RankRoomOptions): RankRoomWidget;
  static fromConfig(config: WidgetConfig, containerId: string): RankRoomWidget;
}

export default RankRoomWidget;