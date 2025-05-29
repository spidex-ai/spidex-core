import { EUserPointLogType } from "@database/entities/user-point-log.entity";
import { EUserPointType } from "@modules/user-point/user-point.constant";

export interface IUserPointChangeEvent {
    userId: number;
    amount: string;
    type: EUserPointType;
    logType: EUserPointLogType;
    userQuestId?: number;
    myReferralId?: number;
    referralIdOfReferee?: number;
    plusToReferral?: boolean;
}
