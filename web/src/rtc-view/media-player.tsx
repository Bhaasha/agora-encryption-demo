import {ILocalAudioTrack, ILocalVideoTrack, IRemoteAudioTrack, IRemoteVideoTrack} from "agora-rtc-sdk-ng";
import * as React from "react";
import {StyleSheet, View, ViewProps} from "react-native";

interface VideoPlayerProps extends ViewProps {
	audioTrack?: ILocalAudioTrack | IRemoteAudioTrack | null;
	videoTrack?: ILocalVideoTrack | IRemoteVideoTrack | null;
}

export const MediaPlayer = ({videoTrack, audioTrack, ...props}: VideoPlayerProps): JSX.Element => {
	const container = React.useRef<HTMLDivElement>(null);
	React.useEffect(() => {
		if (!container.current) return;
		videoTrack?.play(container.current);
		return () => {
			videoTrack?.stop();
		};
	}, [container, videoTrack]);
	React.useEffect(() => {
		audioTrack?.play();
		return () => {
			audioTrack?.stop();
		};
	}, [audioTrack]);

	return (
		<View {...props}>
			<div ref={container} style={StyleSheet.absoluteFillObject} />
		</View>
	);
};
