import { ETwitterMediaType } from '@shared/enum/job.enum';

export interface TwitterUserInformationInterface {
  id?: string;
  name?: string;
  username?: string;
  profile_image_url?: string;
}

export interface TwitterReplyInterface {
  id?: string;
  media?: TwitterMediaInterface[];
  context?: string;
}

export interface TwitterMediaInterface {
  url: string;
  type: ETwitterMediaType;
}
