export class GlobalDragListener {
	constructor() {
		this.drag_target = null;
		this.id = 'global_drag_listener';
		this.cntr = 0;

		this.moved = false;
	
		this.pos = {x:0,y:0}; // window event listener mosuemove, clientX and clientY === entire screen mousemove for drags
		this.dragging = 0; // 0=false, 1=true, 2=mouseup

		window.addEventListener('mousemove', (event) => { // putting on window allows dragging outside if left click is held!!!
			event.preventDefault();

			if (this.drag_target) {

				this.moved = true;
				this.dragging = true;
				this.cntr++;

				let new_x = event.clientX;
				let new_y = event.clientY;

				if (new_x !== this.pos.x || new_y !== this.pos.y) {

					this.pos.x = new_x;
					this.pos.y = new_y;

					// console.log(`X: ${this.pos.x}, Y: ${this.pos.y} | drag: ${this.dragging}`);
					this.transmitEvent();
				}
			}
		});

		window.addEventListener('mouseup', (event) => {
			event.preventDefault();

			if (this.drag_target) {
				this.cntr++;
			
				this.dragging = false;

				this.transmitEvent();
				this.unsetDragging();
				this.moved = false;
			}
		});

	}

	setDragging = (drag_target) => {
		this.drag_target = drag_target;
	}

	unsetDragging = () => {
		this.drag_target = null;
	}

	transmitEvent = () => {
		let pos = this.pos;
		let dragging = this.dragging;

		const data = {
			pos: pos,
			dragging: dragging,
		};

		this.drag_target.receiveDragEvent(data, this.moved);
	}
}