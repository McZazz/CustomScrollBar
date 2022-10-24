export class GlobalScreenResizeUpdater {
	constructor() {

		this.update_set = new Set();

		window.addEventListener('resize', (event) => {
			this.update();
		});
	}

	addToUpdater = (obj) => {
		this.update_set.add(obj);
	}

	update = () => {
		this.update_set.forEach((update_me) => {
			update_me.screenResizeUpdate();
		});
	}
}