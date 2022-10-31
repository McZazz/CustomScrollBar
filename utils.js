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
	constructor(id_len) {
		this.id_len = id_len;
		this.existing_ids = new Set();
	}

	createId = ({id_type=''/*String*/}={}) => {
	  let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789012345678901234567890123456789012345678901';
	  let result = id_type;
	  let cntr = 0;

	  while (true) {
	    for (let i=0; i<this.id_len; i++) {
	      result += chars.charAt(Math.floor(Math.random() * chars.length));
	    }

      if (this.existing_ids.has(result)) {
        cntr++;
      } else {
      	this.existing_ids.add(result);
      	return result;
      }

	    if (cntr >= 10) {
	    	this.id_len++;
	    }
	  }
	}
}
