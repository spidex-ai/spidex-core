export interface ICreateAgentInterface {
  agentName: string;
  voiceId: string;
  language: string;
  languageCode: string;
  bio?: string;
  ageGroup?: string;
  answerStyle?: string;
  personality?: string;
  behavior?: string;
  goal?: string;
  mission?: string;
  likes?: string;
  dislikes?: string;
  prompt?: string;
}
