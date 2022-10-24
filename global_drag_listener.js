export class GlobalDragListener {
	constructor() {
		this.id = 'global_drag_listener';

		this.drag_target = null;
		this.moved = false;
		this.pos = {x:0,y:0}; // window event listener mosuemove, clientX and clientY === entire screen mousemove for drags
		this.dragging = false; 

		window.addEventListener('mousemove', (event) => { // putting on window allows dragging outside if left click is held!!!
			event.preventDefault();

			if (this.drag_target) {

				this.moved = true;
				this.dragging = true;

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

		// window.addEventListener('mousedown', (event) => {
		// 	// event.stopPropagation();
			// console.log(event.target.getAttribute('_parent_obj'));


		// 	// this is needed to prevent cross-element polution that happens when doing mouseup over elements other than
		// 	// the ones originally clicked, or on other computer screens.
		// 	// DOM would treat other elements in this situation like some combo of an img (dragging ghosted images of divs) and would polute
		// 	// position data and cause erratic drag behavior of draggable items.
		// });

		window.addEventListener('mouseup', (event) => {
			// console.log(event.target.getAttribute('_parent_obj'));
			console.log(event.target);

			event.preventDefault();

			if (this.drag_target) {
			
				this.dragging = false;

				this.transmitEvent();

				// reset properties
				this.moved = false;
				this.drag_target = null;
				this.pos = {x:0,y:0};
			}
		});

	}

	setDragging = (drag_target) => {
		this.drag_target = drag_target;
	}

	transmitEvent = () => {
		let pos = this.pos;
		let dragging = this.dragging;
		let moved = this.moved;

		const data = {
			pos: pos,
			dragging: dragging,
			moved: moved
		};

		this.drag_target.receiveDragEvent(data);
	}
}