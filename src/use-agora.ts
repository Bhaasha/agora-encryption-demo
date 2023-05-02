import * as React from 'react';
// eslint-disable-next-line react-native/split-platform-components
import {
	Permission,
	PermissionsAndroid,
	PermissionStatus,
	Platform,
} from 'react-native';
import {
	AreaCode,
	ChannelProfileType,
	ClientRoleType,
	createAgoraRtcEngine,
	EncryptionMode,
	IRtcEngine,
	LogLevel,
	RemoteAudioState,
	RemoteVideoState,
} from 'react-native-agora';
import {AGORA_APP_ID} from './config';
import {hexToAscii} from './utils';
import {
	AgoraUser,
	InitState,
	UNSET_UID,
	UseAgoraType,
} from './use-agora.common';

const requestCameraAndAudioPermission = (): Promise<
	{[key in Permission]: PermissionStatus} | void
> =>
	Platform.OS === 'android'
		? PermissionsAndroid.requestMultiple([
				PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
				PermissionsAndroid.PERMISSIONS.CAMERA,
		  ])
		: Promise.resolve();

export const useAgora: UseAgoraType = (
	channelId: string,
	token: string,
	secret?: string,
) => {
	const engine = React.useRef<IRtcEngine>();
	const [initState, setInitState] = React.useState<InitState>({
		status: 'initializing',
	});
	const [currentUid, setCurrentUid] = React.useState(UNSET_UID);
	const [users, setUsers] = React.useState<AgoraUser[]>([]);

	const addListeners = React.useCallback(() => {
		engine.current?.addListener('onError', errorCode => {
			console.error(errorCode);
		});
		engine.current?.addListener('onJoinChannelSuccess', ({localUid}) =>
			setCurrentUid(localUid!),
		);
		engine.current?.addListener('onUserJoined', (_, uid) =>
			setUsers(prev => [...prev, {hasAudio: true, hasVideo: true, id: uid}]),
		);
		engine.current?.addListener(
			'onRemoteAudioStateChanged',
			(_, uid, reason) => {
				if (reason === RemoteAudioState.RemoteAudioStateStopped) {
					setUsers(prev =>
						prev.map(user =>
							user.id === uid ? {...user, hasAudio: false} : user,
						),
					);
				}
				if (reason === RemoteAudioState.RemoteAudioStateDecoding) {
					setUsers(prev =>
						prev.map(user =>
							user.id === uid ? {...user, hasAudio: true} : user,
						),
					);
				}
			},
		);
		engine.current?.addListener(
			'onRemoteVideoStateChanged',
			(_, uid, reason) => {
				if (reason === RemoteVideoState.RemoteVideoStateStopped) {
					setUsers(prev =>
						prev.map(user =>
							user.id === uid ? {...user, hasVideo: false} : user,
						),
					);
				}
				if (reason === RemoteVideoState.RemoteVideoStateDecoding) {
					setUsers(prev =>
						prev.map(user =>
							user.id === uid ? {...user, hasVideo: true} : user,
						),
					);
				}
			},
		);
		engine.current?.addListener('onUserOffline', (_, uid) =>
			setUsers(prev => prev.filter(({id}) => id !== uid)),
		);
		engine.current?.addListener('onLeaveChannel', () => {
			setCurrentUid(UNSET_UID);
			setUsers([]);
		});
	}, []);

	const removeListeners = React.useCallback(() => {
		engine.current?.removeAllListeners('onError');
		engine.current?.removeAllListeners('onJoinChannelSuccess');
		engine.current?.removeAllListeners('onUserJoined');
		engine.current?.removeAllListeners('onUserOffline');
		engine.current?.removeAllListeners('onLeaveChannel');
	}, []);

	const initEngine = React.useCallback(
		() =>
			requestCameraAndAudioPermission()
				.then(() => createAgoraRtcEngine())
				.then(newEngine => {
					engine.current = newEngine;
					newEngine.initialize({
						appId: AGORA_APP_ID,
						areaCode: AreaCode.AreaCodeEu,
						logConfig: {level: LogLevel.LogLevelInfo},
					});
					addListeners();
				})
				.then(() => engine.current?.enableVideo())
				.then(() => engine.current?.startPreview())
				.then(() =>
					engine.current?.setChannelProfile(
						ChannelProfileType.ChannelProfileLiveBroadcasting,
					),
				)
				.then(() =>
					engine.current?.setClientRole(ClientRoleType.ClientRoleBroadcaster),
				),
		[addListeners],
	);

	const joinChannel = React.useCallback(() => {
		if (secret) {
			const encryptionKey =
				'3fec184026b596204eb478afab3f5242fb0a07b4e0cc32a717f01e0fd8694d62';
			const asciiKey = hexToAscii(encryptionKey);
			const encryptionKdfSalt = new Array(32).fill(1, 0, 32);
			console.log({encryptionKey, asciiKey});
			const res = engine.current?.enableEncryption(true, {
				encryptionKey: asciiKey,
				encryptionMode: EncryptionMode.Aes128Gcm,
				encryptionKdfSalt,
			});
			console.log(res);
		}
		const res = engine.current?.joinChannel(token, channelId, 0, {});
		// onError will not be called for this specific case, so we need to handle it here
		if (res === undefined || res < 0) {
			console.error('Error: could not join channel', {
				channelId,
				code: res,
				secret,
				token,
			});
		}
	}, [channelId, secret, token]);

	const leaveChannel = React.useCallback(
		() => engine.current?.leaveChannel(),
		[],
	);
	React.useEffect(() => {
		initEngine()
			.then(() => setInitState({status: 'ready'}))
			.catch(console.error);
		return () => {
			leaveChannel();
			removeListeners();
		};
	}, [initEngine, joinChannel, leaveChannel, removeListeners]);

	return {
		initState,
		joinChannel,
		joined: currentUid !== UNSET_UID,
		leaveChannel,
		uid: currentUid,
		users,
	};
};
