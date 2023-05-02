import {ViewProps} from 'react-native';

export type RtcLocalViewProps = ViewProps & {
	zOrderMediaOverlay?: boolean;
};

export type RtcRemoteViewProps = RtcLocalViewProps & {
	uid: number;
};
