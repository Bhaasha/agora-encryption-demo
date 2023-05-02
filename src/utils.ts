export const hexToAscii = (hexx: string): string => {
	const hex = hexx.toString(); // force conversion
	let str = '';
	for (let i = 0; i < hex.length; i += 2) {
		str += String.fromCodePoint(Number.parseInt(hex.slice(i, i + 2), 16));
	}
	return str;
};
