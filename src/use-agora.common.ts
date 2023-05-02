// Agora uids range from 1 to 2^31 - 1, so we can use the 0 value to express we don't have any uid.
export const UNSET_UID = 0;

export interface AgoraUser {
	hasAudio: boolean;
	hasVideo: boolean;
	id: number;
}

export type UseAgoraType = () => {
	joinChannel: () => void;
	joined: boolean;
	leaveChannel: () => void;
	uid: number;
	users: AgoraUser[];
};
