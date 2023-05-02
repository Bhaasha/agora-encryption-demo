import AgoraRTC, {
	AREAS,
	IAgoraRTCClient,
	IAgoraRTCRemoteUser,
	ICameraVideoTrack,
	IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";
import * as React from "react";
import {useState} from "react";
import {hexToAscii} from "./utils";
import {APP_ID, CHANNEL_ID, KEY, TOKEN} from "../../shared/config";

// Custom error used when a device is missing
export class MissingDeviceError extends Error {
	// We name it "code" here so that it's the same field name as AgoraRTCError. That way we can switch on the same field.
	readonly code: MissingDeviceErrorCode;
	constructor (code: MissingDeviceErrorCode) {
		super(code);
		this.code = code;
	}
}

type MissingDeviceErrorCode = "MISSING_AUDIO" | "MISSING_VIDEO";

AgoraRTC.setLogLevel(0);
AgoraRTC.setArea([AREAS.EUROPE]);

export const userTracks = {
	local: {
		audioTrack: null as IMicrophoneAudioTrack | null,
		videoTrack: null as ICameraVideoTrack | null,
	},
	users: [] as IAgoraRTCRemoteUser[],
};

export const useAgora = () => {
	const client = React.useRef<IAgoraRTCClient>();
	const [uid, setUid] = useState(0);
	const [usersInfo, setUsersInfo] = useState<any[]>([]);
	const [ready, setReady] = useState(false);

	const setUsers = React.useCallback(
		(users: IAgoraRTCRemoteUser[]) => {
			userTracks.users = users;
			// get the uids as number, because we know the react native part uses numbers and not uids
			setUsersInfo(users.map(({uid, hasAudio, hasVideo}) => ({hasAudio, hasVideo, id: uid as number})));
		},
		[],
	);

	const joinChannel = React.useCallback(
		() => {
			if (!client.current) {
				return console.error("Client could not be initialized");
			}

			// https://docs.agora.io/en/Video/channel_encryption_web_ng?platform=Web
			client.current.setEncryptionConfig("aes-128-gcm", hexToAscii(KEY));

			client.current.join(APP_ID, CHANNEL_ID, TOKEN)
				.then(uid => {
					if (!userTracks.local.audioTrack) {
						throw new MissingDeviceError("MISSING_AUDIO");
					}
					if (!userTracks.local.videoTrack) {
						throw new MissingDeviceError("MISSING_VIDEO");
					}
					return client.current!.publish([userTracks.local.audioTrack, userTracks.local.videoTrack])
						.then(() => uid);
				})
				.then(uid => setUid(uid as number))
				.catch(console.error);
		},
		[],
	);

	const leaveChannel = React.useCallback(
		() => {
			client.current?.leave().then(() => {
				userTracks.users = [];
				setUid(0);
			}).catch(console.error);
		},
		[client],
	);

	const initTracks = React.useCallback(
		() => AgoraRTC.getDevices()
			.then(devices => {
				const audioDevice = devices.find((device) => device.kind === "audioinput");
				const videoDevice = devices.find((device) => device.kind === "videoinput");

				if (!audioDevice) {
					throw new MissingDeviceError("MISSING_AUDIO");
				} else if (!videoDevice) {
					throw new MissingDeviceError("MISSING_VIDEO");
				}
				return Promise.all([
					AgoraRTC.createMicrophoneAudioTrack({microphoneId: audioDevice.deviceId}),
					AgoraRTC.createCameraVideoTrack({cameraId: videoDevice.deviceId}),
				]);
			})
			.then(([microphoneTrack, cameraTrack]) => {
				userTracks.local = {audioTrack: microphoneTrack, videoTrack: cameraTrack};
			}),
		[],
	);

	const stopPreview = React.useCallback(
		() => {
			userTracks.local?.audioTrack?.stop();
			userTracks.local?.audioTrack?.close();
			userTracks.local?.videoTrack?.stop();
			userTracks.local?.videoTrack?.close();
		},
		[],
	);

	React.useEffect(
		() => {
			if (!client.current) {
				client.current = AgoraRTC.createClient({codec: "h264", mode: "rtc"});
				initTracks().then(() => setReady(true)).catch(console.error);
			}

			const handleUserPublished = (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video"): void => {
				client.current!.subscribe(user, mediaType)
					.then(() => setUsers([...client.current!.remoteUsers]))
					.catch(console.error);
			};
			const handleUserUnpublished = (): void => setUsers([...client.current!.remoteUsers]);
			const handleUserJoined = (): void => setUsers([...client.current!.remoteUsers]);
			const handleUserLeft = (): void => setUsers([...client.current!.remoteUsers]);
			client.current.on("user-published", handleUserPublished);
			client.current.on("user-unpublished", handleUserUnpublished);
			client.current.on("user-joined", handleUserJoined);
			client.current.on("user-left", handleUserLeft);

			return () => {
				if (!client.current) {
					return;
				}
				client.current.off("user-published", handleUserPublished);
				client.current.off("user-unpublished", handleUserUnpublished);
				client.current.off("user-joined", handleUserJoined);
				client.current.off("user-left", handleUserLeft);
				leaveChannel();
				stopPreview();
			};
		},
		[client, setUsers, initTracks, leaveChannel, stopPreview],
	);

	return {
		joinChannel,
		joined: uid !== 0,
		leaveChannel,
		ready,
		users: usersInfo,
	};
};
