export const makeElement = ({
															type=''/*String of html tag type*/, 
															props=[]/*[['id', 'stuff'], ['classList', 'notbootstrap']]*/, 
															styles=[]/*[['backgroundColor', '#334455'], ['fontFamily', 'Ariel']]*/
														}={}) => {

	let result = document.createElement(type);

	props.forEach((prop) => {
		result[prop[0]] = prop[1]; 
	});

	result = setPermStyles(result, styles);

	return result; // Node
}


export const setPermStyles = (element/*Node*/, styles/*[['backgroundColor', '#334455'], ['fontFamily', 'Ariel']]*/) => {

	styles.forEach((item) => {
		element.style[item[0]] = item[1]; 
	});

	return element; // Node
}


export const setAnimStyles = (class_name/*String*/, styles/*'#stuff:hover {background-color: red;}'*/) => {

	let result = document.createElement('style');
	result.classList = class_name;

	result.textContent = styles;

	document.head.appendChild(result)
}


export class RandIdManager {
	constructor() {
		this.existing_ids = new Set();
	}

	createId = (id_type, id_len) => {
	  let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789012345678901234567890123456789012345678901';
	  let result = `${id_type}_`;
	  let cntr = 0;

	  while (true) {
	    for (let i=0; i<id_len; i++) {
	      result += chars.charAt(Math.floor(Math.random() * chars.length));
	    }

	    let isUnique = true;
      if (this.existing_ids.has(result)) {
        isUnique = false;
        cntr++;
      }

	    if (isUnique == true) {
	      break;
	    }
	    if (cntr >= 10) {
	    	return 'make_id_len_longer';
	    }
	  }
	  return result;
	}
}