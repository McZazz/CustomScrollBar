import { makeElement, setAnimStyles } from './utils.js';

export class ScrollBar {
	constructor({
								global_drag_listener=null, 
								id='', 
								side='', 
								track_thickness='', 
								track_styles=[], 
								bar_styles=[], 
								anim_styles={
									subclass_name: '',
									bar_normal: '',
									bar_hover: '',
									bar_active: ''
								},
								container=null,
								scroll_cont=null, 
								scroll_drawer=null,
								scroll_hides=false,
								disable_wheel=false
							}={}) {

		this.global_drag_listener = global_drag_listener;
		this.id = id;

		this.init_now = true;

		this.is_vertical = null;
		this.length_side = null;
		this.bar_pos_side = null;
		this.drag_dir = null;
		this.width_side = null;
		if (side === 'left' || side === 'right') {
			this.is_vertical = true;
			this.length_side = 'height';
			this.width_side = 'width';
			this.bar_pos_side = 'top';
			this.drag_dir = 'y';
		} else {
			this.is_vertical = false;
			this.length_side = 'width';
			this.width_side = 'height';
			this.bar_pos_side = 'left';
			this.drag_dir = 'x';
		}

		this.bar_classname = '';

		// for hover / active background colors
		if ((anim_styles.bar_normal !== undefined && anim_styles.bar_normal !== '') || 
			(anim_styles.bar_hover !== undefined && anim_styles.bar_hover !== '') || 
			(anim_styles.bar_active !== undefined && anim_styles.bar_active !== '')) {

			let classname = 'scrollbar';
			let styles = '';

			if (anim_styles.subclass_name !== undefined && anim_styles.subclass_name !== '') {
				classname = `scrollbar_${anim_styles.subclass_name}`;
			}

			if (anim_styles.bar_normal !== undefined && anim_styles.bar_normal !== '') {
				styles += `.${classname} {` +
											`background: ${anim_styles.bar_normal};` +
									`}`;
			}
			if (anim_styles.bar_hover !== undefined && anim_styles.bar_hover !== '') {
				styles += ` .${classname}:hover {` +
											`background: ${anim_styles.bar_hover};` +
									`}`;
			}
			if (anim_styles.bar_active !== undefined && anim_styles.bar_active !== '') {
				styles += ` .${classname}:active {` +
											`background: ${anim_styles.bar_active};` +
									`}`;
			}
			
			this.bar_classname = classname;
			setAnimStyles(classname, styles);
		}

		this.side = side;

		this.scrollcont_at_start = null;
		this.scrollcont_at_stop = null;
		if (this.side === 'left' || this.side === 'top') {
			this.scrollcont_at_start = true;
		} else {
			this.scrollcont_at_stop = false;
		}

		this.track_thickness = track_thickness;
		this.container = container; // container for this scrollbar and the below scroll_cont

		this.scroll_cont = scroll_cont;
		this.scroll_drawer = scroll_drawer;
		// this.getTrackLength(this.container);
		this.drawer_loc = 0; 
		this.bar_pos = 0;
		this.scroll_hides = scroll_hides;
		this.disable_wheel = disable_wheel;
		this.wheel_mult = 20;
		this.track_click_bar_move_overshoot = 5;

		this.x = null;
		this.y = null;

		// these are added at the end of the param arrays by similar name
		if (this.is_vertical === true) {
			track_styles = track_styles.concat([['position', 'relative'], ['height', '100%'], ['width', track_thickness]]);
			bar_styles = bar_styles.concat([['position', 'absolute'], ['height', '25%'], ['width', '100%']]);
		} else {
			track_styles = track_styles.concat([['position', 'relative'], ['width', '100%'], ['height', track_thickness]]);
			bar_styles = bar_styles.concat([['position', 'absolute'], ['width', '25%'], ['height', '100%']]);
		}

		this.track_styles = track_styles;
		this.bar_styles = bar_styles;

		// create track element
		let track = makeElement({type:'div', styles:this.track_styles});
		this.track = track;

		// create bar element
		let bar = makeElement({type:'div', styles:this.bar_styles});
		bar.setAttribute('_parent_obj', this.id);
		this.bar = bar;


		//------------ Listeners

		this.bar.addEventListener('mousedown', (event) => {
			event.preventDefault();

			this.x = event.clientX;
			this.y = event.clientY;

			// console.log('init click xy',this.x,this.y);
			this.global_drag_listener.setDragging(this);

		});


		this.container.addEventListener('wheel', (event) => {

			if (!this.disable_wheel) {
				this.resetBoundingRects();

				let amt = 0;
	      // event.preventDefault();
	      if (event.wheelDelta > 0) {
	        amt -= 1;
	      } else {
	        amt += 1;
	    	}

	    	let bar_percent = this.barPercentOfTrack();
	    	// console.log('bar_percent', bar_percent);

	    	amt *= this.wheel_mult * bar_percent;

	    	this.moveBar(amt, false);

	    	// this.setScrolledAreaFromBar();
			}
		});

		this.track.addEventListener('click', (event) => {

			if (event.target === this.track) {
				this.resetBoundingRects();
				this.trackClickSetsBar(event);
			}
		});

		track.appendChild(bar);
		this.cont = this.track;

		if (this.bar_classname !== '') {
			this.bar.classList = this.bar_classname;
		}

		// set sizes and append
		this.resetBoundingRects();
		this.setBarSize();

		// console.log('track:', this.container_size.bottom, 'bar:', this.bar_size.bottom);
	}

	screenResizeUpdate = () => {

		let start_scrollarea_loc_percent = this.bar_pos / this.getEmptyTracklength();
		this.resetBoundingRects();
		// percent is "the way down" for the bar, and "the way up" for drawer

		this.setBarSize();
		this.resetBoundingRects();

		this.forceBarPosWithPercent(start_scrollarea_loc_percent);

	}

	roundToTwo = (num) => {
		return Number.parseInt(num * 100) / 100;
	}	

	forceContainerNotSmall = () => {
		this.resetBoundingRects();
		if (this.container_size[this.length_side] < this.bar_size[this.width_side] * 2) {
			this.container.style.minHeight = `${this.bar_size[this.width_side] * 2}px`;
		}
	}

	forceBarPosWithPercent = (percent) => {
		if (percent > 1) {
			percent = 1;
		}

		let travelable_area = this.track_size[this.length_side] - this.bar_size[this.length_side];
		let new_bar_pos = travelable_area * percent;

		// once number gets tiny, the next step delivers NaN if we don't adjust it first
		if (!new_bar_pos || new_bar_pos < 0) {
			new_bar_pos = 0;
		}

		this.bar_pos = new_bar_pos;
		this.bar.style[this.bar_pos_side] = `${this.roundToTwo(this.bar_pos)}px`;

		this.setScrolledAreaFromBar();
		this.forceContainerNotSmall();
		// console.log('did it',new_bar_pos);

	}


	barPercentOfTrack = () => {
		return this.bar_size[this.length_side] / this.track_size[this.length_side];
	}

	trackClickSetsBar = (event) => {

		let click = {
			x: event.clientX,
			y: event.clientY
		}

		let bar_pos = this.bar_pos;
		let bar_height = this.bar_size.height;

		let clicked_before = (click[this.drag_dir] - this.track_size[this.bar_pos_side]) - this.bar_pos < 0;

		let new_bar_pos = -1;

		if (clicked_before) {
			new_bar_pos = click[this.drag_dir] - this.track_size[this.bar_pos_side] - this.track_click_bar_move_overshoot;
			if (new_bar_pos < 0 || new_bar_pos <= this.track_click_bar_move_overshoot * 1.8) {
				new_bar_pos = 0;
			}
		} else {
			new_bar_pos = click[this.drag_dir] - this.track_size[this.bar_pos_side] + this.track_click_bar_move_overshoot;
			if (new_bar_pos > this.track_size[this.length_side] || new_bar_pos >= this.track_size[this.length_side] - (this.track_click_bar_move_overshoot * 1.8)) {
				new_bar_pos = this.track_size[this.length_side];
			}
			new_bar_pos = new_bar_pos - this.bar_size[this.length_side];
		}

		this.bar_pos = new_bar_pos;
		this.bar.style[this.bar_pos_side] = `${this.roundToTwo(this.bar_pos)}px`;
		this.setScrolledAreaFromBar();

	}

	firstClickAndCurrMouseDiff = (event) => {
		// console.log(event.pos[this.drag_dir]);
		return this[this.drag_dir] - event.pos[this.drag_dir];
	}

	// barPosPercentOfMovableArea = () => {
	// 	// 1 is start, 0 is end
	// 	let movable_length = (1 - this.barPercentOfTrack());
	// 	return (this.getEmptyTracklength() - this.bar_pos) / this.getEmptyTracklength();
	// }

	// scrollAreaMaxMovableLen = () => {
	// 	return this.scrolldrawer_size[this.length_side] - this.container_size[this.length_side];
	// }

	getBarPosFromStyle = () => {
		return Number.parseFloat(this.bar.style[this.bar_pos_side].replace('px', ''));
	}

	setScrolledAreaFromBar = () => {

		// console.log(this.getBarPosFromStyle());

		let movable_length = (1 - this.barPercentOfTrack());
		let barPosPercentOfMovableArea = (this.getEmptyTracklength() - this.getBarPosFromStyle()) / this.getEmptyTracklength();
		let scrollAreaMaxMovableLen = this.scrolldrawer_size[this.length_side] - this.container_size[this.length_side];

		let new_scrolledarea_pos = scrollAreaMaxMovableLen - (scrollAreaMaxMovableLen * barPosPercentOfMovableArea);
		// console.log(new_scrolledarea_pos);
		this.scroll_drawer.style[this.bar_pos_side] = `-${this.roundToTwo(new_scrolledarea_pos)}px`;
	}

	resetBoundingRects = () => {
		this.container_size = this.container.getBoundingClientRect();
		this.scrollcont_size = this.scroll_cont.getBoundingClientRect();
		this.scrolldrawer_size = this.scroll_drawer.getBoundingClientRect();
		this.bar_size = this.bar.getBoundingClientRect();
		this.track_size = this.track.getBoundingClientRect();
	}

	getEmptyTracklength = () => {
		return this.track_size[this.length_side] - this.bar_size[this.length_side];
	}

	moveBar = (amt, move_is_done) => {

		let new_pos = this.bar_pos + amt;
		let empty_track_len = this.getEmptyTracklength();

		// console.log('empty:', empty_track_len);

		// console.log('');

		if (new_pos < 0) {
			new_pos = 0;
		} 
		else if (new_pos > empty_track_len) {
			new_pos = empty_track_len;
		}
		this.bar.style[this.bar_pos_side] = `${this.roundToTwo(new_pos)}px`;

		if (move_is_done === false) {
			this.bar_pos = new_pos;
			// this.setScrolledAreaFromBar();
		}
		this.setScrolledAreaFromBar();
	}

	receiveDragEvent = (event) => {
		this.resetBoundingRects();

		if (event.moved) {
			let amt = this.firstClickAndCurrMouseDiff(event);
		
			// correct for the dir we are using here
			if (amt <= 0) {
				amt = Math.abs(amt);
			} else {
				amt = -amt;
			}

			this.moveBar(amt, event.dragging);

		}

		// if (event.dragging === false) {
		// 	console.log('move is doneeee');
		// }
	}


	getStartOverflow = () => {
		return this.scrolldrawer_size[this.drag_dir], this.container_size[this.drag_dir];
	}

	getStopOverflow = () => {
		return this.scrolldrawer_size[this.length_side] - this.container_size[this.length_side] - Math.abs(this.drawer_loc);
	}

	appendTrackIfNotPresent = () => {
		if (!this.container.contains(this.track)) {
			if (this.scrollcont_at_start) {
				this.container.insertBefore(this.track, this.container.firstChild);
			} else {
				this.container.appendChild(this.track);
			}
			this.forceBarPosWithPercent(0);
		}
	}

	ensureBarNotTiny = (bar_length) => {
		if (bar_length < this.bar_size[this.width_side] * 2) {
			bar_length = this.bar_size[this.width_side] * 2;
		}

		return bar_length;
	}

	setBarSize = () => {

		if (this.scrolldrawer_size[this.length_side] > this.container_size[this.length_side]) {
			// append track if not present
			this.appendTrackIfNotPresent();

			if (this.scroll_hides) {
				this.track.style.visibility = 'visible';
			} 

			let percent = this.container_size[this.length_side] / this.scrolldrawer_size[this.length_side];
			if (this.init_now) {
				// console.log('init now');
				this.forceBarPosWithPercent(0);
				this.init_now = false;
			}
			let bar_length = this.track_size[this.length_side] * percent;

			// ensure it doesn't get tiny
			bar_length = this.ensureBarNotTiny(bar_length);

			this.bar.style[this.length_side] = `${this.roundToTwo(bar_length)}px`;
		} else {
			if (this.container.contains(this.track)) {
				this.hideBar();
			} else {
				if (this.scroll_hides) {
					this.track.style.visibility = 'hidden';
					this.appendTrackIfNotPresent();
				}
			}
		}
	}

	hideBar = () => {
		if (this.scroll_hides) {
			this.track.style.visibility = 'hidden';
		} else {
			this.container.removeChild(this.track);
		}
	}
}