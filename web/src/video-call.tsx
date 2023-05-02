import * as React from 'react';
import {useAgora} from './use-agora';
import {RtcRemoteView} from './rtc-view/rtc-remote-view';
import {RtcLocalView} from './rtc-view/rtc-local-view';

const DEFAULT_SPACING = 18;
const SMALL_SPACING = 9;
const BLACK = '#000000';

export const VideoCall = (): JSX.Element => {
	const {joinChannel, joined, leaveChannel, users} = useAgora();

	console.log("joined", joined);

	if (!joined) {
		return (
			<div style={styles.contentContainer}>
				<input type="button" onClick={joinChannel} value="Join channel" />
			</div>
		);
	}
	return (
		<div style={styles.container}>
			<div>
				{users.length > 0 &&
					users.map(({id}, index) => (
						<div key={index}>
							<RtcRemoteView
								style={styles.rtcView}
								uid={id}
								zOrderMediaOverlay
							/>
						</div>
					))}
				<div style={styles.userView}>
					<RtcLocalView style={styles.rtcView} />
				</div>
				</div>
			<input type="button" onClick={leaveChannel} value="Leave channel"/>
		</div>
	);
};

const styles = {
	container: {
		backgroundColor: BLACK,
		flex: 1,
	},
	contentContainer: {
		alignItems: 'center',
		flexGrow: 1,
		justifyContent: 'center',
	},
	rtcView: {
		height: '100%',
		width: '100%',
	},
	userView: {
		borderColor: BLACK,
		borderRadius: DEFAULT_SPACING,
		borderWidth: SMALL_SPACING / 2,
		overflow: 'hidden',
	},
	usersContainer: {
		alignItems: 'center',
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		padding: SMALL_SPACING,
	},
};
