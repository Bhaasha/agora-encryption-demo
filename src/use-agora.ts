import * as React from 'react';
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
} from 'react-native-agora';
import {hexToAscii} from './utils';
import {AgoraUser, UNSET_UID, UseAgoraType} from './rtc-view/use-agora.common';
import {APP_ID, CHANNEL_ID, KEY, TOKEN} from '../config';

const requestCameraAndAudioPermission = (): Promise<
	{[key in Permission]: PermissionStatus} | void
> =>
	Platform.OS === 'android'
		? PermissionsAndroid.requestMultiple([
				PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
				PermissionsAndroid.PERMISSIONS.CAMERA,
		  ])
		: Promise.resolve();

export const useAgora: UseAgoraType = () => {
	const engine = React.useRef<IRtcEngine>();
	const [currentUid, setCurrentUid] = React.useState(UNSET_UID);
	const [users, setUsers] = React.useState<AgoraUser[]>([]);

	const joinChannel = React.useCallback(() => {
		const encryptionKdfSalt = new Array(32).fill(1, 0, 32);
		const asciiKey = hexToAscii(KEY);

		const encryptionRes = engine.current?.enableEncryption(true, {
			/*
			 * Here you can try to use either KEY or asciiKey.
			 * To connect with web users, you need to use asciiKey, as the web uses the ascii version.
			 * - If you use KEY directly, then both android and iOS users can join the channel together, but not connect with
			 *   web users.
			 * - If you use asciiKey, then you will be able to join the channel with android and talk with web users. But not
			 *   iOS (this part also worked in version 3 of react-native-agora, but not anymore in version 4).
			 */
			encryptionKey: asciiKey,
			encryptionMode: EncryptionMode.Aes128Gcm,
			encryptionKdfSalt,
		});
		console.log(encryptionRes);

		const joinResult = engine.current?.joinChannel(TOKEN, CHANNEL_ID, 0, {});
		// onError will not be called for this specific case, so we need to handle it here
		if (joinResult === undefined || joinResult < 0) {
			console.error('Error: could not join channel', joinResult);
		}
	}, []);

	const leaveChannel = React.useCallback(
		() => engine.current?.leaveChannel(),
		[],
	);

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
						appId: APP_ID,
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

	React.useEffect(() => {
		initEngine().catch(console.error);
		return () => {
			leaveChannel();
			removeListeners();
		};
	}, [initEngine, joinChannel, leaveChannel, removeListeners]);

	return {
		joinChannel,
		joined: currentUid !== UNSET_UID,
		leaveChannel,
		users,
	};
};
