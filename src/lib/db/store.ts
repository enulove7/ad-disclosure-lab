import type {
  Ad,
  AdImage,
  Condition,
  Experiment,
  Exposure,
  Game,
  GameAnswer,
  GameCard,
  GameSession,
  Participant,
  Response,
  SurveyItem,
} from "@/lib/types";

/** 모든 저장소 구현이 따르는 인터페이스. 로컬 JSON 파일과 Supabase 두 구현이 있다. */
export interface Store {
  // experiments
  listExperiments(): Promise<Experiment[]>;
  getExperiment(id: string): Promise<Experiment | null>;
  getExperimentBySlug(slug: string): Promise<Experiment | null>;
  createExperiment(data: Omit<Experiment, "id" | "created_at">): Promise<Experiment>;
  updateExperiment(id: string, patch: Partial<Experiment>): Promise<Experiment>;
  deleteExperiment(id: string): Promise<void>;

  // conditions
  listConditions(experimentId: string): Promise<Condition[]>;
  createCondition(data: Omit<Condition, "id">): Promise<Condition>;
  updateCondition(id: string, patch: Partial<Condition>): Promise<Condition>;
  deleteCondition(id: string): Promise<void>;

  // ads
  listAds(experimentId: string): Promise<Ad[]>;
  createAd(data: Omit<Ad, "id">): Promise<Ad>;
  updateAd(id: string, patch: Partial<Ad>): Promise<Ad>;
  deleteAd(id: string): Promise<void>;

  // ad images (AI 생성 후보)
  listAdImages(experimentId: string): Promise<AdImage[]>;
  createAdImage(data: Omit<AdImage, "id" | "created_at">): Promise<AdImage>;
  deleteAdImage(id: string): Promise<void>;

  // survey items
  listItems(experimentId: string): Promise<SurveyItem[]>;
  createItem(data: Omit<SurveyItem, "id">): Promise<SurveyItem>;
  updateItem(id: string, patch: Partial<SurveyItem>): Promise<SurveyItem>;
  deleteItem(id: string): Promise<void>;

  // participants
  listParticipants(experimentId: string): Promise<Participant[]>;
  getParticipantByToken(token: string): Promise<Participant | null>;
  createParticipant(data: Omit<Participant, "id">): Promise<Participant>;
  updateParticipant(id: string, patch: Partial<Participant>): Promise<Participant>;
  countParticipantsByCondition(experimentId: string): Promise<Record<string, number>>;

  // exposures
  createExposures(data: Omit<Exposure, "id">[]): Promise<Exposure[]>;
  listExposures(participantId: string): Promise<Exposure[]>;
  listExposuresByExperiment(experimentId: string): Promise<Exposure[]>;
  updateExposure(id: string, patch: Partial<Exposure>): Promise<Exposure>;

  // responses
  createResponses(data: Omit<Response, "id">[]): Promise<Response[]>;
  listResponses(participantId: string): Promise<Response[]>;
  listResponsesByExperiment(experimentId: string): Promise<Response[]>;

  // games
  listGames(): Promise<Game[]>;
  getGame(id: string): Promise<Game | null>;
  getGameBySlug(slug: string): Promise<Game | null>;
  createGame(data: Omit<Game, "id" | "created_at">): Promise<Game>;
  updateGame(id: string, patch: Partial<Game>): Promise<Game>;
  deleteGame(id: string): Promise<void>;
  listGameCards(gameId: string): Promise<GameCard[]>;
  createGameCard(data: Omit<GameCard, "id">): Promise<GameCard>;
  updateGameCard(id: string, patch: Partial<GameCard>): Promise<GameCard>;
  deleteGameCard(id: string): Promise<void>;
  createGameSession(data: Omit<GameSession, "id">): Promise<GameSession>;
  getGameSessionByToken(token: string): Promise<GameSession | null>;
  updateGameSession(id: string, patch: Partial<GameSession>): Promise<GameSession>;
  listGameSessions(gameId: string): Promise<GameSession[]>;
  createGameAnswer(data: Omit<GameAnswer, "id">): Promise<GameAnswer>;
  listGameAnswers(sessionId: string): Promise<GameAnswer[]>;
  listGameAnswersByGame(gameId: string): Promise<GameAnswer[]>;

  // files
  uploadImage(file: File, filename: string): Promise<string>;
}
