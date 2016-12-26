export default function log(...args: any[]): void {
	args = args.map((arg) => stringify(arg));
	Phoenix.log(...args);
}

function stringify(value: any) {
	switch (typeof value) {
		case 'object':
			return '\n' + JSON.stringify(value, null, 2);
		case 'function':
			return value.toString();
		default:
			return value;
	}
}
