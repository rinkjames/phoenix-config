import { frameRatio } from './calc';
import { titleModal } from './modal';
import { enforceKeyhandlersEnabled } from './util';
import log from './logger';
import brightness from './misc/brightness';
import createCoffeTimer from './misc/coffee';
import { Scanner } from './scan';
import './window';
import './extend';
import './screen';

// Export handlers so that the references are kept within Phoenix
export let keyHandlers: KeyHandler[];
export let eventHandlers: EventHandler[];
export let modeKeyHandler: KeyHandler[];

let hyper: Phoenix.ModifierKey[] = ['cmd', 'ctrl', 'alt'];
let hyperShift: Phoenix.ModifierKey[] = ['cmd', 'ctrl', 'alt', 'shift'];
let scanner = new Scanner();

let coffeTimer = createCoffeTimer();

Phoenix.set({
	'daemon': true,
	'openAtLogin': true,
});

eventHandlers = [
	Phoenix.on('screensDidChange', () => {
		log('Screens changed');
	}),
];

keyHandlers = [
	Phoenix.bind('tab', hyper, () => {
		let win = Window.focusedWindow();
		if (!win) return;

		let oldScreen = win.screen();
		let newScreen = oldScreen.next();

		if (oldScreen.isEqual(newScreen)) return;

		let ratio = frameRatio(oldScreen.visibleFrameInRectangle(), newScreen.visibleFrameInRectangle());
		win.setFrame(ratio(win.frame()));
	}),

	Phoenix.bind('left', hyper, () => {
		let win = Window.focusedWindow();
		if (!win) return;

		let { width, height, x, y } = win.screen().visibleFrameInRectangle();
		width = Math.ceil(width / 2);
		win.setFrame({ width, height, x, y });
		win.clearUnmaximized();
	}),

	Phoenix.bind('right', hyper, () => {
		let win = Window.focusedWindow();
		if (!win) return;

		let { width, height, x, y } = win.screen().visibleFrameInRectangle();
		width /= 2;
		x += Math.ceil(width);
		width = Math.floor(width);

		win.setFrame({ width, height, x, y });
		win.clearUnmaximized();
	}),

	Phoenix.bind('up', hyper, () => {
		let win = Window.focusedWindow();
		if (!win) return;

		let { width, x } = win.frame();
		let { height, y } = win.screen().visibleFrameInRectangle();
		height = Math.ceil(height / 2);

		win.setFrame({ height, width, x, y });
		win.clearUnmaximized();
	}),

	Phoenix.bind('down', hyper, () => {
		let win = Window.focusedWindow();
		if (!win) return;

		let { width, x } = win.frame();
		let { height, y } = win.screen().visibleFrameInRectangle();
		height /= 2;
		[ height, y ] = [ Math.ceil(height), y + Math.floor(height) ];

		win.setFrame({ height, width, x, y });
		win.clearUnmaximized();
	}),

	Phoenix.bind('return', hyper, () => {
		Window.focusedWindow() && Window.focusedWindow().toggleMaximized();
	}),

	Phoenix.bind('left', hyperShift, () => {
		let win = Window.focusedWindow();
		if (!win) return;

		let { width, height, y } = win.frame();
		let { x } = win.screen().visibleFrameInRectangle();

		win.setFrame({ width, height, y, x });
	}),

	Phoenix.bind('right', hyperShift, () => {
		let win = Window.focusedWindow();
		if (!win) return;

		let { width, height, y } = win.frame();
		let { width: sWidth, x } = win.screen().visibleFrameInRectangle();

		win.setFrame({
			width, height, y,
			x: x + sWidth - width,
		});
	}),

	Phoenix.bind('up', hyperShift, () => {
		let win = Window.focusedWindow();
		if (!win) return;

		let { width, height, x } = win.frame();
		let { y } = win.screen().visibleFrameInRectangle();

		win.setFrame({ width, height, x, y });
	}),

	Phoenix.bind('down', hyperShift, () => {
		let win = Window.focusedWindow();
		if (!win) return;

		let { width, height, x } = win.frame();
		let { height: sHeight, y } = win.screen().visibleFrameInRectangle();

		win.setFrame({
			width, height, x,
			y: y + sHeight - height,
		});
	}),

	Phoenix.bind('return', hyperShift, () => {
		let win = Window.focusedWindow();
		if (!win) return;

		let { width, height } = win.frame();
		let { width: sWidth, height: sHeight, x, y } = win.screen().visibleFrameInRectangle();

		win.setFrame({
			width, height,
			x: x + (sWidth / 2) - (width / 2),
			y: y + (sHeight / 2) - (height / 2),
		});
	}),

	Phoenix.bind('§', [], toggleTerminal),

	Phoenix.bind('§', ['cmd'], () => {
		let win = Window.focusedWindow();
		if (win && win.app().name() !== 'Terminal') {
			return toggleTerminal();
		}

		let app = App.get('Terminal');
		let windows = app.windows();
		windows[windows.length - 1].focus();
	}),

	Phoenix.bind('delete', hyper, () => {
		let win = Window.focusedWindow();
		win && win.minimize();
	}),

	Phoenix.bind('m', hyper, () => {
		let s = Screen.at(Mouse.location());
		if (!s) return;

		log(s.identifier(), Mouse.location());
	}),

	Phoenix.bind('+', hyper, () => {
		brightness(+10);
	}),
	Phoenix.bind('-', hyper, () => {
		brightness(-10);
	}),

	Phoenix.bind('c', hyper, () => {
		if (coffeTimer.isRunning()) {
			coffeTimer.stop();
		} else {
			coffeTimer.start(Screen.mainScreen());
		}
	}),

	Phoenix.bind('space', hyper, () => {
		let m = new Modal();
		let msg = 'Search: ';
		m.message = msg;
		m.showCenterOn(Screen.mainScreen());
		scanner.scanln(s => {
			m.close();
		}, s => {
			m.message = msg + s;
			m.showCenterOn(Screen.mainScreen());
		});
	}),
];

titleModal('Phoenix (re)loaded!');

enforceKeyhandlersEnabled(keyHandlers);

function toggleTerminal() {
	let win = Window.focusedWindow();
	let term = App.get('Terminal');

	if (win && win.app().name() === 'Terminal') {
		return term.hide();
	}

	if (term && term.windows().length) {
		return term.focus();
	}

	App.launch('Terminal');
}
