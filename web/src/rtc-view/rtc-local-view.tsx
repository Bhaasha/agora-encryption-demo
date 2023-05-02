import * as React from "react";
import {userTracks} from "../use-agora";
import {MediaPlayer} from "./media-player";
import {RtcLocalViewProps} from '../../../shared/rtc-view-props';

export const RtcLocalView: React.FC<RtcLocalViewProps> = (props) =>
	<MediaPlayer videoTrack={userTracks.local?.videoTrack} {...props}/>;
