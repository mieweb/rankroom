export interface RankRoomOptions {
  containerId?: string;
  serverUrl?: string;
  theme?: 'default' | string;
  initialRoom?: string;
}

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

export interface WidgetConfig {
  room?: RoomConfig;
  serverUrl?: string;
  theme?: string;
}

export declare class RankRoomWidget {
  constructor(options?: RankRoomOptions);
  
  init(): void;
  render(): void;
  destroy(): void;
  
  joinRoom(roomId: string, participantData?: { name?: string }): Promise<void>;
  vote(ideaId: string): Promise<void>;
  refreshRoom(): Promise<void>;
  
  static create(options?: RankRoomOptions): RankRoomWidget;
  static fromConfig(config: WidgetConfig, containerId: string): RankRoomWidget;
}

export default RankRoomWidget;