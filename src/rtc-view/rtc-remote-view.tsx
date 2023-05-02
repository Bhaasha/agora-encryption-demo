import * as React from 'react';
import {RtcSurfaceView} from 'react-native-agora';
import {RtcRemoteViewProps} from '../../shared/rtc-view-props';

export const RtcRemoteView: React.FC<RtcRemoteViewProps> = ({
	uid,
	...props
}) => <RtcSurfaceView canvas={{uid}} {...props} />;
