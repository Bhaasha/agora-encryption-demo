import * as React from "react";
import {userTracks} from "../use-agora";
import {MediaPlayer} from "./media-player";
import {RtcRemoteViewProps} from "../../../shared/rtc-view-props";

export const RtcRemoteView: React.FC<RtcRemoteViewProps> = ({uid, ...props}) => {
	const user = userTracks.users.find(u => u.uid === uid);
	return <MediaPlayer audioTrack={user?.audioTrack} videoTrack={user?.videoTrack} {...props}/>;
};
