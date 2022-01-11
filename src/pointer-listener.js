/*
* PointerListener class
*	- implements the possibility to listen to gesture events performed on a specific DOM Element
*	  expample: element.addEventListener("pan", function(event){});
*	- creates and destroys Contact instances
*	- updates the Contact instances
*	- uses the Contact instances to determine which gesture(s) are performed by passing Contact instances to GestureRegonizers
*
*	- var listener = new PointerListener(domElement, {});
*	- domElement.addEventListener("pan", function(){});
*/

var ALL_GESTURE_CLASSES = [Tap, Pan, Pinch, Rotate, TwoFingerPan];

class PointerListener {

	constructor (domElement, options){
	
		this.DEBUG = false;
	
		var self = this;
		
		options = options || {};
		
		var supportedGestures = ALL_GESTURE_CLASSES;
		
		// default options
		this.options = {
			supportedGestures : [], // default managed below, adding all gestures
			handleTouchEvents : true
		};
		
		// instantiate gesture classes on domElement and add them to this.options
		var hasSupportedGestures = Object.prototype.hasOwnProperty.call(options, "supportedGestures");
		if (hasSupportedGestures == true){
			supportedGestures = options.supportedGestures;
		}
		
		for (let i=0; i<supportedGestures.length; i++){
	
			let gesture;
			let GestureClass = supportedGestures[i];

			if (typeof GestureClass == "function"){
				gesture = new GestureClass(domElement);
			}
			else if (typeof GestureClass == "object"){
				gesture = GestureClass;
			}
			else {
				throw new Error("unsupported gesture type: " + typeof GestureClass);
			}
			this.options.supportedGestures.push(gesture);
		}
		
		for (let key in options){
			if (key == "supportedGestures"){
				continue;
			}

			this.options[key] = options[key];
		}
		
		this.domElement = domElement;
		
		// the Contact instance - only active during an active pointerdown
		this.contact = null;
		
		// disable context menu on long taps - this kills pointermove
		/*domElement.addEventListener("contextmenu", function(event) {
			event.preventDefault();
			return false;
		});*/
		
		// javascript fires the events "pointerdown", "pointermove", "pointerup" and "pointercancel"
		// on each of these events, the contact instance is updated and GestureRecognizers of this.supported_events are run		
		domElement.addEventListener("pointerdown", function(event){
		
			// re-target all pointerevents to the current element
			// see https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture
			domElement.setPointerCapture(event.pointerId);
			
			if (self.contact == null || self.contact.isActive == false) {
				self.contact = new Contact(event);
			}
			else {
				// use existing contact instance if a second pointer becomes present
				self.contact.addPointer(event);
			}
			
			var hasPointerDownHook = Object.prototype.hasOwnProperty.call(self.options, "pointerdown");
			if (hasPointerDownHook == true){
				self.options.pointerdown(event, self);
			}
			
		}, { "passive": true });
		
		domElement.addEventListener("pointermove", function(event){
		
			// pointermove is also firing if the mouse button is not pressed
		
			if (self.contact != null && self.contact.isActive == true){
		
				// this would disable vertical scrolling - which should only be disabled if a panup/down or swipeup/down listener has been triggered
				// event.preventDefault();
			
				self.contact.onPointerMove(event);
				self.recognizeGestures();
				
				var hasPointerMoveHook = Object.prototype.hasOwnProperty.call(self.options, "pointermove");
				if (hasPointerMoveHook == true){
					self.options.pointermove(event, self);
				}
			}
			
		}, { "passive": true });
		
		domElement.addEventListener("pointerup", function(event){
		
			domElement.releasePointerCapture(event.pointerId);
		
			if (self.contact != null && self.contact.isActive == true){
		
				// use css: touch-action: none instead of js to disable scrolling
				//self.domElement.classList.remove("disable-scrolling");
			
				self.contact.onPointerUp(event);
				self.recognizeGestures();
				
				var hasPointerUpHook = Object.prototype.hasOwnProperty.call(self.options, "pointerup");
				if (hasPointerUpHook == true){
					self.options.pointerup(event, self);
				}
			}
		});
		
		/*
		* case: user presses mouse button and moves element. while moving, the cursor leaves the element (fires pointerout)
		*		while outside the element, the mouse button is released. pointerup is not fired.
		*		during pan, pan should not end if the pointer leaves the element.
		* MDN: Pointer capture allows events for a particular pointer event (PointerEvent) to be re-targeted to a particular element instead of the normal (or hit test) target at a pointer's location. This can be used to ensure that an element continues to receive pointer events even if the pointer device's contact moves off the element (such as by scrolling or panning). 
		*/
		
		domElement.addEventListener("pointerleave", function(event){
			
			if (self.contact != null && self.contact.isActive == true){
				self.contact.onPointerLeave(event);
				self.recognizeGestures();
			}		
		});

		
		domElement.addEventListener("pointercancel", function(event){
		
			domElement.releasePointerCapture(event.pointerId);
		
			if (this.DEBUG == true){
				console.log("[PointerListener] pointercancel detected");
			}
		
			//self.domElement.classList.remove("disable-scrolling");
		
			self.contact.onPointerCancel(event);
			self.recognizeGestures();
			
			var hasPointerCancelHook = Object.prototype.hasOwnProperty.call(self.options, "pointercancel");
			if (hasPointerCancelHook == true){
				self.options.pointercancel(event, self);
			}
			
			
		}, { "passive": true });
		
		
		this.addTouchListeners();
	}

	// provide the ability to interact/prevent touch events
	// scrolling (touchmove event) results in pointerCancel event, stopping horizontal panning if user scrolls vertically
	// the better solution is using eg css: touch-action: pan-y;
	addTouchListeners () {

		var self = this;

		if (self.options.handleTouchEvents == true){

			/*this.domElement.addEventListener("touchstart", function(event){

			});*/

			this.domElement.addEventListener("touchmove", function(event){
				
				// fire onTouchMove for all gestures
				for (let g=0; g<self.options.supportedGestures.length; g++){
			
					let gesture = self.options.supportedGestures[g];

					gesture.onTouchMove(event);
				}
				
			});

			/*this.domElement.addEventListener("touchend", function(event){
			});

			this.domElement.addEventListener("touchcancel", function(event){
			});*/
		}

	}
	
	// run all configured recognizers
	recognizeGestures (){
	
		for (let g=0; g<this.options.supportedGestures.length; g++){
		
			let gesture = this.options.supportedGestures[g];
			
			gesture.recognize(this.contact);
			
		}
		
	}
	
}
