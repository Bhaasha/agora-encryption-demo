import {ILocalAudioTrack, ILocalVideoTrack, IRemoteAudioTrack, IRemoteVideoTrack} from "agora-rtc-sdk-ng";
import * as React from "react";

interface VideoPlayerProps {
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
		<div ref={container} {...props} style={{width: 300, height: 200}} />
	);
};
