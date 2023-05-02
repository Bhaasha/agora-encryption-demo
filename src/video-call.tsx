import * as React from 'react';
import {useAgora} from './use-agora';
import {
	Button,
	LayoutChangeEvent,
	ScrollView,
	StatusBar,
	StyleSheet,
	View,
} from 'react-native';
import {RtcRemoteView} from './rtc-view/rtc-remote-view';
import {RtcLocalView} from './rtc-view/rtc-local-view';

const DEFAULT_SPACING = 18;
const SMALL_SPACING = 9;
const BLACK = '#000000';

const calculateLayout = (
	containerWidth: number,
	containerHeight: number,
	videoCount: number,
	aspectRatio: number = 16 / 9,
): {cols: number; height: number; width: number} => {
	let bestLayout = {
		area: 0,
		cols: 0,
		height: 0,
		rows: 0,
		width: 0,
	};

	// brute-force search layout where video occupy the largest area of the container
	for (let cols = 1; cols <= videoCount; cols++) {
		const rows = Math.ceil(videoCount / cols);
		const hScale = containerWidth / (cols * aspectRatio);
		const vScale = containerHeight / rows;
		let width;
		let height;
		if (hScale <= vScale) {
			width = Math.floor(containerWidth / cols);
			height = Math.floor(width / aspectRatio);
		} else {
			height = Math.floor(containerHeight / rows);
			width = Math.floor(height * aspectRatio);
		}
		const area = width * height;
		if (area > bestLayout.area) {
			bestLayout = {
				area,
				cols,
				height,
				rows,
				width,
			};
		}
	}
	return bestLayout;
};

export const VideoCall = (): JSX.Element => {
	const {joinChannel, joined, leaveChannel, users} = useAgora();

	const [layout, setLayout] = React.useState<{height: number; width: number}>();

	const onLayout = React.useCallback((event: LayoutChangeEvent) => {
		const {width, height} = event.nativeEvent.layout;
		setLayout({height, width});
	}, []);

	if (!joined) {
		return (
			<View style={styles.contentContainer}>
				<Button title="Join channel" onPress={joinChannel} />
			</View>
		);
	}

	const userCount = users.length + 1; // +1 for self
	const containerWidth = (layout?.width ?? 0) - DEFAULT_SPACING; // - DEFAULT_SPACING Because of padding
	const containerHeight = (layout?.height ?? 0) - DEFAULT_SPACING; // - DEFAULT_SPACING Because of padding
	const {width, height} = calculateLayout(
		containerWidth,
		containerHeight,
		userCount,
	);
	const userContainerStyle = layout && {height, width};

	return (
		<>
			<StatusBar backgroundColor={BLACK} barStyle="light-content" />
			<View style={styles.container}>
				<ScrollView
					onLayout={onLayout}
					style={styles.container}
					contentContainerStyle={styles.contentContainer}>
					<View style={styles.usersContainer}>
						{users.length > 0 &&
							users.map(({id}, index) => (
								<View key={index} style={[styles.userView, userContainerStyle]}>
									<RtcRemoteView
										style={styles.rtcView}
										uid={id}
										zOrderMediaOverlay
									/>
								</View>
							))}
						<View style={[styles.userView, userContainerStyle]}>
							<RtcLocalView style={styles.rtcView} />
						</View>
					</View>
					<Button title="Leave channel" onPress={leaveChannel} />
				</ScrollView>
			</View>
		</>
	);
};

const styles = StyleSheet.create({
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
});
