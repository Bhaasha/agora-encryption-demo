import * as React from 'react';
import {RtcSurfaceView} from 'react-native-agora';
import {RtcLocalViewProps} from './rtc-view-props';

// uid is 0 -> local user (https://docs.agora.io/en/video-calling/get-started/get-started-sdk?platform=react-native)
export const RtcLocalView: React.FC<RtcLocalViewProps> = props => (
	<RtcSurfaceView canvas={{uid: 0}} {...props} />
);
