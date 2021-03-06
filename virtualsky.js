/*!
	Virtual Sky
	(c) Stuart Lowe, Las Cumbres Observatory Global Telescope
	A browser planetarium using HTML5's <canvas>.
*/
/*
	USAGE:
		<!--[if lt IE 9]><script src="http://lcogt.net/virtualsky/embed/excanvas.js" type="text/javascript"></script><![endif]-->
		<script src="http://lcogt.net/virtualsky/embed/jquery-1.7.1.min.js" type="text/javascript"></script>
		<script src="http://lcogt.net/virtualsky/embed/virtualsky.js" type="text/javascript"></script>
		<script type="text/javascript">
		<!--
			$(document).ready(function(){
				planetarium = $.virtualsky({id:'starmapper',projection:'polar'});	// Assumes you want to draw this to a <div> with the id 'starmapper'
			});
		// -->
		</script>
		
	OPTIONS (default values in brackets):
		id ('starmap') - The ID for the HTML element where you want the sky inserted
		projection ('polar') - The projection type as 'polar', 'stereo', 'lambert', 'equirectangular', or 'ortho'
		width (500) - Set the width of the sky unless you've set the width of the element
		height (250) - Set the height of the sky unless you've set the height of the element
		planets - either an object containing an array of planets or a JSON file
		magnitude (5) - the magnitude limit of displayed stars
		longitude (53.0) - the longitude of the observer
		latitude (-2.5) - the latitude of the observer
		clock (now) - a Javascript Date() object with the starting date/time
		background ('rgba(0,0,0,0)') - the background colour
		transparent (false) - make the sky background transparent
		color ('rgb(255,255,255)') - the text colour
		az (180) - an azimuthal offset with 0 = north and 90 = east
		ra (0 <= x < 360) - the RA for the centre of the view in gnomic projection
		dec (-90 < x < 90) - the Declination for the centre of the view in gnomic projection
		negative (false) - invert the default colours i.e. to black on white
		ecliptic (false) - show the Ecliptic line
		meridian (false) - show the Meridian line
		gradient (true) - reduce the brightness of stars near the horizon
		cardinalpoints (true) - show/hide the N/E/S/W labels
		constellations (false) - show/hide the constellation lines
		constellationlabels (false) - show/hide the constellation labels
		constellationboundaries (false) - show/hide the constellation boundaries (IAU)
		showstars (true) - show/hide the stars
		showstarlabels (false) - show/hide the star labels for brightest stars
		showplanets (true) - show/hide the planets
		showplanetlabels (true) - show/hide the planet labels
		showorbits (false) - show/hide the orbits of the planets
		showgalaxy (false) - show/hide an outline of the plane of the Milky Way
		showdate (true) - show/hide the date and time
		showposition (true) - show/hide the latitude/longitude
		ground (false) - show/hide the local ground (for full sky projections)
		keyboard (true) - allow keyboard controls
		mouse (true) - allow mouse controls
		gridlines_az (false) - show/hide the azimuth/elevation grid lines
		gridlines_eq (false) - show/hide the RA/Dec grid lines
		gridlines_gal (false) - show/hide the Galactic Coordinate grid lines
		gridstep (30) - the size of the grid step when showing grid lines
		live (false) - update the display in real time
		fontsize - set the font size in pixels if you want to over-ride the auto sizing
		fontfamily - set the font family using a CSS style font-family string otherwise it inherits from the container element
		objects - a semi-colon-separated string of recognized object names to display e.g. "M1;M42;Horsehead Nebula" (requires internet connection)
*/
(function ($) {

/*@cc_on
// Fix for IE's inability to handle arguments to setTimeout/setInterval
// From http://webreflection.blogspot.com/2007/06/simple-settimeout-setinterval-extra.html
(function(f){
	window.setTimeout =f(window.setTimeout);
	window.setInterval =f(window.setInterval);
})(function(f){return function(c,t){var a=[].slice.call(arguments,2);return f(function(){c.apply(this,a)},t)}});
@*/
// Define a shortcut for checking variable types
function is(a,b){ return (typeof a == b) ? true : false; }

$.extend($.fn.addTouch = function(){
	// Adapted from http://code.google.com/p/rsslounge/source/browse/trunk/public/javascript/addtouch.js?spec=svn115&r=115
	this.each(function(i,el){
		// Pass the original event object because the jQuery event object
		// is normalized to w3c specs and does not provide the TouchList.
		$(el).bind('touchstart touchmove touchend touchcancel touchdbltap',function(){ handleTouch(event); });
	});
	var handleTouch = function(event){
		event.preventDefault();

		var simulatedEvent;
		var touches = event.changedTouches,
		first = touches[0],
		type = '';
		switch(event.type){
			case 'touchstart':
				type = ['mousedown','click'];
				break;
			case 'touchmove':
				type = ['mousemove'];
				break;        
			case 'touchend':
				type = ['mouseup'];
				break;
			case 'touchdbltap':
				type = ['dblclick'];
				break;
			default:
				return;
		}
		for(var i = 0; i < type.length; i++){
			simulatedEvent = document.createEvent('MouseEvent');
			simulatedEvent.initMouseEvent(type[i], true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY, false, false, false, false, 0/*left*/, null);
			first.target.dispatchEvent(simulatedEvent);
		}
	};
});
/*! Copyright (c) 2013 Brandon Aaron (http://brandonaaron.net)
* Licensed under the MIT License (LICENSE.txt).
*
* Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
* Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
* Thanks to: Seamus Leahy for adding deltaX and deltaY
*
* Version: 3.1.3
*
* Requires: 1.2.2+
*/
(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // Node/CommonJS style for Browserify
        module.exports = factory;
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function ($) {

    var toFix = ['wheel', 'mousewheel', 'DOMMouseScroll', 'MozMousePixelScroll'];
    var toBind = 'onwheel' in document || document.documentMode >= 9 ? ['wheel'] : ['mousewheel', 'DomMouseScroll', 'MozMousePixelScroll'];
    var lowestDelta, lowestDeltaXY;

    if ( $.event.fixHooks ) {
        for ( var i = toFix.length; i; ) {
            $.event.fixHooks[ toFix[--i] ] = $.event.mouseHooks;
        }
    }

    $.event.special.mousewheel = {
        setup: function() {
            if ( this.addEventListener ) {
                for ( var i = toBind.length; i; ) {
                    this.addEventListener( toBind[--i], handler, false );
                }
            } else {
                this.onmousewheel = handler;
            }
        },

        teardown: function() {
            if ( this.removeEventListener ) {
                for ( var i = toBind.length; i; ) {
                    this.removeEventListener( toBind[--i], handler, false );
                }
            } else {
                this.onmousewheel = null;
            }
        }
    };

    $.fn.extend({
        mousewheel: function(fn) {
            return fn ? this.bind("mousewheel", fn) : this.trigger("mousewheel");
        },

        unmousewheel: function(fn) {
            return this.unbind("mousewheel", fn);
        }
    });


    function handler(event) {
        var orgEvent = event || window.event,
            args = [].slice.call(arguments, 1),
            delta = 0,
            deltaX = 0,
            deltaY = 0,
            absDelta = 0,
            absDeltaXY = 0,
            fn;
        event = $.event.fix(orgEvent);
        event.type = "mousewheel";

        // Old school scrollwheel delta
        if ( orgEvent.wheelDelta ) { delta = orgEvent.wheelDelta; }
        if ( orgEvent.detail ) { delta = orgEvent.detail * -1; }

        // New school wheel delta (wheel event)
        if ( orgEvent.deltaY ) {
            deltaY = orgEvent.deltaY * -1;
            delta = deltaY;
        }
        if ( orgEvent.deltaX ) {
            deltaX = orgEvent.deltaX;
            delta = deltaX * -1;
        }

        // Webkit
        if ( orgEvent.wheelDeltaY !== undefined ) { deltaY = orgEvent.wheelDeltaY; }
        if ( orgEvent.wheelDeltaX !== undefined ) { deltaX = orgEvent.wheelDeltaX * -1; }

        // Look for lowest delta to normalize the delta values
        absDelta = Math.abs(delta);
        if ( !lowestDelta || absDelta < lowestDelta ) { lowestDelta = absDelta; }
        absDeltaXY = Math.max(Math.abs(deltaY), Math.abs(deltaX));
        if ( !lowestDeltaXY || absDeltaXY < lowestDeltaXY ) { lowestDeltaXY = absDeltaXY; }

        // Get a whole value for the deltas
        fn = delta > 0 ? 'floor' : 'ceil';
        delta = Math[fn](delta / lowestDelta);
        deltaX = Math[fn](deltaX / lowestDeltaXY);
        deltaY = Math[fn](deltaY / lowestDeltaXY);

        // Add event and delta to the front of the arguments
        args.unshift(event, delta, deltaX, deltaY);

        return ($.event.dispatch || $.event.handle).apply(this, args);
    }

}));
/*! VirtualSky */
function VirtualSky(input){

	this.version = "0.5.0";

	this.ie = false;
	this.excanvas = (typeof G_vmlCanvasManager != 'undefined') ? true : false;
	/*@cc_on
	this.ie = true
	@*/

	this.id = '';						// The ID of the canvas/div tag - if none given it won't display
	this.gradient = true;				// Show the sky gradient
	this.magnitude = 5;					// Limit for stellar magnitude
	this.background = "rgba(0,0,0,0)";	// Default background colour is transparent
	this.color = "";					// Default background colour is chosen automatically
	this.wide = 0;						// Default width if not set in the <canvas> <div> or input argument
	this.tall = 0;

	// Constants
	this.d2r = Math.PI/180;
	this.r2d = 180.0/Math.PI;

	// Set location on the Earth
	this.setLongitude(-119.86286);
	this.setLatitude(34.4326);

	// Toggles
	this.spin = false;
	this.cardinalpoints = true;			// Display N, E, S and W.
	this.constellation = { lines: false, boundaries: false, labels: false };	// Display constellations
	this.meteorshowers = false;			// Display meteor shower radiants
	this.negative = false;				// Invert colours to make it better for printing
	this.showgalaxy = false;			// Display the Milky Way
	this.showstars = true;				// Display current positions of the stars
	this.showstarlabels = false;		// Display names for named stars
	this.showplanets = true;			// Display current positions of the planets
	this.showplanetlabels = true;		// Display names for planets
	this.showorbits = false;			// Display the orbital paths of the planets
	this.showdate = true;				// Display the current date
	this.showposition = true;			// Display the longitude/latitude
	this.scalestars = 1;				// A scale factor by which to increase the star sizes
	this.ground = false;
	this.grid = { az: false, eq: false, gal: false, step: 30 };	// Display grids
	this.ecliptic = false;				// Display the Ecliptic
	this.meridian = false;				// Display the Meridian
	this.keyboard = true;				// Allow keyboard controls
	this.mouse = true;					// Allow mouse controls
	this.islive = false;				// Update the sky in real time
	this.fullscreen = false;			// Should it take up the full browser window
	this.transparent = false;			// Show the sky background or not
	this.fps = 10;						// Number of frames per second when animating
	this.credit = (location.host == "lcogt.net" && location.href.indexOf("/embed") < 0) ? false : true;
	this.callback = { geo:'', mouseenter:'', mouseout:'' };
	this.keys = new Array();
	this.base = "";
	this.az_step = 0;
	this.az_off = 0;
	this.ra_off = 0;
	this.dc_off = 0;
	this.fov = 30;
	this.plugins = [];
	this.events = {};	// Let's add some default events

	// Projections
	this.projections = {
		'polar': {
			title: 'Polar projection',
			azel2xy: function(az,el,w,h){
				var radius = h/2;
				var r = radius*((Math.PI/2)-el)/(Math.PI/2);
				return {x:(w/2-r*Math.sin(az)),y:(radius-r*Math.cos(az)),el:el};
			},
			polartype: true,
			atmos: true
		},
		'fisheye':{
			title: 'Fisheye polar projection',
			azel2xy: function(az,el,w,h){
				var radius = h/2;
				var r = radius*Math.sin(((Math.PI/2)-el)/2)/0.70710678;	// the field of view is bigger than 180 degrees
				return {x:(w/2-r*Math.sin(az)),y:(radius-r*Math.cos(az)),el:el};
			},
			polartype:true,
			atmos: true
		},
		'ortho':{
			title: 'Orthographic polar projection',
			azel2xy: function(az,el,w,h){
				var radius = h/2;
				var r = radius*Math.cos(el);
				return {x:(w/2-r*Math.sin(az)),y:(radius-r*Math.cos(az)),el:el};
			},
			polartype:true,
			atmos: true
		},
		'stereo': {
			title: 'Stereographic projection',
			azel2xy: function(az,el,w,h){
				var f = 0.42;
				var sinel1 = 0;
				var cosel1 = 1;
				var cosaz = Math.cos((az-Math.PI));
				var sinaz = Math.sin((az-Math.PI));
				var sinel = Math.sin(el);
				var cosel = Math.cos(el);
				var k = 2/(1+sinel1*sinel+cosel1*cosel*cosaz);
				return {x:(w/2+f*k*h*cosel*sinaz),y:(h-f*k*h*(cosel1*sinel-sinel1*cosel*cosaz)),el:el};
			},
			atmos: true
		},
		'lambert':{
			title: 'Lambert projection',
			azel2xy: function(az,el,w,h){
				var cosaz = Math.cos((az-Math.PI));
				var sinaz = Math.sin((az-Math.PI));
				var sinel = Math.sin(el);
				var cosel = Math.cos(el);
				var k = Math.sqrt(2/(1+cosel*cosaz));
				return {x:(w/2+0.6*h*k*cosel*sinaz),y:(h-0.6*h*k*(sinel)),el:el};
			},
			atmos: true
		},
		'gnomic': {
			title: 'Gnomic projection',
			azel2xy: function(az,el){
				if(el >= 0){
					var pos = this.azel2radec(az,el);
					return this.radec2xy(pos.ra*this.d2r,pos.dec*this.d2r,[el,az]);
				}else{
					return { x: -1, y: -1, el: el };
				}
			},
			radec2xy: function(ra,dec,coords){

				var fov, cd, cd0, sd, sd0, dA, A, F, scale, twopi;

				// Only want to project the sky around the map centre
				if(Math.abs(dec-this.dc_off) > this.maxangle) return {x:-1,y:-1,el:-1};
				var ang = this.greatCircle(this.ra_off,this.dc_off,ra,dec);
				if(ang > this.maxangle) return {x:-1,y:-1,el:-1};

				if(!coords) coords = this.coord2horizon(ra, dec);

				// Should we show things below the horizon?
				if(this.ground && coords[0] < -1e-6) return {x:-1, y:-1, el:coords[0]*this.r2d};
				
				// number of pixels per degree in the map
				scale = this.tall/this.fov;

				cd = Math.cos(dec);
				cd0 = Math.cos(this.dc_off);
				sd = Math.sin(dec);
				sd0 = Math.sin(this.dc_off);

				dA = ra-this.ra_off;
				dA = inrangeAz(dA);
				
				A = cd*Math.cos(dA);
				F = scale*this.r2d/(sd0*sd + A*cd0);

				return {x:(this.wide/2)-F*cd*Math.sin(dA),y:(this.tall/2) -F*(cd0*sd - A*sd0),el:coords[0]*this.r2d};
			},
			draw: function(){
				if(!this.transparent){
					this.ctx.fillStyle = (this.hasGradient()) ? "rgba(0,15,30, 1)" : ((this.negative) ? this.col.white : this.col.black);
					this.ctx.fillRect(0,0,this.wide,this.tall);
					this.ctx.fill();
				}
			},
			isVisible: function(el){
				return true;
			},
			atmos: false,
			fullsky: true
		},
		'equirectangular':{
			title: 'Equirectangular projection',
			azel2xy: function(az,el,w,h){
				while(az < 0) az += 2*Math.PI;
				az = (az)%(Math.PI*2);
				return {x:(((az-Math.PI)/(Math.PI/2))*h + w/2),y:(h-(el/(Math.PI/2))*h),el:el};
			},
			maxb: 90,
			atmos: true
		},
		'mollweide':{
			title: 'Mollweide projection',
			radec2xy: function(ra,dec){
				var dtheta, x, y, coords, sign, outside, normra;
				var thetap = Math.abs(dec);
				var pisindec = Math.PI*Math.sin(Math.abs(dec));
				// Now iterate to correct answer
				for(var i = 0; i < 20 ; i++){
					dtheta = -(thetap + Math.sin(thetap) - pisindec)/(1+Math.cos(thetap));
					thetap += dtheta;
					if(dtheta < 1e-4) break;
				}
				normra = (ra+this.d2r*this.az_off)%(2*Math.PI) - Math.PI;
				outside = false;
				x = -(2/Math.PI)*(normra)*Math.cos(thetap/2)*this.tall/2 + this.wide/2;
				if(x > this.wide) outside = true;
				sign = (dec >= 0) ? 1 : -1;
				y = -sign*Math.sin(thetap/2)*this.tall/2 + this.tall/2;
				coords = this.coord2horizon(ra, dec);
				return {x:(outside ? -100 : x%this.wide),y:y,el:coords[0]*this.r2d};
			},
			draw: function(){
				var c = this.ctx;
				c.moveTo(this.wide/2,this.tall/2);
				c.beginPath();
				var x = this.wide/2-this.tall;
				var y = 0;
				var w = this.tall*2;
				var h = this.tall;
				var kappa = 0.5522848;
				var ox = (w / 2) * kappa; // control point offset horizontal
				var oy = (h / 2) * kappa; // control point offset vertical
				var xe = x + w;           // x-end
				var ye = y + h;           // y-end
				var xm = x + w / 2;       // x-middle
				var ym = y + h / 2;       // y-middle
				c.moveTo(x, ym);
				c.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
				c.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
				c.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
				c.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
				c.closePath();
				if(!this.transparent){
					c.fillStyle = (this.hasGradient()) ? "rgba(0,15,30, 1)" : ((this.negative) ? this.col.white : this.col.black);
					c.fill();
				}
			},
			altlabeltext:true,
			fullsky:true,
			atmos: false
		},
		'planechart':{
			title: 'Planechart projection',
			radec2xy: function(ra,dec){
				ra = inrangeAz(ra);
				var normra = (ra+this.d2r*this.az_off)%(2*Math.PI)-Math.PI;
				var x = -(normra/(2*Math.PI))*this.tall*2 + this.wide/2;
				var y = -(dec/Math.PI)*this.tall+ this.tall/2;
				var coords = this.coord2horizon(ra, dec);
				return {x:x,y:y,el:coords[0]*this.r2d};
			},
			draw: function(){
				if(!this.transparent){
					this.ctx.fillStyle = (this.hasGradient()) ? "rgba(0,15,30, 1)" : ((this.negative) ? this.col.white : this.col.black);
					this.ctx.fillRect((this.wide/2) - (this.tall),0,this.tall*2,this.tall);
					this.ctx.fill();
				}
			},
			fullsky:true,
			atmos: false
		}
	};
	
	// Data for stars < mag 4.5 or that are a vertex for a constellation line - 25 kB
	this.stars = this.convertStarsToRadians([[677,2.07,2.097,29.09],[746,2.28,2.295,59.15],[765,3.88,2.353,-45.75],[1067,2.83,3.309,15.18],[1562,3.56,4.857,-8.82],[1599,4.23,5.018,-64.87],[1645,5.38,5.149,8.19],[2021,2.82,6.438,-77.25],[2072,3.93,6.551,-43.68],[2081,2.40,6.571,-42.31],[2484,4.36,7.886,-62.96],[2920,3.69,9.243,53.9],[3092,3.27,9.832,30.86],[3179,2.24,10.127,56.54],[3419,2.04,10.897,-17.99],[3760,5.92,12.073,7.3],[3821,3.46,12.276,57.82],[3881,4.53,12.454,41.08],[4427,2.15,14.177,60.72],[4436,3.86,14.188,38.5],[4577,4.30,14.652,-29.36],[4889,5.50,15.705,31.8],[4906,4.27,15.736,7.89],[5165,3.32,16.521,-46.72],[5348,3.94,17.096,-55.25],[5364,3.46,17.147,-10.18],[5447,2.07,17.433,35.62],[5742,4.67,18.437,24.58],[6193,4.74,19.867,27.26],[6537,3.60,21.006,-8.18],[6686,2.66,21.454,60.24],[6867,3.41,22.091,-43.32],[7007,4.84,22.546,6.14],[7083,3.93,22.813,-49.07],[7097,3.62,22.871,15.35],[7588,0.45,24.429,-57.24],[7607,3.59,24.498,48.63],[7884,4.45,25.358,5.49],[8102,3.49,26.017,-15.94],[8198,4.26,26.348,9.16],[8645,3.74,27.865,-10.34],[8796,3.42,28.27,29.58],[8832,3.88,28.383,19.29],[8833,4.61,28.389,3.19],[8837,4.39,28.411,-46.3],[8886,3.35,28.599,63.67],[8903,2.64,28.66,20.81],[9007,3.69,28.989,-51.61],[9236,2.86,29.692,-61.57],[9347,3.99,30.001,-21.08],[9487,3.82,30.512,2.76],[9598,3.95,30.859,72.42],[9640,2.10,30.975,42.33],[9884,2.01,31.793,23.46],[10064,3.00,32.386,34.99],[10324,4.36,33.25,8.85],[10559,5.25,33.985,33.36],[10602,3.56,34.127,-51.51],[10826,6.47,34.837,-2.98],[11001,4.08,35.437,-68.66],[11345,4.88,36.488,-12.29],[11407,4.24,36.746,-47.7],[11484,4.30,37.04,8.46],[11767,1.97,37.955,89.26],[11783,4.74,38.022,-15.24],[12093,4.87,38.969,5.59],[12387,4.08,39.871,0.33],[12390,4.83,39.891,-11.87],[12394,4.12,39.897,-68.27],[12413,4.74,39.95,-42.89],[12484,5.21,40.165,-54.55],[12486,4.11,40.167,-39.86],[12706,3.47,40.825,3.24],[12770,4.24,41.031,-13.86],[12828,4.27,41.236,10.11],[12843,4.47,41.276,-18.57],[13147,4.45,42.273,-32.41],[13209,3.61,42.496,27.26],[13254,4.22,42.646,38.32],[13268,3.77,42.674,55.9],[13531,3.93,43.564,52.76],[13701,3.89,44.107,-8.9],[13847,2.88,44.565,-40.3],[13954,4.71,44.929,8.91],[14135,2.54,45.57,4.09],[14146,4.08,45.598,-23.62],[14240,5.12,45.903,-59.74],[14328,2.91,46.199,53.51],[14354,3.32,46.294,38.84],[14576,2.09,47.042,40.96],[14668,3.79,47.374,44.86],[14879,3.80,48.019,-28.99],[15197,4.80,48.958,-8.82],[15474,3.70,49.879,-21.76],[15510,4.26,49.982,-43.07],[15863,1.79,51.081,49.86],[15900,3.61,51.203,9.03],[16083,3.73,51.792,9.73],[16228,4.21,52.267,59.94],[16537,3.72,53.233,-9.46],[16611,4.26,53.447,-21.63],[17358,3.01,55.731,47.79],[17378,3.52,55.812,-9.76],[17440,3.84,56.05,-64.81],[17448,3.84,56.08,32.29],[17499,3.72,56.219,24.11],[17529,3.77,56.298,42.58],[17573,3.87,56.457,24.37],[17651,4.22,56.712,-23.25],[17678,3.26,56.81,-74.24],[17702,2.85,56.871,24.11],[17797,4.30,57.149,-37.62],[17847,3.62,57.291,24.05],[17874,4.17,57.364,-36.2],[17959,4.59,57.59,71.33],[18246,2.84,58.533,31.88],[18505,4.95,59.356,63.07],[18532,2.90,59.463,40.01],[18543,2.97,59.507,-13.51],[18597,4.56,59.686,-61.4],[18614,3.98,59.741,35.79],[18724,3.41,60.17,12.49],[18907,3.91,60.789,5.99],[19343,3.96,62.165,47.71],[19747,3.85,63.50,-42.29],[19780,3.33,63.606,-62.47],[19893,4.26,64.007,-51.49],[19921,4.44,64.121,-59.3],[20042,3.55,64.474,-33.8],[20205,3.65,64.948,15.63],[20455,3.77,65.734,17.54],[20535,3.97,66.009,-34.02],[20648,4.30,66.372,17.93],[20885,3.84,67.144,15.96],[20889,3.53,67.154,19.18],[20894,3.40,67.166,15.87],[21060,5.07,67.709,-44.95],[21281,3.30,68.499,-55.04],[21393,3.81,68.888,-30.56],[21421,0.87,68.98,16.51],[21444,3.93,69.08,-3.35],[21594,3.86,69.545,-14.3],[21770,4.44,70.14,-41.86],[21861,5.04,70.515,-37.14],[21881,4.27,70.561,22.96],[21949,5.53,70.767,-70.93],[22109,4.01,71.376,-3.25],[22449,3.19,72.46,6.96],[22509,4.35,72.653,8.9],[22549,3.68,72.802,5.61],[22701,4.36,73.224,-5.45],[22730,5.33,73.345,2.51],[22783,4.26,73.513,66.34],[22797,3.71,73.563,2.44],[22845,4.64,73.724,10.15],[23015,2.69,74.248,33.17],[23123,4.47,74.637,1.71],[23416,3.03,75.492,43.82],[23453,3.69,75.62,41.08],[23685,3.19,76.365,-22.37],[23767,3.18,76.629,41.23],[23875,2.78,76.962,-5.09],[23972,4.25,77.287,-8.75],[24244,4.45,78.075,-11.87],[24305,3.29,78.233,-16.21],[24327,4.36,78.308,-12.94],[24436,0.18,78.634,-8.2],[24608,0.08,79.172,46.0],[24674,3.59,79.402,-6.84],[24845,4.29,79.894,-13.18],[24873,5.29,79.996,-12.32],[25110,5.08,80.64,79.23],[120412,,0.00,0.0],[25281,3.35,81.119,-2.4],[25336,1.64,81.283,6.35],[25428,1.65,81.573,28.61],[25606,2.81,82.061,-20.76],[25859,3.86,82.803,-35.47],[25918,5.18,82.971,-76.34],[25930,2.25,83.002,-0.3],[25985,2.58,83.183,-17.82],[26069,3.76,83.406,-62.49],[26207,3.39,83.784,9.93],[26241,2.75,83.858,-5.91],[26311,1.69,84.053,-1.2],[26451,2.97,84.411,21.14],[26549,3.77,84.687,-2.6],[26634,2.65,84.912,-34.07],[26727,1.74,85.19,-1.94],[27072,3.59,86.116,-22.45],[27100,4.34,86.193,-65.74],[27288,3.55,86.739,-14.82],[27321,3.85,86.821,-51.07],[27366,2.07,86.939,-9.67],[27530,4.50,87.457,-56.17],[27628,3.12,87.74,-35.77],[27654,3.76,87.83,-20.88],[27673,3.97,87.872,39.15],[27890,4.65,88.525,-63.09],[27913,4.39,88.596,20.28],[27989,0.45,88.793,7.41],[28103,3.71,89.101,-14.17],[28199,4.36,89.384,-35.28],[28328,3.96,89.787,-42.82],[28358,3.72,89.882,54.28],[28360,1.90,89.882,44.95],[28380,2.65,89.93,37.21],[28614,4.12,90.596,9.65],[28691,5.14,90.864,19.69],[28734,4.16,91.03,23.26],[28910,4.67,91.539,-14.94],[29038,4.42,91.893,14.77],[29151,5.70,92.241,2.5],[29426,4.45,92.985,14.21],[29651,3.99,93.714,-6.27],[29655,3.31,93.719,22.51],[29807,4.37,94.138,-35.14],[30060,4.44,94.906,59.01],[30122,3.02,95.078,-30.06],[30277,3.85,95.528,-33.44],[30324,1.98,95.675,-17.96],[30343,2.87,95.74,22.51],[30419,4.39,95.942,4.59],[30438,-0.62,95.988,-52.7],[30867,3.76,97.204,-7.03],[30883,4.13,97.241,20.21],[31416,4.54,98.764,-22.96],[31592,3.95,99.171,-19.26],[31681,1.93,99.428,16.4],[31685,3.17,99.44,-43.2],[32246,3.06,100.983,25.13],[32349,-1.44,101.287,-16.72],[32362,3.35,101.322,12.9],[32607,3.24,102.048,-61.94],[32759,3.50,102.46,-32.51],[32768,2.94,102.484,-50.61],[33018,3.60,103.197,33.96],[33152,3.89,103.533,-24.18],[33160,4.08,103.547,-12.04],[33165,6.65,103.554,-23.93],[33347,4.36,104.034,-17.05],[33449,4.35,104.319,58.42],[33579,1.50,104.656,-28.97],[33856,3.49,105.43,-27.93],[33977,3.02,105.756,-23.83],[34045,4.11,105.94,-15.63],[34088,4.01,106.027,20.57],[34444,1.83,107.098,-26.39],[34481,3.78,107.187,-70.5],[34693,4.41,107.785,30.25],[34769,4.15,107.966,-0.49],[35037,4.01,108.703,-26.77],[35228,3.97,109.208,-67.96],[35264,2.71,109.286,-37.1],[35350,3.58,109.523,16.54],[35550,3.50,110.031,21.98],[35904,2.45,111.024,-29.3],[36046,3.78,111.432,27.8],[36145,4.61,111.679,49.21],[36188,2.89,111.788,8.29],[36377,3.25,112.308,-43.3],[36850,1.58,113.649,31.89],[36962,4.06,113.981,26.9],[37229,3.80,114.708,-26.8],[37279,0.40,114.825,5.22],[37447,3.94,115.312,-9.55],[37504,3.93,115.455,-72.61],[37677,3.94,115.952,-28.95],[37740,3.57,116.112,24.4],[37819,3.62,116.314,-37.97],[37826,1.16,116.329,28.03],[38146,5.32,117.257,-24.91],[38170,3.34,117.324,-24.86],[38414,3.71,118.054,-40.58],[38827,3.46,119.195,-52.98],[39429,2.21,120.896,-40.0],[39757,2.83,121.886,-24.3],[39794,4.35,121.982,-68.62],[39863,4.36,122.149,-2.98],[39953,1.75,122.383,-47.34],[40526,3.53,124.129,9.19],[40702,4.05,124.631,-76.92],[40843,5.13,125.016,27.22],[41037,1.86,125.628,-59.51],[41075,4.25,125.709,43.19],[41307,3.91,126.415,-3.91],[41312,3.77,126.434,-66.14],[41704,3.35,127.566,60.72],[42313,4.14,129.414,5.7],[42402,4.45,129.689,3.34],[42515,3.97,130.026,-35.31],[42536,3.60,130.073,-52.92],[42568,4.31,130.154,-59.76],[42570,3.77,130.157,-46.65],[42799,4.30,130.806,3.4],[42806,4.66,130.821,21.47],[42828,3.68,130.898,-33.19],[42911,3.94,131.171,18.15],[42913,1.93,131.176,-54.71],[43023,3.87,131.507,-46.04],[43103,4.03,131.674,28.76],[43109,3.38,131.694,6.42],[43234,4.35,132.108,5.84],[43409,4.02,132.633,-27.71],[43783,3.84,133.762,-60.64],[43813,3.11,133.848,5.95],[44066,4.26,134.622,11.86],[44127,3.12,134.802,48.04],[44248,3.96,135.16,41.78],[44382,4.00,135.612,-66.4],[44471,3.57,135.906,47.16],[44511,3.75,136.039,-47.1],[44700,4.56,136.632,38.45],[44816,2.23,136.999,-43.43],[45080,3.43,137.742,-58.97],[45101,3.96,137.82,-62.32],[45238,1.67,138.30,-69.72],[45336,3.89,138.591,2.31],[45556,2.21,139.273,-59.28],[45688,3.82,139.711,36.8],[45860,3.14,140.264,34.39],[45941,2.47,140.528,-55.01],[46390,1.99,141.897,-8.66],[46509,4.59,142.287,-2.77],[46651,3.60,142.675,-40.47],[46701,3.16,142.805,-57.03],[46733,3.65,142.882,63.06],[46776,4.54,142.996,-1.18],[46853,3.17,143.214,51.68],[46952,4.54,143.556,36.4],[47431,3.90,144.964,-1.14],[47508,3.52,145.288,9.89],[47854,3.69,146.312,-62.51],[47908,2.97,146.463,23.77],[48002,2.92,146.776,-65.07],[48319,3.78,147.747,59.04],[48356,4.11,147.87,-14.85],[48402,4.55,148.026,54.06],[48455,3.88,148.191,26.01],[48774,3.52,149.216,-54.57],[48926,5.23,149.718,-35.89],[49583,3.48,151.833,16.76],[49593,4.49,151.857,35.24],[49641,4.48,151.985,-0.37],[49669,1.36,152.093,11.97],[49841,3.61,152.647,-12.35],[50099,3.29,153.434,-70.04],[50191,3.85,153.684,-42.12],[50335,3.43,154.173,23.42],[50371,3.39,154.271,-61.33],[50372,3.45,154.274,42.91],[50583,2.01,154.993,19.84],[50801,3.06,155.582,41.5],[50954,3.99,156.099,-74.03],[51069,3.83,156.523,-16.84],[51172,4.28,156.788,-31.07],[51232,3.81,156.97,-58.74],[51233,4.20,156.971,36.71],[51437,5.08,157.573,-0.64],[51576,3.30,158.006,-61.69],[51624,3.84,158.203,9.31],[51839,4.11,158.867,-78.61],[51986,3.84,159.326,-48.23],[52419,2.74,160.739,-64.39],[52468,4.58,160.885,-60.57],[52727,2.69,161.692,-49.42],[52943,3.11,162.406,-16.19],[53229,3.79,163.328,34.21],[53253,3.78,163.374,-58.85],[53740,4.08,164.944,-18.3],[53910,2.34,165.46,56.38],[54061,1.81,165.932,61.75],[54463,3.93,167.147,-58.98],[54539,3.00,167.416,44.5],[54682,4.46,167.915,-22.83],[54872,2.56,168.527,20.52],[54879,3.33,168.56,15.43],[55203,3.79,0.00,0.0],[55219,3.49,169.62,33.09],[55282,3.56,169.835,-14.78],[55425,3.90,170.252,-54.49],[55687,4.81,171.152,-10.86],[55705,4.06,171.221,-17.68],[56211,3.82,172.851,69.33],[56343,3.54,173.25,-31.86],[56480,4.62,173.69,-54.26],[56561,3.11,173.945,-63.02],[56633,4.70,174.17,-9.8],[57283,4.71,176.191,-18.35],[57363,3.63,176.402,-66.73],[57380,4.04,176.465,6.53],[57399,3.69,176.513,47.78],[57632,2.14,177.265,14.57],[57757,3.59,177.674,1.76],[57936,4.29,178.227,-33.91],[58001,2.41,178.458,53.69],[58188,5.17,179.004,-17.15],[59196,2.58,182.09,-50.72],[59199,4.02,182.103,-24.73],[59316,3.02,182.531,-22.62],[59449,3.97,182.913,-52.37],[59747,2.79,183.786,-58.75],[59774,3.32,183.857,57.03],[59803,2.58,183.952,-17.54],[60000,4.24,184.587,-79.31],[60030,5.90,184.668,-0.79],[60129,3.89,184.976,-0.67],[60260,3.59,185.34,-60.4],[60718,0.77,186.65,-63.1],[60742,4.35,186.734,28.27],[60823,3.91,187.01,-50.23],[60965,2.94,187.466,-16.52],[61084,1.59,187.791,-57.11],[61174,4.30,188.018,-16.2],[61199,3.84,188.117,-72.13],[61281,3.85,188.371,69.79],[61317,4.24,188.436,41.36],[61359,2.65,188.597,-23.4],[61585,2.69,189.296,-69.14],[61622,3.85,189.426,-48.54],[61932,2.20,190.379,-48.96],[61941,2.74,190.415,-1.45],[62322,3.04,191.57,-68.11],[62434,1.25,191.93,-59.69],[62956,1.76,193.507,55.96],[63090,3.39,193.901,3.4],[63125,2.89,194.007,38.32],[63608,2.85,195.544,10.96],[63613,3.61,195.568,-71.55],[64166,4.94,197.264,-23.12],[64241,4.32,197.497,17.53],[64394,4.23,197.968,27.88],[64962,2.99,199.73,-23.17],[65109,2.75,200.149,-36.71],[65378,2.23,200.981,54.93],[65474,0.98,201.298,-11.16],[65477,3.99,201.306,54.99],[65936,3.90,202.761,-39.41],[66249,3.38,203.673,-0.6],[66657,2.29,204.972,-53.47],[67301,1.85,206.885,49.31],[67459,4.05,207.369,15.8],[67464,3.41,207.376,-41.69],[67472,3.47,207.404,-42.47],[67927,2.68,208.671,18.4],[68002,2.55,208.885,-47.29],[68245,3.83,209.568,-42.1],[68282,3.87,209.67,-44.8],[68520,4.23,210.412,1.54],[68702,0.61,210.956,-60.37],[68756,3.67,211.097,64.38],[68895,3.25,211.593,-26.68],[68933,2.06,211.671,-36.37],[69427,4.18,213.224,-10.27],[69673,-0.05,213.915,19.18],[69701,4.07,214.004,-6.0],[69996,3.55,214.851,-46.06],[70576,4.33,216.545,-45.38],[70638,4.31,216.73,-83.67],[71053,3.57,217.957,30.37],[71075,3.04,218.019,38.31],[71352,2.33,218.877,-42.16],[71536,4.05,219.472,-49.43],[71681,1.35,219.896,-60.84],[71683,-0.01,219.902,-60.83],[71795,3.78,220.287,13.73],[71860,2.30,220.482,-47.39],[71908,3.18,220.627,-64.98],[71957,3.87,220.765,-5.66],[72105,2.35,221.247,27.07],[72220,3.73,221.562,1.89],[72370,3.83,221.965,-79.04],[72607,2.07,222.676,74.16],[72622,2.75,222.72,-16.04],[73273,2.68,224.633,-43.13],[73334,3.13,224.79,-42.1],[73555,3.49,225.487,40.39],[73714,3.25,226.018,-25.28],[73807,3.91,226.28,-47.05],[74376,3.88,227.984,-48.74],[74395,3.41,228.071,-52.1],[74666,3.46,228.876,33.31],[74785,2.61,229.252,-9.38],[74824,4.07,229.379,-58.8],[74946,2.87,229.727,-68.68],[75097,3.00,230.182,71.83],[75141,3.22,230.343,-40.65],[75177,3.57,230.452,-36.26],[75264,3.37,230.67,-44.69],[75323,4.48,230.844,-59.32],[75458,3.29,231.232,58.97],[75695,3.66,231.957,29.11],[76127,4.14,233.232,31.36],[76267,2.22,233.672,26.71],[76276,3.80,233.701,10.54],[76297,2.80,233.785,-41.17],[76333,3.91,233.882,-14.79],[76470,3.60,234.256,-28.14],[76552,4.34,234.513,-42.57],[76600,3.66,234.664,-29.78],[76952,3.81,235.686,26.3],[77055,4.29,236.015,77.79],[77070,2.63,236.067,6.43],[77233,3.65,236.547,15.42],[77450,4.09,237.185,18.14],[77512,4.59,237.399,26.07],[77516,3.54,237.405,-3.43],[77622,3.71,237.704,4.48],[77634,3.97,237.74,-33.63],[77760,4.60,238.169,42.45],[77853,4.13,238.456,-16.73],[77952,2.83,238.786,-63.43],[78072,3.85,239.113,15.66],[78104,3.87,239.221,-29.21],[78159,4.14,239.397,26.88],[78265,2.89,239.713,-26.11],[78384,3.42,240.031,-38.4],[78401,2.29,240.083,-22.62],[78493,4.98,240.361,29.85],[78527,4.01,240.472,58.57],[78639,4.65,240.804,-49.23],[78820,2.56,241.359,-19.81],[78933,3.93,241.702,-20.67],[78970,5.72,241.818,-36.76],[79509,4.95,243.37,-54.63],[79593,2.73,243.586,-3.69],[79664,3.86,243.859,-63.69],[79822,4.95,244.376,75.76],[79882,3.23,244.58,-4.69],[79992,3.91,244.935,46.31],[80000,4.01,244.96,-50.16],[80112,2.90,245.297,-25.59],[80170,3.74,245.48,19.15],[80331,2.73,245.998,61.51],[80582,4.46,246.796,-47.55],[80763,1.06,247.352,-26.43],[80816,2.78,247.555,21.49],[80883,3.82,247.728,1.98],[81065,3.86,248.363,-78.9],[81126,4.20,248.526,42.44],[81266,2.82,248.971,-28.22],[81377,2.54,249.29,-10.57],[81693,2.81,250.322,31.6],[81833,3.48,250.724,38.92],[81852,4.23,250.769,-77.52],[82080,4.21,251.493,82.04],[82273,1.91,252.166,-69.03],[82363,3.77,252.446,-59.04],[82396,2.29,252.541,-34.29],[82514,3.00,252.968,-38.05],[82545,3.56,253.084,-38.02],[82671,4.70,253.499,-42.36],[82729,3.62,253.646,-42.36],[83000,3.19,254.417,9.38],[83081,3.12,254.655,-55.99],[83207,3.92,255.072,30.93],[83895,3.17,257.197,65.71],[84012,2.43,257.595,-15.72],[84143,3.32,258.038,-43.24],[84345,2.78,258.662,14.39],[84379,3.12,258.758,24.84],[84380,3.16,258.762,36.81],[84606,4.64,259.418,37.29],[84880,4.32,260.207,-12.85],[84970,3.27,260.502,-25.0],[85112,4.15,260.921,37.15],[85258,2.84,261.325,-55.53],[85267,3.31,261.349,-56.38],[85670,2.79,262.608,52.3],[85693,4.41,262.685,26.11],[85696,2.70,262.691,-37.3],[85727,3.60,262.775,-60.68],[85755,4.78,262.854,-23.96],[85792,2.84,262.96,-49.88],[85822,4.35,263.054,86.59],[85829,4.86,263.067,55.17],[85927,1.62,263.402,-37.1],[86032,2.08,263.734,12.56],[86228,1.86,264.33,-43.0],[86263,3.54,264.397,-15.4],[86414,3.82,264.866,46.01],[86565,4.24,265.354,-12.88],[86670,2.39,265.622,-39.03],[86742,2.76,265.868,4.57],[86929,3.61,266.433,-64.72],[86974,3.42,266.615,27.72],[87072,4.53,266.89,-27.83],[87073,2.99,266.896,-40.13],[87108,3.75,266.973,2.71],[87261,3.19,267.465,-37.04],[87585,3.73,268.382,56.87],[87808,3.86,269.063,37.25],[87833,2.24,269.152,51.49],[87933,3.70,269.441,29.25],[88048,3.32,269.757,-9.77],[88192,3.93,270.161,2.93],[88635,2.98,271.452,-30.42],[88714,3.65,271.658,-50.09],[88771,3.71,271.837,9.56],[88794,3.84,271.886,28.76],[88866,4.33,272.145,-63.67],[89341,3.84,273.441,-21.06],[89642,3.10,274.407,-36.76],[89931,2.72,275.249,-29.83],[89937,3.55,275.264,72.73],[89962,3.23,275.328,-2.9],[90098,4.35,275.807,-61.49],[90139,3.85,275.925,21.77],[90185,1.79,276.043,-34.38],[90422,3.49,276.743,-45.97],[90496,2.82,276.993,-25.42],[90568,4.10,277.208,-49.07],[90595,4.67,277.299,-14.57],[90887,5.16,278.089,-39.7],[91117,3.85,278.802,-8.24],[91262,0.03,279.235,38.78],[91792,4.01,280.759,-71.43],[91875,5.11,280.946,-38.32],[91971,4.34,281.193,37.61],[92041,3.17,281.414,-26.99],[92175,4.22,281.794,-4.75],[92202,5.38,281.871,-5.71],[92420,3.52,282.52,33.36],[92609,4.22,283.054,-62.19],[92791,4.22,283.626,36.9],[92814,5.08,283.68,-15.6],[92855,2.05,283.816,-26.3],[92946,4.62,284.055,4.2],[92953,5.35,284.071,-42.71],[92989,5.36,284.169,-37.34],[93015,4.40,284.238,-67.23],[93085,3.52,284.433,-21.11],[93174,4.83,284.681,-37.11],[93194,3.25,284.736,32.69],[93244,4.02,284.906,15.07],[93506,2.60,285.653,-29.88],[93542,4.74,285.779,-42.1],[93683,3.76,286.171,-21.74],[93747,2.99,286.353,13.86],[93805,3.43,286.562,-4.88],[93825,4.23,286.605,-37.06],[93864,3.32,286.735,-27.67],[94005,4.57,287.087,-40.5],[94114,4.11,287.368,-37.9],[94141,2.88,287.441,-21.02],[94160,4.10,287.507,-39.34],[94376,3.07,288.139,67.66],[94779,3.80,289.276,53.37],[94820,4.88,289.409,-18.95],[95168,3.92,290.418,-17.85],[95241,3.96,290.66,-44.46],[95294,4.27,290.805,-44.8],[95347,3.96,290.972,-40.62],[95501,3.36,291.375,3.11],[95771,4.44,292.176,24.66],[95853,3.76,292.426,51.73],[95947,3.05,292.68,27.96],[96406,5.64,294.007,-24.72],[96757,4.39,295.024,18.01],[96837,4.39,295.262,17.48],[97165,2.86,296.244,45.13],[97278,2.72,296.565,10.61],[97365,3.68,296.847,18.53],[97433,3.84,297.043,70.27],[97649,0.76,297.696,8.87],[97804,3.87,298.118,1.01],[98032,4.12,298.815,-41.87],[98036,3.71,298.828,6.41],[98110,3.89,299.077,35.08],[98337,3.51,299.689,19.49],[98412,4.37,299.934,-35.28],[98495,3.97,300.148,-72.91],[98543,4.66,300.275,27.75],[98688,4.43,300.665,-27.71],[98920,5.09,301.29,19.99],[99240,3.55,302.182,-66.18],[99473,3.24,302.826,-0.82],[99675,3.80,303.408,46.74],[99848,3.96,303.868,47.71],[100064,3.58,304.514,-12.54],[100345,3.05,305.253,-14.78],[100453,2.23,305.557,40.26],[100751,1.94,306.412,-56.74],[101421,4.03,308.303,11.3],[101769,3.64,309.387,14.6],[101772,3.11,309.392,-47.29],[101958,3.77,309.91,15.91],[102098,1.25,310.358,45.28],[102281,4.43,310.865,15.07],[102395,3.42,311.24,-66.2],[102422,3.41,311.322,61.84],[102485,4.13,311.524,-25.27],[102488,2.48,311.553,33.97],[102532,4.27,311.665,16.12],[102618,3.78,311.919,-9.5],[102831,4.89,312.492,-33.78],[102978,4.12,312.955,-26.92],[103227,3.67,313.703,-58.45],[103413,3.94,314.293,41.17],[103738,4.67,315.323,-32.26],[104060,3.72,316.233,43.93],[104139,4.08,316.487,-17.23],[104521,4.70,317.585,10.13],[104732,3.21,318.234,30.23],[104858,4.47,318.62,10.01],[104887,3.74,318.698,38.05],[104987,3.92,318.956,5.25],[105140,4.71,319.485,-32.17],[105199,2.45,319.645,62.59],[105319,4.39,319.967,-53.45],[105515,4.28,320.562,-16.83],[105570,5.16,320.723,6.81],[105858,4.21,321.611,-65.37],[105881,3.77,321.667,-22.41],[106032,3.23,322.165,70.56],[106278,2.90,322.89,-5.57],[106481,3.98,323.495,45.59],[106985,3.69,325.023,-16.66],[107089,3.73,325.369,-77.39],[107310,4.49,326.036,28.74],[107315,2.38,326.046,9.88],[107354,4.14,326.161,25.65],[107556,2.85,326.76,-16.13],[107608,5.02,326.934,-30.9],[108085,3.00,328.482,-37.36],[108661,5.43,330.209,-28.45],[109074,2.95,331.446,-0.32],[109111,4.47,331.529,-39.54],[109139,4.29,331.609,-13.87],[109176,3.77,331.753,25.35],[109268,1.73,332.058,-46.96],[109352,5.58,332.307,33.17],[109422,4.94,332.537,-32.55],[109427,3.52,332.55,6.2],[109492,3.39,332.714,58.2],[109937,4.14,333.992,37.75],[110003,4.17,334.208,-7.78],[110130,2.87,334.625,-60.26],[110395,3.86,335.414,-1.39],[110538,4.42,335.89,52.23],[110609,4.55,336.129,49.48],[110960,3.65,337.208,-0.02],[110997,3.97,337.317,-43.5],[111022,4.34,337.383,47.71],[111104,4.52,337.622,43.12],[111123,4.82,337.662,-10.68],[111169,3.76,337.823,50.28],[111188,4.29,337.876,-32.35],[111497,4.04,338.839,-0.12],[111954,4.18,340.164,-27.04],[112029,3.41,340.366,10.83],[112122,2.07,340.667,-46.88],[112158,2.93,340.751,30.22],[112405,4.13,341.515,-81.38],[112440,3.97,341.633,23.57],[112447,4.20,341.673,12.17],[112623,3.49,342.139,-51.32],[112716,4.05,342.398,-13.59],[112724,3.50,342.42,66.2],[112748,3.51,342.501,24.6],[112961,3.73,343.154,-7.58],[113136,3.27,343.663,-15.82],[113246,4.20,343.987,-32.54],[113368,1.17,344.413,-29.62],[113638,4.11,345.22,-52.75],[113726,3.62,345.48,42.33],[113881,2.44,345.944,28.08],[113963,2.49,346.19,15.21],[114131,4.28,346.72,-43.52],[114341,3.68,347.362,-21.17],[114421,3.88,347.59,-45.25],[114855,4.24,348.973,-9.09],[114971,3.70,349.291,3.28],[114996,3.99,349.357,-58.24],[115102,4.41,349.706,-32.53],[115438,3.96,350.743,-20.1],[115738,4.95,351.733,1.26],[115830,4.27,351.992,6.38],[116231,4.38,353.243,-37.82],[116584,3.81,354.391,46.46],[116727,3.21,354.837,77.63],[116771,4.13,354.988,5.63],[116928,4.49,355.512,1.78],[118268,4.03,359.828,6.86]]);

	// Data for star names to display (if showstarlabels is set to true) - index with Hipparcos number
	this.starnames = {"7588":"Achernar","11767":"Polaris","21421":"Aldebaran","24436":"Rigel","24608":"Capella","27989":"Betelgeuse","30438":"Canopus","32349":"Sirius","33579":"Adara","37279":"Procyon","37826":"Pollux","49669":"Regulus","62434":"Mimosa","65378":"Mizar","65474":"Spica","68702":"Hadar","69673":"Arcturus","71683":"Alpha Centauri A","80763":"Antares","85927":"Shaula","91262":"Vega","97649":"Altair","102098":"Deneb","113368":"Fomalhaut"};

	// Identify the default base directory
	this.dir = $('script[src*=virtualsky]').attr('src');  // the JS file path
	var idx = this.dir.lastIndexOf('/');
	if(idx >= 0) this.dir = this.dir.substring(0,idx+1);
	else this.dir = "";

	// Define extra files (JSON/JS)
	this.file = {
		stars: this.dir+"stars.json",                 // Data for faint stars - 54 kB
		lines: this.dir+"lines_latin.json",           // Data for constellation lines - 12 kB
		boundaries: this.dir+"boundaries.json",       // Data for constellation boundaries - 20 kB
		showers: this.dir+"showers.json",             // Data for meteor showers - 4 kB
		galaxy: this.dir+"galaxy.json",               // Data for milky way - 12 kB
		planets: this.dir+"virtualsky-planets.min.js" // Plugin for planet ephemeris - 12kB
	}

	this.hipparcos = {};     // Define our star catalogue
	this.clock = new Date(); // Define the 'current' time
	this.fullsky = false;    // Are we showing the entire sky?

	// Country codes at http://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
	this.language = (navigator.language) ? navigator.language : navigator.userLanguage;			// Set the user language
	this.langcode = this.language.substring(0,2);
	this.langs = new Array();
	this.langs = [{
		"code" : "en",
		"name" : "English",
		"constellations": ['Andromeda','Antlia','Apus','Aquarius','Aquila','Ara','Aries','Auriga','Bootes','Caelum','Camelopardalis','Cancer','Canes Venatici','Canis Major','Canis Minor','Capricornus','Carina','Cassiopeia','Centaurus','Cepheus','Cetus','Chamaeleon','Circinus','Columba','Coma Berenices','Corona\nAustrina','Corona Borealis','Corvus','Crater','Crux','Cygnus','Delphinus','Dorado','Draco','Equuleus','Eridanus','Fornax','Gemini','Grus','Hercules','Horologium','Hydra','Hydrus','Indus','Lacerta','Leo','Leo Minor','Lepus','Libra','Lupus','Lynx','Lyra','Mensa','Microscopium','Monoceros','Musca','Norma','Octans','Ophiuchus','Orion','Pavo','Pegasus','Perseus','Phoenix','Pictor','Pisces','Piscis Austrinus','Puppis','Pyxis','Reticulum','Sagitta','Sagittarius','Scorpius','Sculptor','Scutum','Serpens','Sextans','Taurus','Telescopium','Triangulum','Triangulum\nAustrale','Tucana','Ursa Major','Ursa Minor','Vela','Virgo','Volans','Vulpecula'],
		"planets": ["Mercury","Venus","Mars","Jupiter","Saturn","Uranus","Neptune"],
		"sun":"Sun",
		"moon":"Moon",
		"date": "Date &amp; Time",
		"datechange": "Change the date/time (shown in your local time)",
		"close": "close",
		"position": "Latitude &amp; Longitude",
		"positionchange": "Change the longitude/latitude",
		"N": "N",
		"E": "E",
		"S": "S",
		"W": "W",
		"keyboard": "Keyboard shortcuts:",
		"fast": "increase time speed",
		"stop": "set time rate to zero",
		"slow": "decrease time speed",
		"reset": "set time to now",
		"cardinal": "toggle cardinal points",
		"stars": "toggle stars",
		"starlabels": "toggle star labels",
		"neg": "invert colours",
		"atmos": "toggle atmosphere",
		"ground": "toggle ground",
		"az": "toggle Az/El gridlines",
		"eq": "toggle Ra/Dec gridlines",
		"gal": "toggle Galactic gridlines",
		"galaxy": "toggle Galactic plane",
		"ec": "toggle Ecliptic line",
		"meridian": "toggle Meridian line",
		"con": "toggle constellation lines",
		"conbound": "toggle constellation boundaries",
		"names": "toggle constellation names",
		"sol": "toggle planets/Sun/Moon",
		"sollabels": "toggle planet/Sun/Moon labels",
		"orbits": "toggle planet orbits",
		"projection":"change map projection",
		"meteorshowers":"toggle meteor shower radiants",
		"addday": "add 1 day",
		"subtractday": "subtract 1 day",
		"addweek": "add 1 week",
		"subtractweek": "subtract 1 week",
		"azleft": "rotate left",
		"azright": "rotate right",
		"magup": "increase magnitude limit",
		"magdown": "decrease magnitude limit",
		"left" : "&larr;",
		"right" : "&rarr;",
		"up": "&uarr;",
		"down": "&darr;",
		"power": "Powered by LCOGT"
	},{
		"code" : "es",
		"name" : "Espa&#241;ol",
		"position": "Latitud &amp; Longitud",
		"W": "O",
		"planets": ["Mercurio","Venus","Marte","J&uacute;piter","Saturno","Urano","Neptuno"],
		"sun":"Sol",
		"moon":"Luna",
		"constellations": ['Andr&oacute;meda','La M&aacute;quina neum&aacute;tica','El Ave del Para&iacute;so','Acuario','El &Aacute;guila','El Altar','Aries','Auriga','El Boyero','Caelum','La Jirafa','C&aacute;ncer','Canes Venatici','El Perro Mayor','El Perro peque&ntilde;o','Capricornio','Carina','Casiopea','El Centauro','Cefeo','Ceto','El Camale&oacute;n','El Comp&aacute;s','La Paloma','La cabellera de Berenice','La Corona Austral','La Corona Boreal','El Cuervo','La Copa','La Cruz','El Cisne','El Delf&iacute;n','El Pez dorado','El Drag&oacute;n','El Caballo','El R&iacute;o','El Horno','Los Gemelos','La Grulla','H&eacute;rcules','Reloj','Hydra','La Serpiente marina','El Indio','Lagarto','Le&oacute;n','Le&oacute; peque&ntilde;o','Conejo','La Balanza','Lobo','Lince','La Lira','La Mesa','Microscopio','El Unicornio','La Mosca','Regla','El Octante','Ofiuco','Ori&oacute;n','El Pavo','Pegaso','Perseo','El F&eacute;nix','La Paleta del Pintor','Los Peces','Pez Austral','La Popa','Br&uacute;jula','El Ret&iacute;culo','Flecha','Sagitario','El Escorpi&oacute;n','Escultor','Escudo','La Serpiente','El Sextante','Tauro','Telescopio','Tri&aacute;ngulo','El Tri&aacute;ngulo Austral','El Tuc&aacute;n','Oso Mayor','Oso Peque&ntilde;o','Vela','Virgo','El Pez volador','El Zorro']
	}];

	// Define the colours that we will use
	this.colours = {
		'normal' : {
			'txt' : "rgb(255,255,255)",
			'black':"rgb(0,0,0)",
			'white':"rgb(255,255,255)",
			'grey':"rgb(100,100,100)",
			'stars':'rgb(255,255,255)',
			'sun':'rgb(255,215,0)',
			'moon':'rgb(150,150,150)',
			'cardinal':'rgba(163,228,255, 1)',
			'constellation':"rgba(180,180,255,0.8)",
			'constellationboundary':"rgba(255,255,100,0.6)",
			'showers':"rgba(100,255,100,0.8)",
			'galaxy':"rgba(100,200,255,0.5)",
			'az':"rgba(100,100,255,0.4)",
			'eq':"rgba(255,100,100,0.4)",
			'ec':'rgba(255,0,0,0.4)',
			'gal':'rgba(100,200,255,0.4)',
			'meridian':'rgba(25,255,0,0.4)',
			'pointers':'rgb(200,200,200)'
		},
		'negative':{
			'txt' : "rgb(0,0,0)",
			'black':"rgb(0,0,0)",
			'white':"rgb(255,255,255)",
			'grey':"rgb(100,100,100)",
			'stars':'rgb(0,0,0)',
			'sun':'rgb(0,0,0)',
			'moon':'rgb(0,0,0)',
			'cardinal':'rgba(0,0,0,1)',
			'constellation':"rgba(0,0,0,0.8)",
			'constellationboundary':"rgba(0,0,0,0.6)",
			"showers":"rgba(0,0,0,0.8)",
			'galaxy':"rgba(0,0,0,0.5)",
			'az':"rgba(0,0,255,0.6)",
			'eq':"rgba(255,100,100,0.8)",
			'ec':'rgba(255,0,0,0.6)',
			'gal':'rgba(100,200,255,0.8)',
			'meridian':'rgba(0,255,0,0.6)'
		}
	};

	// Keep a copy of the inputs
	this.input = input;

	// Overwrite our defaults with input values
	this.init(input);

	if(typeof this.polartype=="undefined") this.selectProjection('polar');	// Set the default projection

	// Update the colours
	this.updateColours();

	this.changeLanguage(this.langcode);

	// Define some VirtualSky styles
	var v,a,b,r,s,p;
	v = '.virtualsky';
	a = '#f0f0f0';
	b = '#fcfcfc';
	function br(i){ return 'border-radius:'+i+';-moz-border-radius:'+i+';-webkit-border-radius:'+i+';';}
	function bs(){ return 'box-shadow:0px 0px 20px rgba(255,255,255,0.5);';}
	r = br('0.5em');
	s = br('3px');
	$('<style type="text/css">'+v+'_help { padding:10px;background-color:white;'+r+'} '+v+'_help ul { list-style:none;margin:0px;padding:0px; } '+v+'infobox { background-color:rgb(200,200,200);color:black;padding:5px;'+r+bs()+'} '+v+'infobox img {} '+v+'infocredit {color:white;float:left;font-size:0.8em;padding:5px;position:absolute;} '+v+'form { position:absolute;z-index:20;display:block;overflow:hidden;background-color:#ddd;padding:10px;'+bs()+r+' } '+v+'_dismiss { float:right;padding-left:5px;padding-right:5px;margin:0px;font-weight:bold;cursor:pointer;color:black;margin-right:-5px;margin-top:-5px; } '+v+'form input,'+v+'form .divider { display:inline-block;font-size:1em;text-align:center;margin-right:2px; } '+v+'form .divider { margin-top: 5px; padding: 2px;} '+v+'_help_key:active{ background:#e9e9e9; } '+v+'_help_key:hover{ border-color: #b0b0b0; } '+v+'_help_key { cursor:pointer;display:inline-block;text-align:center;background:'+a+';background:-moz-linear-gradient(top,'+a+','+b+');background:-webkit-gradient(linear,center top,center bottom,from('+a+'),to('+b+'));'+s+'-webkit-background-clip:padding-box;-moz-background-clip:padding;background-clip:padding-box;color:#303030;border:1px solid #e0e0e0;border-bottom-width:2px;white-space:nowrap;font-family:monospace;padding:1px 6px;font-size:1.1em;}</style>').appendTo("head");

	this.pointers = new Array(); // Define an empty list of pointers/markers

	// Internal variables
	this.dragging = false;
	this.x = "";
	this.y = "";
	this.theta = 0;
	this.skygrad;
	this.infobox = "virtualskyinfobox";
	this.container = '';
	this.now = this.clock;
	this.times = this.astronomicalTimes();
	if(this.id) this.createSky();

	// Find out where the Sun and Moon are
	p = this.moonPos(this.times.JD);
	this.moon = p.moon;
	this.sun = p.sun;

	if(this.islive) interval = window.setInterval(function(sky){ sky.setClock('now'); },1000,this);

}
VirtualSky.prototype.init = function(d){
	if(!d) return this;
	var q = location.search;
	if(q && q != '#'){
		var bits = q.replace(/^\?/,'').replace(/\&$/,'').split('&'); // remove the leading ? and trailing &
		var key,val;
		for(var i = 0; i < bits.length ; i++){
			key = bits[i].split('=')[0], val = bits[i].split('=')[1];
			// convert floats
			if(/^[0-9.\-]+$/.test(val)) val = parseFloat(val);
			if(val == "true") val = true;
			if(val == "false") val = false;
			if(typeof d[key]=="undefined") d[key] = val;
		}
	}
	var n = "number";
	var s = "string";
	var b = "boolean";
	var o = "object";
	var f = "function";
	// Overwrite defaults with variables passed to the function
	if(is(d.id,s)) this.id = d.id;
	if(is(d.projection,s)) this.selectProjection(d.projection);
	if(is(d.gradient,b)) this.gradient = d.gradient;
	if(is(d.cardinalpoints,b)) this.cardinalpoints = d.cardinalpoints;
	if(is(d.negative,b)) this.negative = d.negative;
	if(is(d.constellations,b)) this.constellation.lines = d.constellations;
	if(is(d.constellationboundaries,b)) this.constellation.boundaries = d.constellationboundaries;
	if(is(d.constellationlabels,b)) this.constellation.labels = d.constellationlabels;
	if(is(d.meteorshowers,b)) this.meteorshowers = d.meteorshowers;
	if(is(d.showstars,b)) this.showstars = d.showstars;
	if(is(d.scalestars,n)) this.scalestars = d.scalestars;
	if(is(d.showstarlabels,b)) this.showstarlabels = d.showstarlabels;
	if(is(d.starnames,o)) this.starnames = d.starnames;
	if(is(d.showplanets,b)) this.showplanets = d.showplanets;
	if(is(d.showplanetlabels,b)) this.showplanetlabels = d.showplanetlabels;
	if(is(d.showorbits,b)) this.showorbits = d.showorbits;
	if(is(d.showgalaxy,b)) this.showgalaxy = d.showgalaxy;
	if(is(d.showdate,b)) this.showdate = d.showdate;
	if(is(d.showposition,b)) this.showposition = d.showposition;
	if(is(d.keyboard,b)) this.keyboard = d.keyboard;
	if(is(d.mouse,b)) this.mouse = d.mouse;
	if(is(d.ground,b)) this.ground = d.ground;
	if(is(d.gridlines_az,b)) this.grid.az = d.gridlines_az;
	if(is(d.gridlines_eq,b)) this.grid.eq = d.gridlines_eq;
	if(is(d.gridlines_gal,b)) this.grid.gal = d.gridlines_gal;
	if(is(d.gridstep,n)) this.grid.step = d.gridstep;
	if(is(d.ecliptic,b)) this.ecliptic = d.ecliptic;
	if(is(d.meridian,b)) this.meridian = d.meridian;
	if(is(d.magnitude,n)) this.magnitude = d.magnitude;
	if(is(d.longitude,n)) this.setLongitude(d.longitude);
	if(is(d.latitude,n)) this.setLatitude(d.latitude);
	if(is(d.clock,s)) this.clock = new Date(d.clock.replace(/%20/g,' '));
	if(is(d.clock,o)) this.clock = d.clock;
	if(is(d.background,s)) this.background = d.background;
	if(is(d.color,s)) this.color = d.color;
	if(is(d.az,n)) this.az_off = (d.az%360)-180;
	if(is(d.ra,n)) this.setRA(d.ra);
	if(is(d.dec,n)) this.setDec(d.dec);
	if(is(d.fov,n)) this.fov = d.fov;
	if(is(d.objects,s)) this.objects = d.objects;
	if(is(d.base,s)) this.base = d.base;
	if(is(d.planets,s)) this.file.planets = d.planets;
	if(is(d.planets,o)) this.planets = d.planets;
	if(is(d.lines,s)) this.file.lines = d.lines;
	if(is(d.lines,o)) this.lines = d.lines;
	if(is(d.boundaries,s)) this.file.boundaries = d.boundaries;
	if(is(d.boundaries,o)) this.boundaries = d.boundaries;
	if(is(d.width,n)) this.wide = d.width;
	if(is(d.height,n)) this.tall = d.height;
	if(is(d.live,b)) this.islive = d.live;
	if(is(d.fullscreen,b)) this.fullscreen = d.fullscreen;
	if(is(d.credit,b)) this.credit = d.credit;
	if(is(d.transparent,b)) this.transparent = d.transparent;
	if(is(d.lang,s) && d.lang.length==2) this.langcode = d.lang;
	if(is(d.fontfamily,s)) this.fntfam = d.fontfamily.replace(/%20/g,' ');
	if(is(d.fontsize,s)) this.fntsze = d.fontsize;
	if(is(d.plugins,o)) this.plugins = d.plugins;
	if(is(d.callback,o)){
		if(is(d.callback.geo,f)) this.callback.geo = d.callback.geo;
		if(is(d.callback.mouseenter,f)) this.callback.mouseenter = d.callback.mouseenter;
		if(is(d.callback.mouseout,f)) this.callback.mouseout = d.callback.mouseout;
	}

	return this;
}
VirtualSky.prototype.changeLanguage = function(code){
	for(var i = 0; i < this.langs.length ; i++){
		if(this.langs[i].code==code){ this.lang = this.langs[i]; return this; }
	}
	this.lang = this.langs[0];
	return this;
}
VirtualSky.prototype.htmlDecode = function(input){
	var e = document.createElement('div');
	e.innerHTML = input;
	return e.childNodes[0].nodeValue;
}
VirtualSky.prototype.getPhrase = function(key,key2){
	if(key=="constellations"){
		if(key2 < this.lang.constellations.length) return this.htmlDecode(this.lang.constellations[key2]);
	}else if(key=="planets"){
		if(typeof key2==="string"){
			// Loop over primary language planets to look for a match
			for(var i = 0; i < this.langs[0].planets.length; i++){
				if(this.langs[0].planets[i]==key2){
					key2 = i;
					continue;
				}
			}
		}
		if(typeof key2==="number" && key2 < this.lang.planets.length) return this.htmlDecode(this.lang.planets[key2]);
		else if(typeof key2==="string") return this.htmlDecode(this.lang[key2]);
	}else return (this.lang[key]) ? this.lang[key] : (this.langs[0][key] ? this.langs[0][key] : "");
	return "";
}
VirtualSky.prototype.resize = function(w,h){
	if(!this.canvas) return;
	if(!w || !h){
		if(this.fullscreen){
			this.canvas.css({'width':0,'height':0});
			w = $(window).width();
			h = $(window).height();
			this.canvas.css({'width':w,'height':h});
			$(document).css({'width':w,'height':h});
		}else{
			// We have to zap the width of the canvas to let it take the width of the container
			this.canvas.css({'width':0,'height':0});
			w = this.container.outerWidth();
			h = this.container.outerHeight();
			this.canvas.css({'width':w,'height':h});
		}
	}
	if(w == this.wide && h == this.tall) return;
	this.setWH(w,h);
	this.positionCredit();
	this.updateSkyGradient();
	this.draw();
}
VirtualSky.prototype.setWH = function(w,h){
	if(!w || !h) return;
	this.c.width = w;
	this.c.height = h;
	this.wide = w;
	this.tall = h;
	this.changeFOV();
	// Bug fix for IE 8 which sets a width of zero to a div within the <canvas>
	if(this.ie && $.browser.version == 8) $('#'+this.idinner).find('div').css({'width':w,'height':h});
	this.canvas.css({'width':w,'height':h});
}
VirtualSky.prototype.changeFOV = function(delta){
	var fov = this.fov;
	if(delta > 0) fov /= 1.2;
	else if(delta < 0) fov *= 1.2;
	return this.setFOV(fov);
}
VirtualSky.prototype.setFOV = function(fov){
	if(fov > 60 || typeof fov!=="number") this.fov = 60;
	else if(fov < 1) this.fov = 1;
	else this.fov = fov;
	this.maxangle = this.d2r*this.fov*Math.max(this.wide,this.tall)/this.tall;
	this.maxangle = Math.min(this.maxangle,Math.PI/2)
	return this;
}
// Some pseudo-jQuery
VirtualSky.prototype.hide = function(){ this.container.hide(); return this; }
VirtualSky.prototype.show = function(){ this.container.show(); return this; }
VirtualSky.prototype.toggle = function(){ this.container.toggle(); return this; }
// Our stars are stored in decimal degrees so we will convert them here
VirtualSky.prototype.convertStarsToRadians = function(stars){
	for(var i = 0; i < stars.length; i++){
		stars[i][2] *= this.d2r;
		stars[i][3] *= this.d2r;
	}
	return stars;
}
VirtualSky.prototype.load = function(t,file,fn){
	return this.loadJSON(file,function(data){
		if(t=="stars"){ this.starsdeep = true; this.stars = this.stars.concat(this.convertStarsToRadians(data.stars));}
		else{ this[t] = data[t]; }
		this.draw();
		this.trigger("loaded"+(t.charAt(0).toUpperCase() + t.slice(1)),{data:data});
	},fn);
}
VirtualSky.prototype.loadJSON = function(file,callback,complete){
	if(typeof file!=="string") return this;
	var dt = (file.indexOf('.json') >= 0) ? "json" : "script";
	if(typeof complete!=="function") complete = function(){ };
	if(dt=="script"){
		// If we are loading an external script we need to make sure we initiate 
		// it first. To do that we will re-write the callback that was provided.
		var tmp = callback;
		callback = function(data){
			// Initialize any plugins
			for (var i = 0; i < this.plugins.length; ++i){
				if(typeof this.plugins[i].init=="function") this.plugins[i].init.call(this);
			}
			tmp.call(this,data);
		};
	}
	var config = { dataType: dt, url: this.base+file, context: this, success: callback, complete: complete };
	if(dt=="json") config.jsonp = 'onJSONPLoad';
	if(dt=="script") config.cache = true;	// Use a cached version
	$.ajax(config);
	return this;
}
VirtualSky.prototype.createSky = function(){
	this.container = $('#'+this.id);
	this.container.addTouch();
	this.times = this.astronomicalTimes();

	if(this.fntfam) this.container.css({'font-family':this.fntfam});
	if(this.fntsze) this.container.css({'font-size':this.fntsze});

	if(this.container.length == 0){
		// No appropriate container exists. So we'll make one.
		$('body').append('<div id="'+this.id+'"></div>');
		this.container = $('#'+this.id);
	}
	this.container.css('position','relative');
	$(window).resize({me:this},function(e){ e.data.me.resize(); });

	// Get the planet data
	if(!this.planets) this.load('planets',this.file.planets);

	// Get the constellation line data
	if(!this.lines) this.load('lines',this.file.lines);
	
	// Get the constellation line data
	if(!this.boundaries) this.load('boundaries',this.file.boundaries);
	
	// Get the meteor showers
	if(!this.showers) this.load('showers',this.file.showers);

	// Get the Milky Way
	if(!this.galaxy) this.load('galaxy',this.file.galaxy);

	// Get the faint star data
	this.changeMagnitude(0);

	// Add named objects to the display
	if(this.objects){
		var ob = this.objects.split(';');
		for(var o = 0; o < ob.length ; o++){
			$.ajax({ dataType: "jsonp", url: 'http://www.strudel.org.uk/lookUP/json/?name='+ob[o], context: this, success: function(data){
				if(data && data.dec && data.ra){
					this.addPointer({'ra':data.ra.decimal,'dec':data.dec.decimal,'label':data.target.name,colour:this.col.pointers});
					this.draw();
				}
			}});
		}
	}

	// If the Javascript function has been passed a width/height
	// those take precedence over the CSS-set values
	if(this.wide > 0) this.container.css('width',this.wide);
	this.wide = this.container.width();
	if(this.tall > 0) this.container.css('height',this.tall);
	this.tall = this.container.height();

	// Add a <canvas> to it with the original ID
	this.idinner = this.id+'_inner';
	this.container.html('<canvas id="'+this.idinner+'" style="display:block;"></canvas>');
	this.canvas = $('#'+this.idinner);
	this.c = document.getElementById(this.idinner);
	// For excanvas we need to initialise the newly created <canvas>
	if(this.excanvas) this.c = G_vmlCanvasManager.initElement(this.c);

	if(this.c && this.c.getContext){  
		this.setWH(this.wide,this.tall);
		this.ctx = this.c.getContext('2d');
		this.ctx.clearRect(0,0,this.wide,this.tall);
		this.ctx.beginPath();
		var fs = this.fontsize();
		this.ctx.font = fs+"px Helvetica";
		this.ctx.fillStyle = 'rgb(0,0,0)';
		this.ctx.lineWidth = 1.5;
		var loading = 'Loading sky...';
		this.ctx.fillText(loading,(this.wide-this.ctx.measureText(loading).width)/2,(this.tall-fs)/2)
		this.ctx.fill();

		$("#"+this.idinner).on('click',{sky:this},function(e){
			var x = e.pageX - $(this).offset().left - window.scrollX;
			var y = e.pageY - $(this).offset().top - window.scrollY;
			matched = e.data.sky.whichPointer(x,y);
			e.data.sky.toggleInfoBox(matched);
			if(matched >= 0) $(e.data.sky.canvas).css({cursor:'pointer'});
		}).on('mousemove',{sky:this},function(e){
			var s = e.data.sky;
			// We don't need scrollX/scrollY as pageX/pageY seem to include this
			var x = e.pageX - $(this).offset().left;
			var y = e.pageY - $(this).offset().top;
			var theta,f,dr;
			if(s.mouse) $(s.canvas).css({cursor:'move'});
			if(s.dragging && s.mouse){
				if(s.polartype){
					theta = Math.atan2(y-s.tall/2,x-s.wide/2);
					if(!s.theta) s.theta = theta;
					s.az_off -= (s.theta-theta)*s.r2d;
					s.theta = theta;
				}else if(s.projection.id=="gnomic"){
					f = 0.0015*(s.fov*s.d2r);
					dr = 0;
					if(typeof s.x=="number") dr = Math.min(Math.abs(s.x-x)*f/(Math.cos(s.dc_off)),Math.PI/36);
					if(typeof s.y=="number") s.dc_off -= (s.y-y)*f;
					s.ra_off -= (s.x-x > 0 ? 1 : -1)*dr;
					s.dc_off = inrangeEl(s.dc_off);
				}else{
					if(typeof s.x=="number") s.az_off += (s.x-x)/4;
				}
				s.az_off = s.az_off%360;
				s.x = x;
				s.y = y;
				s.draw();
				$(s.canvas).css({cursor:'-moz-grabbing'});
			}else{
				matched = s.whichPointer(x,y);
				if(matched >= 0) $(s.canvas).css({cursor:'pointer'});
				s.toggleInfoBox(matched);
			}	
		}).on('mousedown',{sky:this},function(e){
			e.data.sky.dragging = true;
		}).on('mouseup',{sky:this},function(e){
			var s = e.data.sky;
			s.dragging = false;
			s.x = "";
			s.y = "";
			s.theta = "";
		}).on('mouseout',{sky:this},function(e){
			var s = e.data.sky;
			s.dragging = false;
			s.mouseover = false;
			s.x = "";
			s.y = "";
			if(typeof s.callback.mouseout=="function") s.callback.mouseout.call(s);
		}).on('mouseenter',{sky:this},function(e){
			var s = e.data.sky;
			s.mouseover = true;
			if(typeof s.callback.mouseenter=="function") s.callback.mouseenter.call(s);
		}).on('mousewheel',{sky:this},function(e, delta) {
			var s = e.data.sky;
			if(s.mouse && s.projection.id=="gnomic"){
				s.changeFOV(delta).draw();
				return false;
			}else return true;
		});
		$(document).bind('keypress',{sky:this},function(e){
			if(!e) e = window.event;
			var code = e.keyCode || e.charCode || e.which || 0;
			e.data.sky.keypress(code,e);
		});
	}

	this.registerKey('a',function(){ this.toggleAtmosphere(); },'atmos');
	this.registerKey('g',function(){ this.toggleGround(); },'ground');
	this.registerKey('h',function(){ this.cycleProjection(); },'projection');
	this.registerKey('i',function(){ this.toggleNegative(); },'neg');
	this.registerKey(',',function(){ this.toggleEcliptic(); },'ec');
	this.registerKey(';',function(){ this.toggleMeridian(); },'meridian');
	this.registerKey('e',function(){ this.toggleGridlinesEquatorial(); },'eq');
	this.registerKey('z',function(){ this.toggleGridlinesAzimuthal(); },'az');
	this.registerKey('m',function(){ this.toggleGridlinesGalactic(); },'gal');
	this.registerKey('M',function(){ this.toggleGalaxy(); },'galaxy');
	this.registerKey('q',function(){ this.toggleCardinalPoints(); },'cardinal');
	this.registerKey('s',function(){ this.toggleStars(); },'stars');
	this.registerKey('S',function(){ this.toggleStarLabels(); },'starlabels');
	this.registerKey('u',function(){ this.togglePlanetLabels(); },'sollabels');
	this.registerKey('p',function(){ this.togglePlanetHints(); },'sol');
	this.registerKey('o',function(){ this.toggleOrbits(); },'orbits');
	this.registerKey('c',function(){ this.toggleConstellationLines(); },'con');
	this.registerKey('v',function(){ this.toggleConstellationLabels(); },'names');
	this.registerKey('b',function(){ this.toggleConstellationBoundaries(); },'conbound');
	this.registerKey('R',function(){ this.toggleMeteorShowers(); },'meteorshowers');
	this.registerKey('1',function(){ this.toggleHelp(); });
	this.registerKey('8',function(){ this.setClock('now'); },'reset');
	this.registerKey('j',function(){ this.spinIt("down"); },'slow');
	this.registerKey('k',function(){ this.spinIt(0) },'stop');
	this.registerKey('l',function(){ this.spinIt("up"); },'fast');
	this.registerKey('-',function(){ this.setClock(-86400); },'subtractday');
	this.registerKey('=',function(){ this.setClock(86400); },'addday');
	this.registerKey('[',function(){ this.setClock(-86400*7); },'subtractweek');
	this.registerKey(']',function(){ this.setClock(86400*7); },'addweek');
	this.registerKey(37,function(){ this.az_off -= 2; this.draw(); },'azleft'); // left
	this.registerKey(39,function(){ this.az_off += 2; this.draw(); },'azright'); // right
	this.registerKey(38,function(){ this.changeMagnitude(0.25); },'magup'); // up
	this.registerKey(40,function(){ this.changeMagnitude(-0.25);},'magdown'); // down
	this.registerKey(63,function(){ this.toggleHelp(); });

	this.draw();
}
VirtualSky.prototype.changeMagnitude = function(m){
	if(typeof m!=="number") return this;
	this.magnitude += m;
	if(!this.starsdeep && this.magnitude > 4) this.load('stars',this.file.stars,function(){ this.draw(); });
	else this.draw();
	return this;
}
VirtualSky.prototype.toggleHelp = function(){
	var v = "virtualsky";
	if($('.'+v+'_dismiss').length > 0) $('.'+v+'_dismiss').trigger('click');
	else{
		// Build the list of keyboard options
		var o = '';
		for(var i = 0; i < this.keys.length ; i++){ if(this.keys[i].txt) o += '<li><strong class="'+v+'_help_key '+v+'_'+this.keys[i].txt+'">'+this.keys[i].str+'</strong> &rarr; <a href="#" class="'+v+'_'+this.keys[i].txt+'" style="text-decoration:none;">'+this.getPhrase(this.keys[i].txt)+'</a></li>'; }
		$('<div class="'+v+'_help"><div class="'+v+'_dismiss" title="close">&times;</div><span>'+this.getPhrase('keyboard')+'</span><div class="'+v+'_helpinner"><ul></ul></div></div>').appendTo(this.container);

		var hlp = $('.'+v+'_help');
		var h = hlp.outerHeight();

		// Add the keyboard option list
		hlp.find('ul').html(o);

		// Set the maximum height for the list and add a scroll bar if necessary
		$('.'+v+'_helpinner').css({'overflow':'auto','max-height':(this.tall-h)+'px'});

		// Add the events for each keyboard option
		for(var i = 0; i < this.keys.length ; i++){ if(this.keys[i].txt) $('.'+v+'_'+this.keys[i].txt).on('click',{fn:this.keys[i].fn,me:this},function(e){ e.preventDefault(); e.data.fn.call(e.data.me); }); }

		// Create a lightbox
		this.lightbox($('.'+v+'_help'));

		$('.'+v+'_help, .'+v+'_bg').on('mouseout',{sky:this},function(e){ e.data.sky.mouseover = false; }).on('mouseenter',{sky:this},function(e){ e.data.sky.mouseover = true; });
	}
}
// Register keyboard commands and associated functions
VirtualSky.prototype.registerKey = function(charCode,fn,txt){
	if(typeof fn!="function") return this;
	if(typeof charCode!="object") charCode = [charCode];
	var aok, ch, c, i, alt, str;
	for(c = 0 ; c < charCode.length ; c++){
		alt = false;
		if(typeof charCode[c]=="string"){
			if(charCode[c].indexOf('alt')==0){
				str = charCode[c];
				alt = true;
				charCode[c] = charCode[c].substring(4);
			}else{
				str = charCode[c];
			}
			ch = charCode[c].charCodeAt(0);
		}else{
			ch = charCode[c];
			if(ch==37) str = this.getPhrase("left");
			else if(ch==38) str = this.getPhrase("up");
			else if(ch==39) str = this.getPhrase("right");
			else if(ch==40) str = this.getPhrase("down");
			else str = String.fromCharCode(ch);
		}
		aok = true;
		for(i = 0 ; i < this.keys.length ; i++){ if(this.keys.charCode == ch && this.keys.altKey == alt) aok = false; }
		if(aok) this.keys.push({'str':str,'charCode':ch,'char':String.fromCharCode(ch),'fn':fn,'txt':txt,'altKey':alt});
	}
	return this;
}
// Work out if the keypress has a function that needs to be called.
VirtualSky.prototype.keypress = function(charCode,event){
	if(!event) event = { altKey: false };
	if(this.mouseover && this.keyboard){
		for(var i = 0 ; i < this.keys.length ; i++){
			if(this.keys[i].charCode == charCode && event.altKey == this.keys[i].altKey){
				this.keys[i].fn.call(this,{event:event});
				break;
			}
		}
	}
}
VirtualSky.prototype.whichPointer = function(x,y){
	for(var i = 0 ; i < this.pointers.length ; i++){
		if(Math.abs(x-this.pointers[i].x) < 5 && Math.abs(y-this.pointers[i].y) < 5) return i
	}
	return -1;
}
VirtualSky.prototype.toggleInfoBox = function(i){
	if(this.pointers.length == 0 || i > this.pointers.length) return this;

	if($('#'+this.id+'_'+this.infobox).length <= 0) this.container.append('<div id="'+this.id+'_'+this.infobox+'" class="virtualskyinfobox" style="display:none;"></div>');
	el = $('#'+this.id+'_'+this.infobox);
	if(i >= 0 && this.isVisible(this.pointers[i].el) && this.pointers[i].x > 0 && this.pointers[i].y > 0 && this.pointers[i].x < this.wide && this.pointers[i].y < this.tall){
		var offset = this.container.position();
		el.html(this.pointers[i].html);
		var x = this.pointers[i].x - Math.round(el.outerWidth()/2);
		var y = this.pointers[i].y - Math.round(el.outerHeight()/2);
		el.css({'position':'absolute',left:x,top:y,'z-index':10}).fadeIn("fast");
	}else el.hide();
}
// compute horizon coordinates from utc, ra, dec
// ra, dec in radians
// lat, lon in  degrees
// results returned in hrz_altitude, hrz_azimuth
VirtualSky.prototype.coord2horizon = function(ra, dec){
	var ha, alt, az, sd, sl, cl;
	// compute hour angle in degrees
	ha = (Math.PI*this.times.LST/12) - ra;
	sd = Math.sin(dec);
	sl = Math.sin(this.latitude);
	cl = Math.cos(this.latitude);
	// compute altitude in radians
	alt = Math.asin(sd*sl + Math.cos(dec)*cl*Math.cos(ha));
	// compute azimuth in radians
	// divide by zero error at poles or if alt = 90 deg (so we should've already limited to 89.9999)
	az = Math.acos((sd - Math.sin(alt)*sl)/(Math.cos(alt)*cl));
	// choose hemisphere
	if (Math.sin(ha) > 0) az = 2*Math.PI - az;
	return [alt,az];
}
function inrangeAz(a,deg){
	if(deg){
		while(a < 0) a += 360;
		while(a > 360) a -= 360;
	}else{
		var twopi = (2*Math.PI);
		while(a < 0) a += twopi;
		while(a > twopi) a -= twopi;	
	}
	return a;
}
function inrangeEl(a,deg){
	if(deg){
		if(a >= 90) a = 89.99999;
		if(a <= -90) a = -89.99999;
	}else{
		if(a >= Math.PI/2) a = (Math.PI/2)*0.999999;
		if(a <= -Math.PI/2) a = (-Math.PI/2)*0.999999;
	}
	return a;
}
VirtualSky.prototype.selectProjection = function(proj){
	if(this.projections[proj]){
		this.projection = this.projections[proj];
		this.projection.id = proj;
		this.fullsky = (typeof this.projection.fullsky=="boolean") ? this.projection.fullsky : false;
		this.polartype = (typeof this.projection.polartype=="boolean") ? this.projection.polartype : false;

		// Set coordinate transforms
		
		// Convert AZ,EL -> X,Y
		// Inputs: az (rad), el (rad), width (px), height (px)
		if(typeof this.projection.azel2xy==="function") this.azel2xy = this.projection.azel2xy;
		else this.azel2xy = function(az,el,w,h){
			if(!w) w = this.wide;
			if(!h) h = this.tall;
			if(az < 0) az += 360;
			return {x:-1,y:-1,el:-1};
		}

		// Convert AZ,EL -> RA,Dec
		// Inputs: az (rad), el (rad)
		// Output: { ra: ra (deg), dec: dec (deg) }
		if(typeof this.projection.azel2radec==="function") this.azel2radec = this.projection.azel2radec;
		else this.azel2radec = function(az,el){
			var xt,yt,r,l;
			l = this.latitude;
			xt  =  Math.asin( Math.sin(el) * Math.sin(l) + Math.cos(el) * Math.cos(l) * Math.cos(az) );
			r = ( Math.sin(el) - Math.sin(l) * Math.sin(xt) ) / ( Math.cos(l) * Math.cos(xt) );
			if(r > 1) r = 1;
			yt  =  Math.acos(r);
			if(Math.sin(az) > 0.0) yt  =  Math.PI*2 - yt;
			xt *= this.r2d;
			yt *= this.r2d;
			yt = (this.times.LST*15 - yt + 360)%360.0;
			return { ra: yt, dec: xt }
		}

		if(this.ctx) this.updateSkyGradient();

		this.updateColours();

		// Draw update label
		if(this.container){
			var w = this.container.width();
			var h = this.container.height();
			if($('.'+this.id+'_projection').length > 0) $('.'+this.id+'_projection').remove();
			this.container.append('<div class="'+this.id+'_projection">'+this.projections[proj].title+'</div>');
			$('.'+this.id+'_projection').on('mouseover',{me:this},function(e){ e.data.me.mouseover = true; }).css({position:'absolute',padding:0,width:w+'px',top:0,left:0,'text-align':'center','line-height':h+'px',zIndex:20,fontSize:'1.5em',display:'block',overflow:'hidden',backgroundColor:'transparent',color:(this.negative ? this.col.black : this.col.white)}).delay(500).fadeOut(1000,function(){ $(this).remove(); });
		}
	}
}
// Cycle through the map projections
VirtualSky.prototype.cycleProjection = function(){
	var usenext = false;
	var proj = this.projection.id;
	var i = 0;
	var firstkey;
	for(var key in this.projections){
		if(i==0) firstkey = key;
		if(usenext){
			proj = key;
			break;
		}
		if(key == this.projection.id) usenext = true;
		i++;
	}
	if(proj == this.projection.id) proj = firstkey;
	this.draw(proj);
}
// Update the sky colours
VirtualSky.prototype.updateColours = function(){
	// We need to make a copy of the correct colour palette otherwise it'll overwrite it
	this.col = $.extend(true, {}, ((this.negative) ? this.colours.negative : this.colours.normal));
	if(this.color==""){
		if((this.polartype || this.projection.altlabeltext)) this.col.txt = this.col.grey;
	}else{
		this.col.txt = this.color;
	}
}

VirtualSky.prototype.isVisible = function(el){
	if(typeof this.projection.isVisible==="function") return this.projection.isVisible.call(el);
	if(!this.fullsky) return (el > 0);
	else return (this.ground) ? (el > 0) : true;
}
VirtualSky.prototype.isPointBad = function(p){
	if(p.x==-1 && p.y==-1) return true;
	else return false;
}
// Return a structure with the Julian Date, Local Sidereal Time and Greenwich Sidereal Time
VirtualSky.prototype.astronomicalTimes = function(clock,lon){
	if(typeof clock=="undefined") clock = this.now;
	if(typeof lon=="undefined") lon = this.longitude*this.r2d;
	var JD,JD0,S,T,T0,UT,A,GST,d,LST;
	JD = this.getJD(clock);
	JD0 = Math.floor(JD-0.5)+0.5;
	S = JD0-2451545.0;
	T = S/36525.0;
	T0 = (6.697374558 + (2400.051336*T) + (0.000025862*T*T))%24;
	if(T0 < 0) T0 += 24;
	UT = (((clock.getUTCMilliseconds()/1000 + clock.getUTCSeconds())/60) + clock.getUTCMinutes())/60 + clock.getUTCHours();
	A = UT*1.002737909;
	T0 += A;
	GST = T0%24;
	if(GST < 0) GST += 24;
	d = (GST + lon/15.0)/24.0;
	d = d - Math.floor(d);
	if(d < 0) d += 1;
	LST = 24.0*d;
	return { GST:GST, LST:LST, JD:JD };
}
// Uses algorithm defined in Practical Astronomy (4th ed) by Peter Duffet-Smith and Jonathan Zwart
VirtualSky.prototype.moonPos = function(JD,sun){
	var d2r,JD,sun,lo,Po,No,i,e,l,Mm,N,C,Ev,sinMo,Ae,A3,Mprimem,Ec,A4,lprime,V,lprimeprime,Nprime,lppNp,sinlppNp,y,x,lm,Bm;
	d2r = this.d2r;
	if(typeof JD=="undefined") JD = this.times.JD;
	if(typeof sun=="undefined") sun = this.sunPos(JD);
	lo = 91.929336;	// Moon's mean longitude at epoch 2010.0
	Po = 130.143076;	// mean longitude of the perigee at epoch
	No = 291.682547;	// mean longitude of the node at the epoch
	i = 5.145396;	// inclination of Moon's orbit
	e = 0.0549;	// eccentricity of the Moon's orbit
	l = (13.1763966*sun.D + lo)%360;
	if(l < 0) l += 360;
	Mm = (l - 0.1114041*sun.D - Po)%360;
	if(Mm < 0) Mm += 360;
	N = (No - 0.0529539*sun.D)%360;
	if(N < 0) N += 360;
	C = l-sun.lon;
	Ev = 1.2739*Math.sin((2*C-Mm)*d2r);
	sinMo = Math.sin(sun.Mo*d2r);
	Ae = 0.1858*sinMo;
	A3 = 0.37*sinMo;
	Mprimem = Mm + Ev -Ae - A3;
	Ec = 6.2886*Math.sin(Mprimem*d2r);
	A4 = 0.214*Math.sin(2*Mprimem*d2r);
	lprime = l + Ev + Ec -Ae + A4;
	V = 0.6583*Math.sin(2*(lprime-sun.lon)*d2r);
	lprimeprime = lprime + V;
	Nprime = N - 0.16*sinMo;
	lppNp = (lprimeprime-Nprime)*d2r;
	sinlppNp = Math.sin(lppNp);
	y = sinlppNp*Math.cos(i*d2r);
	x = Math.cos(lppNp);
	lm = Math.atan2(y,x)/d2r + Nprime;
	Bm = Math.asin(sinlppNp*Math.sin(i*d2r))/d2r;
	if(lm > 360) lm -= 360;
	return { moon: {lon:lm,lat:Bm}, sun:sun };
}
// Uses algorithm defined in Practical Astronomy (4th ed) by Peter Duffet-Smith and Jonathan Zwart
VirtualSky.prototype.sunPos = function(JD){
	var D,eg,wg,e,N,Mo,v,lon,lat;
	D = (JD-2455196.5);	// Number of days since the epoch of 2010 January 0.0
	// Calculated for epoch 2010.0. If T is the number of Julian centuries since 1900 January 0.5 = (JD-2415020.0)/36525
	eg = 279.557208;	// mean ecliptic longitude in degrees = (279.6966778 + 36000.76892*T + 0.0003025*T*T)%360;
	wg = 283.112438;	// longitude of the Sun at perigee in degrees = 281.2208444 + 1.719175*T + 0.000452778*T*T;
	e = 0.016705;	// eccentricity of the Sun-Earth orbit in degrees = 0.01675104 - 0.0000418*T - 0.000000126*T*T;
	N = ((360/365.242191)*D)%360;
	if(N < 0) N += 360;
	Mo = (N + eg - wg)%360	// mean anomaly in degrees
	if(Mo < 0) Mo += 360;
	v = Mo + (360/Math.PI)*e*Math.sin(Mo*Math.PI/180);
	lon = v + wg;
	if(lon > 360) lon -= 360;
	lat = 0;
	return {lat:lat,lon:lon,Mo:Mo,D:D,N:N}
}
// Input is Julian Date
// Uses method defined in Practical Astronomy (4th ed) by Peter Duffet-Smith and Jonathan Zwart
VirtualSky.prototype.meanObliquity = function(JD){
	if(!JD) JD = this.times.JD;
	var T,T2,T3;
	T = (JD-2451545.0)/36525	// centuries since 2451545.0 (2000 January 1.5)
	T2 = T*T;
	T3 = T2*T;
	return (23.4392917 - 0.0130041667*T - 0.00000016667*T2 + 0.0000005027778*T3)*this.d2r;
}
// Take input in radians, decimal Sidereal Time and decimal latitude
// Uses method defined in Practical Astronomy (4th ed) by Peter Duffet-Smith and Jonathan Zwart
VirtualSky.prototype.ecliptic2azel = function(l,b,LST,lat){
	if(!LST){
		this.times = this.astronomicalTimes();
		LST = this.times.LST;
	}
	if(!lat) lat = this.latitude
	var sl,cl,sb,cb,v,e,ce,se,Cprime,s,ST,cST,sST,B,r,sphi,cphi,A,w,theta,psi;
	sl = Math.sin(l);
	cl = Math.cos(l);
	sb = Math.sin(b);
	cb = Math.cos(b);
	v = [cl*cb,sl*cb,sb];
	e = this.meanObliquity();
	ce = Math.cos(e);
	se = Math.sin(e);
	Cprime = [[1.0,0.0,0.0],[0.0,ce,-se],[0.0,se,ce]];
	s = this.vectorMultiply(Cprime,v);
	ST = LST*15*this.d2r;
	cST = Math.cos(ST);
	sST = Math.sin(ST);
	B = [[cST,sST,0],[sST,-cST,0],[0,0,1]];
	r = this.vectorMultiply(B,s);
	sphi = Math.sin(lat);
	cphi = Math.cos(lat);
	A = [[-sphi,0,cphi],[0,-1,0],[cphi,0,sphi]];
	w = this.vectorMultiply(A,r);
	theta = Math.atan2(w[1],w[0]);
	psi = Math.asin(w[2]);
	return {az:theta,el:psi};
}
// Convert from ecliptic l,b -> RA,Dec
// Inputs: l (rad), b (rad), Julian date
VirtualSky.prototype.ecliptic2radec = function(l,b,JD){
	var e = this.meanObliquity();
	var sl = Math.sin(l);
	var cl = Math.cos(l);
	var sb = Math.sin(b);
	var cb = Math.cos(b);
	var tb = Math.tan(b);
	var se = Math.sin(e);
	var ce = Math.cos(e);
	ra = Math.atan2((sl*ce - tb*se),(cl));
	dec = Math.asin(sb*ce+cb*se*sl);
	// Make sure RA is positive
	if(ra < 0) ra += Math.PI+Math.PI;
	return { ra:ra, dec:dec };
}
// Convert Ecliptic coordinates to x,y position
// Inputs: l (rad), b (rad), local sidereal time
// Returns [x, y (,elevation)]
VirtualSky.prototype.ecliptic2xy = function(l,b,LST){
	if(typeof LST=="undefined") LST = this.times.LST;
	if(typeof this.projection.ecliptic2xy==="function") return this.projection.ecliptic2xy.call(this,l,b,LST);
	else{
		if(this.fullsky){
			var pos = this.ecliptic2radec(l,b);
			return this.radec2xy(pos.ra,pos.dec);
		}else{
			var pos = this.ecliptic2azel(l,b,LST);
			var el = pos.el*this.r2d;
			pos = this.azel2xy(pos.az-(this.az_off*this.d2r),pos.el,this.wide,this.tall);
			pos.el = el;
			return pos;
		}
	}
	return 0;
}

// Convert RA,Dec -> X,Y
// Inputs: RA (rad), Dec (rad)
// Returns [x, y (,elevation)]
VirtualSky.prototype.radec2xy = function(ra,dec){
	if(typeof this.projection.radec2xy==="function") return this.projection.radec2xy.call(this,ra,dec);
	else{
		var coords = this.coord2horizon(ra, dec);
		// Only return coordinates above the horizon
		if(coords[0] > 0){
			var pos = this.azel2xy(coords[1]-(this.az_off*this.d2r),coords[0],this.wide,this.tall);
			return {x:pos.x,y:pos.y,az:coords[1]*this.r2d,el:coords[0]*this.r2d};
		}
	}
	return 0;
}

// Dummy function - overwritten in selectProjection
// Convert AZ,EL -> X,Y
// Inputs: az (degrees), el (degrees), width (px), height (px)
// Output: { x: x, y: y }
VirtualSky.prototype.azel2xy = function(az,el,w,h){ return {x:-1,y:-1}; }

// Dummy functions - overwritten in selectProjection
// Convert AZ,EL -> RA,Dec
// Inputs: az (rad), el (rad)
// Output: { ra: ra (deg), dec: dec (deg) }
VirtualSky.prototype.azel2radec = function(az,el){ return { ra: 0, dec: 0 }; }

// Convert Galactic -> x,y
// Inputs: longitude (rad), latitude (rad)
VirtualSky.prototype.gal2xy = function(l,b){
	var pos = this.gal2radec(l,b);
	return this.radec2xy(pos[0],pos[1]);
}

// Convert Galactic -> J2000
// Inputs: longitude (rad), latitude (rad)
VirtualSky.prototype.gal2radec = function(l,b){
	// Using SLALIB values
	return this.Transform([l,b], [-0.054875539726, 0.494109453312, -0.867666135858, -0.873437108010, -0.444829589425, -0.198076386122, -0.483834985808, 0.746982251810, 0.455983795705],false);
}

// Input is a two element position (degrees) and rotation matrix
// Output is a two element position (degrees)
VirtualSky.prototype.Transform = function(p, rot, indeg){
	if(indeg){
		p[0] *= this.d2r;
		p[1] *= this.d2r;
	}
	var cp1 = Math.cos(p[1]);
	var m = [Math.cos(p[0])*cp1, Math.sin(p[0])*cp1, Math.sin(p[1])];
	var s = [m[0]*rot[0] + m[1]*rot[1] + m[2]*rot[2], m[0]*rot[3] + m[1]*rot[4] + m[2]*rot[5], m[0]*rot[6] + m[1]*rot[7] + m[2]*rot[8] ];
	var r = Math.sqrt(s[0]*s[0] + s[1]*s[1] + s[2]*s[2]); 
	var b = Math.asin(s[2]/r); // Declination in range -90 -> +90
	var cb = Math.cos(b);
	var a = Math.atan2(((s[1]/r)/cb),((s[0]/r)/cb));
	if (a < 0) a += Math.PI*2;
	if(indeg) return [a*this.r2d,b*this.r2d];
	else return [a,b];
}
// Convert from B1875 to J2000
// Using B = 1900.0 + (JD − 2415020.31352) / 365.242198781 and p73 Practical Astronomy With A Calculator
VirtualSky.prototype.fk1tofk5 = function(a,b){
	// Convert from B1875 -> J2000
	return this.Transform([a,b], [0.9995358730015703, -0.02793693620138929, -0.012147682028606801, 0.027936935758478665, 0.9996096732234282, -0.00016976035344812515, 0.012147683047201562, -0.00016968744936278707, 0.9999261997781408]);
}
VirtualSky.prototype.vectorMultiply = function(A,B){
	if(B.length > 0){
		// 2D or 1D
		if(B[0].length > 0) return [[(A[0][0]*B[0][0]+A[0][1]*B[1][0]+A[0][2]*B[2][0]),(A[0][0]*B[0][1]+A[0][1]*B[1][1]+A[0][2]*B[2][1]),(A[0][0]*B[0][2]+A[0][1]*B[1][2]+A[0][2]*B[2][2])],[(A[1][0]*B[0][0]+A[1][1]*B[1][0]+A[1][2]*B[2][0]),(A[1][0]*B[0][1]+A[1][1]*B[1][1]+A[1][2]*B[2][1]),(A[1][0]*B[0][2]+A[1][1]*B[1][2]+A[1][2]*B[2][2])],[(A[2][0]*B[0][0]+A[2][1]*B[1][0]+A[2][2]*B[2][0]),(A[2][0]*B[0][1]+A[2][1]*B[1][1]+A[2][2]*B[2][1]),(A[2][0]*B[0][2]+A[2][1]*B[1][2]+A[2][2]*B[2][2])]];
		else return [(A[0][0]*B[0] + A[0][1]*B[1] + A[0][2]*B[2]),(A[1][0]*B[0] + A[1][1]*B[1] + A[1][2]*B[2]),(A[2][0]*B[0] + A[2][1]*B[1] + A[2][2]*B[2])];
	}
}
VirtualSky.prototype.setFont = function(){ this.ctx.font = this.fontsize()+"px "+this.canvas.css('font-family'); }
VirtualSky.prototype.fontsize = function(){
	if(this.fntsze) return parseInt(this.fntsze);
	var m = Math.min(this.wide,this.tall);
	return (m < 600) ? ((m < 500) ? ((m < 350) ? ((m < 300) ? ((m < 250) ? 9 : 10) : 11) : 12) : 14) : parseInt(this.container.css('font-size'));
}
VirtualSky.prototype.positionCredit = function(){
	this.container.find('.'+this.id+'_credit').css({position:'absolute',top:parseFloat(this.tall)-5-this.fontsize(),left:5});
}
VirtualSky.prototype.updateSkyGradient = function(){
	var s = null;
	if(this.ctx && this.hasGradient()){
		if(this.projection.polartype){
			if(typeof this.ctx.createRadialGradient==="function"){
				s = this.ctx.createRadialGradient(this.wide/2,this.tall/2,0,this.wide/2,this.tall/2,this.tall/2);
				s.addColorStop(0, 'rgba(0,0,0,1)');
				s.addColorStop(0.7, 'rgba(0,0,0,0.2)');
				s.addColorStop(1, 'rgba(0,50,80,0.3)');
			}
		}else{
			s = this.ctx.createLinearGradient(0,0,0,this.tall);
			s.addColorStop(0.0, 'rgba(0,30,50,0.1)');
			s.addColorStop(0.7, 'rgba(0,30,50,0.35)');
			s.addColorStop(1, 'rgba(0,50,80,0.6)');
		}
	}
	this.skygrad = s;
	return this;
}
VirtualSky.prototype.draw = function(proj){

	// Don't bother drawing anything if there is no physical area to draw on
	if(this.wide <= 0 || this.tall <= 0) return this;
	if(!(this.c && this.c.getContext)) return this;

	if(typeof proj!="undefined") this.selectProjection(proj);
	var white = this.col.white;
	var black = this.col.black;

	// Shorthands
	var c = this.ctx;
	var d = this.container;

	c.moveTo(0,0);
	c.clearRect(0,0,this.wide,this.tall);
	c.fillStyle = (this.polartype || this.fullsky) ? this.background : ((this.negative) ? white : black);
	c.fillRect(0,0,this.wide,this.tall);
	c.fill();

	if(this.polartype){
		c.moveTo(this.wide/2,this.tall/2);
		c.closePath();
		c.beginPath();
		c.arc(this.wide/2,this.tall/2,-0.5+this.tall/2,0,Math.PI*2,true);
		c.closePath();
		if(!this.transparent){
			c.fillStyle = (this.hasGradient()) ? "rgba(0,15,30, 1)" : ((this.negative) ? white : black);
			c.fill();
		}
		c.lineWidth = 0.5;
		c.strokeStyle = black;
		c.stroke();
	}else if(typeof this.projection.draw==="function") this.projection.draw.call(this);

	this.now = this.clock;

	if(this.hasGradient()){
		if(typeof this.skygrad == "undefined") this.updateSkyGradient();
		if(typeof this.skygrad!=="undefined"){
			c.beginPath();
			c.fillStyle = this.skygrad;
			// draw shapes
			if(this.projection.polartype){ c.arc(this.wide/2,this.tall/2,this.tall/2,0,2*Math.PI,false); c.fill(); }
			else c.fillRect(0,0,this.wide,this.tall);
			c.closePath();
		}
	}
	
	this.drawGridlines("az").drawGridlines("eq").drawGridlines("gal").drawGalaxy().drawConstellationLines().drawConstellationBoundaries().drawStars().drawEcliptic().drawMeridian().drawPlanets().drawMeteorShowers().drawCardinalPoints();

	for(var i = 0; i < this.pointers.length ; i++) this.highlight(i);

	var txtcolour = (this.color!="") ? (this.color) : this.col.txt;
	var fontsize = this.fontsize();

	c.fillStyle = txtcolour;
	c.lineWidth = 1.5;
	this.setFont();

	// Time line
	if(this.showdate){
		var clockstring = this.clock.toDateString()+' '+this.clock.toLocaleTimeString();
		var metric_clock = this.drawText(clockstring,5,5+fontsize);
	}

	// Position line
	if(this.showposition){
		var positionstring = Math.abs(this.latitude*this.r2d).toFixed(2) + ((this.latitude>0) ? this.getPhrase('N') : this.getPhrase('S')) + ', ' + Math.abs(this.longitude*this.r2d).toFixed(2) + ((this.longitude>0) ? this.getPhrase('E') : this.getPhrase('W'));
		var metric_pos = this.drawText(positionstring,5,5+fontsize+fontsize);
	}

	// Credit line
	if(this.credit){
		var credit = this.getPhrase('power');
		var metric_credit = this.drawText(credit,5,this.tall-5);
		// Float a transparent link on top of the credit text
		if(d.find('.'+this.id+'_credit').length == 0) d.append('<div class="'+this.id+'_credit"><a href="http://lcogt.net/virtualsky" target="_parent" title="Created by the Las Cumbres Observatory Global Telescope">'+this.getPhrase('powered')+'</a></div>');
		d.find('.'+this.id+'_credit').css({padding:0,zIndex:20,display:'block',overflow:'hidden',backgroundColor:'transparent'});
		d.find('.'+this.id+'_credit a').css({display:'block',width:Math.ceil(metric_credit)+'px',height:fontsize+'px','font-size':fontsize+'px'});
		this.positionCredit();
	}
	if(this.showhelp){
		var helpstr = '?';
		if(d.find('.'+this.id+'_help').length == 0) d.append('<div class="'+this.id+'_help"><a href="#">'+helpstr+'</a></div>').find('.'+this.id+'_help').css({position:'absolute',padding:5,zIndex:20,display:'block',overflow:'hidden',backgroundColor:'transparent',right:0,top:0,'font-size':fontsize}).find('a').css({'text-decoration':'none',color:txtcolour}).on('click',{me:this},function(e){ e.data.me.toggleHelp(); });
		d.find('.'+this.id+'_help').css({'font-size':fontsize}).find('a').css({color:txtcolour});
	}
	if(this.container.find('.'+this.id+'_clock').length == 0) this.container.append('<div class="'+this.id+'_clock" title="'+this.getPhrase('datechange')+'">'+clockstring+'</div>');
	var off = $('#'+this.idinner).position();
	this.container.find('.'+this.id+'_clock').css({position:'absolute',padding:0,width:metric_clock,cursor:'pointer',top:off.top+5,left:off.left+5,zIndex:20,display:'block',overflow:'hidden',backgroundColor:'transparent',fontSize:fontsize+'px',color:'transparent'}).bind('click',{sky:this},function(e){
		var s = e.data.sky;
		var id = s.id;
		var hid = '#'+id;
		var v = "virtualsky";
		if($(hid+'_calendar').length == 0){
			var off = $(hid).offset();
			var w = 280;
			var h = 50;
			if(s.wide < w) w = s.wide;
			s.container.append('<div id="'+id+'_calendar" class="'+v+'form"><div style="" id="'+id+'_calendar_close" class="'+v+'_dismiss" title="close">&times;</div><div style="text-align:center;margin:2px;">'+e.data.sky.getPhrase('date')+'</div><div style="text-align:center;"><input type="text" id="'+id+'_year" style="width:3.2em;" value="" /><div class="divider">/</div><input type="text" id="'+id+'_month" style="width:1.6em;" value="" /><div class="divider">/</div><input type="text" id="'+id+'_day" style="width:1.6em;" value="" /><div class="divider">&nbsp;</div><input type="text" id="'+id+'_hours" style="width:1.6em;" value="" /><div class="divider">:</div><input type="text" id="'+id+'_mins" style="width:1.6em;" value="" /></div></div>');
			$(hid+'_calendar').css({width:w});
			$(hid+'_calendar input').bind('change',{sky:s},function(e){
				e.data.sky.clock = new Date(parseInt($('#'+id+'_year').val()), parseInt($('#'+id+'_month').val()-1), parseInt($('#'+id+'_day').val()), parseInt($('#'+id+'_hours').val()), parseInt($('#'+id+'_mins').val()), 0,0);
				e.data.sky.advanceTime(0,0);
			});
		}
		s.lightbox($(hid+'_calendar'));
		$(hid+'_year').val(s.clock.getFullYear());
		$(hid+'_month').val(s.clock.getMonth()+1);
		$(hid+'_day').val(s.clock.getDate());
		$(hid+'_hours').val(s.clock.getHours());
		$(hid+'_mins').val(s.clock.getMinutes());
	});

	if($('.'+this.id+'_position').length == 0) this.container.append('<div class="'+this.id+'_position" title="'+this.getPhrase('positionchange')+'">'+positionstring+'</div>');
	var off = $('#'+this.idinner).position();
	$('.'+this.id+'_position').css({position:'absolute',padding:0,width:metric_pos,cursor:'pointer',top:off.top+5+fontsize,left:off.left+5,zIndex:20,fontSize:fontsize+'px',display:'block',overflow:'hidden',backgroundColor:'transparent',fontSize:fontsize+'px',color:'transparent'}).bind('click',{sky:this},function(e){
		var s = e.data.sky;
		var id = s.id;
		var hid = '#'+id;
		var v = "virtualsky";
		if($(hid+'_geo').length == 0){
			var w = 310;
			var narrow = '';
			if(s.wide < w){
				narrow = '<br style="clear:both;margin-top:20px;" />';
				w = w/2;
			}
			s.container.append('<div id="'+id+'_geo" class="'+v+'form"><div id="'+id+'_geo_close" class="'+v+'_dismiss" title="close">&times;</div><div style="text-align:center;margin:2px;">'+s.getPhrase('position')+'</div><div style="text-align:center;"><input type="text" id="'+id+'_lat" value="" style="padding-right:10px!important;"><div class="divider">'+s.getPhrase('N')+'</div>'+narrow+'<input type="text" id="'+id+'_long" value="" /><div class="divider">'+s.getPhrase('E')+'</div></div></div>');
			$(hid+'_geo').css({width:w,'align':'center'})
			$(hid+'_geo input').css({width:'6em'});
			$(hid+'_geo_close').bind('click',{sky:s},function(e){
				e.data.sky.setGeo($(hid+'_lat').val()+','+$(hid+'_long').val());
				e.data.sky.draw();
			});
		}
		s.lightbox($(hid+'_geo'));
		$(hid+'_lat').val(s.latitude*s.r2d)
		$(hid+'_long').val(s.longitude*s.r2d)
		if(typeof s.callback.geo=="function") s.callback.geo.call(s);
	});

	return this;
} 

VirtualSky.prototype.lightbox = function(lb){
	if(!lb.length) return this;
	function columize(){
		// Make each li as wide as it needs to be so we can calculate the widest
		lb.find('li').css({'display':'inline-block','margin-left':'0px','width':'auto'});
		// Remove positioning so we can work out sizes
		lb.find('ul').css({'width':'auto'});
		lb.css({'position':'relative'});
		w = lb.outerWidth();
		var bar = 24;
		var li = lb.find('ul li');
		var mx = 1;
		for(var i = 0 ; i < li.length; i++){
			if(li.eq(i).width() > mx) mx = li.eq(i).width();
		}
		// If the list items are wider than the space we have we turn them
		// into block items otherwise set their widths to the maximum width.
		var n = Math.floor(w/(mx+bar));
		if(n > 1){
			if(n > 3) n = 3;
			lb.find('li').css({'width':(mx)+'px','margin-left':Math.floor(bar/2)+'px'});
			lb.find('li:nth-child('+n+'n+1)').css({'margin-left':'0px'});
		}else{
			lb.find('li').css({'display':'block','width':'auto'});
		}
		lb.find('ul').css({'width':'100%'}).parent().css({'width':Math.min(w-bar,(mx+bar/2)*n + bar)+'px'});
		lb.css({'z-index': 100,'position': 'absolute'});
		lb.css({'left':Math.floor((this.wide-lb.outerWidth())/2)+'px',top:((this.tall-lb.height())/2)+'px'});
	}
	columize.call(this);
	var n = "virtualsky_bg";
	if(this.container.find('.'+n).length == 0) this.container.append('<div class="'+n+'" style="position:absolute;z-index: 99;left:0px;top: 0px;right: 0px;bottom: 0px;background-color: rgba(0,0,0,0.7);"></div>')
	var bg = this.container.find('.'+n).show();
	lb.css({left:((this.wide-lb.outerWidth())/2)+'px',top:((this.tall-lb.outerHeight())/2)+'px'}).show();
	this.container.find('.virtualsky_dismiss').click({lb:lb,bg:bg},function(e){ lb.remove(); bg.remove(); });
	bg.click({lb:lb,bg:bg},function(e){ lb.hide(); bg.hide(); });
	// Update lightbox when the screen is resized
	$(window).resize({vs:this,fn:columize},function(e){ e.data.fn.call(e.data.vs); });
	return this;
}

VirtualSky.prototype.drawStars = function(){

	if(!this.showstars && !this.showstarlabels) return this;
	var mag,i,j,p,d,atmos,fovf;
	var c = this.ctx;
	c.beginPath();
	c.fillStyle = this.col.stars;
	this.az_off = (this.az_off+360)%360;
	atmos = this.hasAtmos();
	fovf = Math.sqrt(30/this.fov);
	var f = 1;
	if(this.negative) f *= 1.4;
	if(typeof this.scalestars==="number" && this.scalestars!=1) f *= this.scalestars;
	if(this.projection.id == "gnomic") f *= fovf;

	for(i = 0; i < this.stars.length; i++){
		if(this.stars[i][1] < this.magnitude){
			mag = this.stars[i][1];
			p = this.radec2xy(this.stars[i][2], this.stars[i][3]);
			if(this.isVisible(p.el) && !isNaN(p.x) && !this.isPointBad(p)){
				d = 0.8*Math.max(3-mag/2.1, 0.5);
				// Modify the 'size' of the star by how close to the horizon it is
				// i.e. smaller when closer to the horizon
				if(atmos) d *= Math.exp(-(90-p.el)*0.01);
				d *= f;
				c.moveTo(p.x+d,p.y);
				if(this.showstars) c.arc(p.x,p.y,d,0,Math.PI*2,true);
				if(this.showstarlabels && this.starnames[this.stars[i][0]]) this.drawLabel(p.x,p.y,d,"",this.starnames[this.stars[i][0]]);
			}
		}	
	}
	c.fill();

	return this;
}

VirtualSky.prototype.hasAtmos = function(){
	return (typeof this.projection.atmos==="boolean") ? (this.gradient ? this.projection.atmos : this.gradient) : this.gradient;
}

VirtualSky.prototype.hasGradient = function(){
	return (this.hasAtmos() && !this.fullsky && !this.negative) ? true : false;
}

// When provided with an array of Julian dates, ra, dec, and magnitude this will interpolate to the nearest
// data = [jd_1, ra_1, dec_1, mag_1, jd_2, ra_2, dec_2, mag_2....]
VirtualSky.prototype.interpolate = function(jd,data){
	var mindt = jd;	// Arbitrary starting value in days
	var mini = 0;	// index where we find the minimum
	for(var i = 0 ; i < data.length ; i+=4){
		// Find the nearest point to now
		var dt = (jd-data[i]);
		if(Math.abs(dt) < Math.abs(mindt)){ mindt = dt; mini = i; }
	}
	var dra,ddec,dmag,pos_2,pos_1,fract;
	if(mindt >= 0){
		pos_2 = mini+1+4;
		pos_1 = mini+1;
		fract = mindt/Math.abs(data[pos_2-1]-data[pos_1-1]);
	}else{
		pos_2 = mini+1;
		pos_1 = mini+1-4;
		fract = (1+(mindt)/Math.abs(data[pos_2-1]-data[pos_1-1]));
	}
	// We don't want to attempt to find positions beyond the edges of the array
	if(pos_2 > data.length || pos_1 < 0){
		dra = data[mini+1];
		ddec = data[mini+2];
		dmag = data[mini+3];
	}else{
		dra = (Math.abs(data[pos_2]-data[pos_1]) > 180) ? (data[pos_1]+(data[pos_2]+360-data[pos_1])*fract)%360 : (data[pos_1]+(data[pos_2]-data[pos_1])*fract)%360;
		ddec = data[pos_1+1]+(data[pos_2+1]-data[pos_1+1])*fract;
		dmag = data[pos_1+2]+(data[pos_2+2]-data[pos_1+2])*fract;
	}
	return { ra: dra, dec:ddec, mag:dmag}
}
VirtualSky.prototype.drawPlanets = function(){

	if(!this.showplanets && !this.showplanetlabels && !this.showorbits) return this;
	if(!this.planets || this.planets.length <= 0) return this;
	var ra,dec,mag,pos,p;
	var c = this.ctx;
	var oldjd = this.jd;
	this.jd = this.times.JD;

	var colour = this.col.grey;
	var maxl = this.maxLine();
	for(p = 0 ; p < this.planets.length ; p++){
		// We'll allow 2 formats here:
		// [Planet name,colour,ra,dec,mag] or [Planet name,colour,[jd_1, ra_1, dec_1, mag_1, jd_2, ra_2, dec_2, mag_2....]]
		if(!this.planets[p]) continue;
		if(this.planets[p].length == 3){
			// Find nearest JD
			if(this.planets[p][2].length%4 == 0){
				if(this.jd > this.planets[p][2][0] && this.jd < this.planets[p][2][(this.planets[p][2].length-4)]){
					var interp = this.interpolate(this.jd,this.planets[p][2]);
					ra = interp.ra;
					dec = interp.dec;
					mag = interp.mag;
				}else{
					continue;	// We don't have data for this planet so skip to the next
				}
			}
		}else{
			ra = this.planets[p][2];
			dec = this.planets[p][3];
		}
		pos = this.radec2xy(ra*this.d2r,dec*this.d2r);

		if(!this.negative) colour = this.planets[p][1];
		if(typeof colour==="string") c.strokeStyle = colour;

		if((this.showplanets || this.showplanetlabels) && this.isVisible(pos.el) && mag < this.magnitude && !this.isPointBad(pos)){
			var d = 0;
			if(typeof mag!="undefined"){
				d = 0.8*Math.max(3-mag/2, 0.5);
				if(this.hasAtmos()) d *= Math.exp(-((90-pos.el)*this.d2r)*0.6);
			}
			if(d < 1.5) d = 1.5;
			this.drawPlanet(pos.x,pos.y,d,colour,this.planets[p][0]);
		}

		if(this.showorbits && mag < this.magnitude){
			c.beginPath();
			c.lineWidth = 0.5
			this.setFont();
			c.lineWidth = 1;
			var previous = {x:-1,y:-1,el:-1};
			for(i = 0 ; i < this.planets[p][2].length-4 ; i+=4){
				var point = this.radec2xy(this.planets[p][2][i+1]*this.d2r, this.planets[p][2][i+2]*this.d2r);
				if(previous.x > 0 && previous.y > 0 && this.isVisible(point.el)){
					c.moveTo(previous.x,previous.y);
					// Basic error checking: points behind us often have very long lines so we'll zap them
					if(Math.abs(point.x-previous.x) < maxl){
						c.lineTo(point.x,point.y);
					}
				}
				previous = point;
			}
			c.stroke();
		}
	}
	
	// Sun & Moon
	if(this.showplanets || this.showplanetlabels){
		// Only recalculate the Moon's ecliptic position if the time has changed
		if(oldjd != this.jd){
			var p = this.moonPos(this.jd);
			this.moon = p.moon;
			this.sun = p.sun;
		}
		var pos;
		// Draw the Sun
		pos = this.ecliptic2xy(this.sun.lon*this.d2r,this.sun.lat*this.d2r,this.times.LST);
		if(this.isVisible(pos.el) && !this.isPointBad(pos)) this.drawPlanet(pos.x,pos.y,5,this.col.sun,"sun");
		// Draw Moon last as it is closest
		pos = this.ecliptic2xy(this.moon.lon*this.d2r,this.moon.lat*this.d2r,this.times.LST);
		if(this.isVisible(pos.el) && !this.isPointBad(pos)) this.drawPlanet(pos.x,pos.y,5,this.col.moon,"moon");

	}
	return this;
}
VirtualSky.prototype.drawPlanet = function(x,y,d,colour,label){
	var c = this.ctx;
	c.beginPath();
	c.fillStyle = colour;
	c.strokeStyle = colour;
	c.moveTo(x+d,y+d);
	if(this.showplanets) c.arc(x,y,d,0,Math.PI*2,true);
	label = this.getPhrase('planets',label);
	if(this.showplanetlabels) this.drawLabel(x,y,d,colour,label);
	c.fill();
	return this;
}
VirtualSky.prototype.drawText = function(txt,x,y){
	this.ctx.beginPath(); 
	this.ctx.fillText(txt,x,y);
	return this.ctx.measureText(txt).width;
}
// Helper function. You'll need to wrap it with a this.ctx.beginPath() and a this.ctx.fill();
VirtualSky.prototype.drawLabel = function(x,y,d,colour,label){
	var c = this.ctx;
	if(colour.length > 0) c.fillStyle = colour;
	c.lineWidth = 1.5;
	var xoff = d;
	if((this.polartype) && c.measureText) xoff = -c.measureText(label).width-3
	if((this.polartype) && x < this.wide/2) xoff = d;
	c.fillText(label,x+xoff,y-(d+2))
	return this;
}
VirtualSky.prototype.drawConstellationLines = function(colour){
	if(!(this.constellation.lines || this.constellation.labels)) return this;
	if(!colour) colour = this.col.constellation;
	var x = this.ctx;
	x.beginPath();
	x.strokeStyle = colour;
	x.fillStyle = colour;
	x.lineWidth = 0.75
	var fontsize = this.fontsize();
	this.setFont();
	if(typeof this.lines!=="object") return this;
	var pos,posa,posb,a,b,idx,l;
	var maxl = this.maxLine();
	for(var c = 0; c < this.lines.length; c++){
		if(this.constellation.lines){
			for(l = 3; l < this.lines[c].length; l+=2){
				a = -1;
				b = -1;
				idx1 = ''+this.lines[c][l]+'';
				idx2 = ''+this.lines[c][l+1]+'';
				if(!this.hipparcos[idx1]){
					for(s = 0; s < this.stars.length; s++){
						if(this.stars[s][0] == this.lines[c][l]){
							this.hipparcos[idx1] = s;
							break;
						}
					}
				}
				if(!this.hipparcos[idx2]){
					for(s = 0; s < this.stars.length; s++){
						if(this.stars[s][0] == this.lines[c][l+1]){
							this.hipparcos[idx2] = s;
							break;
						}
					}
				}
				a = this.hipparcos[idx1];
				b = this.hipparcos[idx2];
				if(a >= 0 && b >= 0 && a < this.stars.length && b < this.stars.length){
					posa = this.radec2xy(this.stars[a][2], this.stars[a][3]);
					posb = this.radec2xy(this.stars[b][2], this.stars[b][3]);
					if(this.isVisible(posa.el) && this.isVisible(posb.el)){
						if(!this.isPointBad(posa) && !this.isPointBad(posb)){
							// Basic error checking: constellations behind us often have very long lines so we'll zap them
							if(Math.abs(posa.x-posb.x) < maxl && Math.abs(posa.y-posb.y) < maxl){
								x.moveTo(posa.x,posa.y);
								x.lineTo(posb.x,posb.y);
							}
						}
					}
				}
			}
		}

		if(this.constellation.labels){
			pos = this.radec2xy(this.lines[c][1]*this.d2r,this.lines[c][2]*this.d2r);
			if(this.isVisible(pos.el)){
				label = this.getPhrase('constellations',c);
				xoff = (x.measureText) ? -x.measureText(label).width/2 : 0;
				x.fillText(label,pos.x+xoff,pos.y-fontsize/2)
				x.fill();
			}
		}
	}
	x.stroke();
	return this;
}

// Draw the boundaries of constellations
// Input: colour (e.g. "rgb(255,255,0)")
// We should have all the boundary points stored in this.boundaries. As many of the constellations
// will share boundaries we don't want to bother drawing lines that we've already done so we will 
// keep a record of the lines we've drawn as we go. As some segments may be large on the sky we will
// interpolate a few points between so that boundaries follow the curvature of the projection better.
// As the boundaries are in FK1 we will calculate the J2000 positions once and keep them cached as
// this speeds up the re-drawing as the user moves the sky. We assume that the user's session << time
// between epochs.
VirtualSky.prototype.drawConstellationBoundaries = function(colour){
	if(!this.constellation.boundaries) return this;
	if(!colour) colour = this.col.constellationboundary;
	this.ctx.beginPath();
	this.ctx.strokeStyle = colour;
	this.ctx.fillStyle = colour;
	this.ctx.lineWidth = 0.75;
	if(typeof this.boundaries!=="object") return this;
	var posa, posb, a, b, l, c, d, atob,btoa, move, i, j, ra,dc,dra,ddc,b3;
	// Keys defining a line in both directions
	atob = "";
	btoa = "";
	var n = 5;
	var maxl = this.maxLine(5);
	// Create a holder for the constellation boundary points i.e. a cache of position calculations
	if(!this.constellation.bpts) this.constellation.bpts = new Array(this.boundaries.length);
	// We'll record which boundary lines we've already processed
	var cbdone = [];
	if(this.constellation.boundaries){
		for(c = 0; c < this.boundaries.length; c++){
			if(typeof this.boundaries!=="string" && c < this.boundaries.length){

				if(this.constellation.bpts[c]){
					// Use the old array
					var points = this.constellation.bpts[c];
				}else{
					// Create a new array of points
					var points = [];
					for(l = 1; l < this.boundaries[c].length; l+=2){
						b = [this.boundaries[c][l],this.boundaries[c][l+1]];
						if(a){
							atob = a[0]+','+a[1]+'-'+b[0]+','+b[1];
							btoa = b[0]+','+b[1]+'-'+a[0]+','+a[1];
						}
						if(l > 1){
							move = (cbdone[atob] || cbdone[btoa]);
							ra = (b[0]-a[0])%360;
							if(ra > 180) ra = ra-360;
							if(ra < -180) ra = ra+360;
							dc = (b[1]-a[1]);

							// If we've already done this line we'll only calculate 
							// two points on the line otherwise we'll do 5
							n = (move) ? 5 : 2;
							if(ra/2 > n) n = parseInt(ra);
							if(dc/2 > n) n = parseInt(dc);
							
							dra = ra/n;
							ddc = dc/n;
							
							for(var i = 1; i <= n; i++){
								ra = a[0]+(i*dra);
								if(ra < 0) ra += 360;
								dc = a[1]+(i*ddc);
								// Convert to J2000
								d = this.fk1tofk5(ra*this.d2r,dc*this.d2r);
								points.push([d[0],d[1],move]);
							}
						}
						// Mark this line as drawn
						cbdone[atob] = true;
						cbdone[btoa] = true;
						a = b;
					}
					this.constellation.bpts[c] = points;
				}
				posa = null;
				// Now loop over joining the points
				for(i = 0; i <= points.length; i++){
					j = (i == points.length) ? 0 : i;
					posb = this.radec2xy(points[j][0],points[j][1]);
					if(posa && this.isVisible(posa.el) && this.isVisible(posb.el) && points[j][2]){
						if(!this.isPointBad(posa) && !this.isPointBad(posb)){
							// Basic error checking: constellations behind us often have very long lines so we'll zap them
							if(Math.abs(posa.x-posb.x) < maxl && Math.abs(posa.y-posb.y) < maxl){
								this.ctx.moveTo(posa.x,posa.y);
								this.ctx.lineTo(posb.x,posb.y);
							}
						}
					}
					posa = posb;
				}
			}
		}
		cbdone = [];
	}
	this.ctx.stroke();
	return this;
}
VirtualSky.prototype.drawGalaxy = function(colour){
	if(!this.galaxy || !this.showgalaxy) return this;
	if(!colour) colour = this.col.galaxy;
	this.ctx.beginPath();
	this.ctx.strokeStyle = colour;
	this.ctx.fillStyle = colour;
	this.ctx.lineWidth = 1;
	if(typeof this.boundaries!=="object") return this;
	var p, pa, pb, i, c, old, maxl;
	maxl = this.maxLine(5);

	for(c = 0; c < this.galaxy.length; c++){

		// We will convert all the galaxy outline coordinates to radians
		if(!this.galaxyprocessed) for(i = 1; i < this.galaxy[c].length; i++) this.galaxy[c][i] *= this.d2r;

		// Get a copy of the current shape
		p = this.galaxy[c].slice(0);

		// Get the colour (first element)
		p.shift();
		// Set the initial point to null
		pa = null;

		// Now loop over joining the points
		for(i = 0; i < p.length; i+=2){
			pb = this.radec2xy(p[i], p[i+1]);
			if(pa){
				// Basic error checking: if the line is very long we need to normalize to other side of sky
				if(Math.abs(pa.x-pb.x) < maxl && Math.abs(pa.y-pb.y) < maxl){
					this.ctx.moveTo(pa.x,pa.y);
					this.ctx.lineTo(pb.x,pb.y);
				}
			}
			pa = pb;
		}
	}
	// We've converted the galaxy to radians
	this.galaxyprocessed = true;
	this.ctx.stroke();
	return this;
}
VirtualSky.prototype.drawMeteorShowers = function(colour){
	if(!this.meteorshowers || typeof this.showers==="string") return this;
	if(!colour) colour = this.col.showers;
	var shower, pos, label, xoff, c, d, p, start, end, dra, ddc, f;
	c = this.ctx;
	c.beginPath();
	c.strokeStyle = colour;
	c.fillStyle = colour;
	c.lineWidth = 0.75;
	var fs = this.fontsize();
	this.setFont();
	var y = this.clock.getFullYear();
	for(var s in this.showers){
		d = this.showers[s].date;
		p = this.showers[s].pos;
		start = new Date(y,d[0][0]-1,d[0][1]);
		end = new Date(y,d[1][0]-1,d[1][1]);
		if(start > end && this.clock < start) start = new Date(y-1,d[0][0]-1,d[0][1]);
		if(this.clock > start && this.clock < end){
			dra = (p[1][0]-p[0][0]);
			ddc = (p[1][1]-p[0][1]);
			f = (this.clock-start)/(end-start);
			pos = this.radec2xy((this.showers[s].pos[0][0]+(dra*f))*this.d2r,(this.showers[s].pos[0][1]+(ddc*f))*this.d2r);
			if(this.isVisible(pos.el)){
				label = this.htmlDecode(this.showers[s].name);
				xoff = (c.measureText) ? -c.measureText(label).width/2 : 0;
				c.moveTo(pos.x+2,pos.y);
				c.arc(pos.x,pos.y,2,0,Math.PI*2,true);
				c.fillText(label,pos.x+xoff,pos.y-fs/2);
			}
		}
	}
	c.fill();
	return this;
}

VirtualSky.prototype.drawEcliptic = function(colour){
	if(!this.ecliptic) return this;
	if(!colour || typeof colour!="string") colour = this.col.ec;
	var c = this.ctx;
	var step = 2*this.d2r;
	c.beginPath(); 
	c.strokeStyle = colour;
	c.lineWidth = 3;
	var maxl = this.maxLine();

	var old = {x:-1,y:-1,moved:false};
	for(var a = 0 ; a < Math.PI*2 ; a += step) old = joinpoint(this,"ec",a,0,old,maxl);
	
	c.stroke();
	return this;
}

VirtualSky.prototype.drawMeridian = function(colour){
	if(!this.meridian) return this;
	if(!colour || typeof colour!="string") colour = this.col.meridian;
	var c = this.ctx;
	var a, b;
	var minb = 0;
	var maxb = (typeof this.projection.maxb==="number") ? this.projection.maxb*this.d2r : Math.PI/2;
	var step = 2*this.d2r;
	var maxl = this.maxLine();
	c.beginPath(); 
	c.strokeStyle = colour;
	c.lineWidth = 2;

	var old = {x:-1,y:-1,moved:false};
	for(b = minb, a = 0; b <= maxb ; b+= step) old = joinpoint(this,"az",Math.PI,b,old,maxl);
	for(b = maxb, a = 0; b >= minb ; b-= step) old = joinpoint(this,"az",0,b,old,maxl);

	c.stroke();
	return this;
}

// type can be "az" or "eq"
VirtualSky.prototype.drawGridlines = function(type,step,colour){
	if(!type || !this.grid[type]) return this;
	if(!colour || typeof colour!="string") colour = this.col[type];
	if(!step || typeof step!="number") step = this.grid.step;

	var maxb,minb,x,y,a,b,pos,c,oldx,oldy,bstep2,ra,dc;
	c = this.ctx;
	oldx = 0;
	oldy = 0;
	c.beginPath(); 
	c.strokeStyle = colour;
	c.lineWidth = 1.0;
	bstep = 2;
	if(type=="az"){
		maxb = (typeof this.projection.maxb==="number") ? this.projection.maxb : 90-bstep;
		minb = 0;
	}else{
		maxb = 90-bstep;
		minb = -maxb;
	}
	var maxl = this.maxLine(5);
	old = {x:-1,y:-1,moved:false};
	step *= this.d2r;
	bstep *= this.d2r;
	minb *= this.d2r;
	maxb *= this.d2r;
	// Draw grid lines in elevation/declination/latitude
	for(a = 0 ; a < Math.PI*2 ; a += step){
		old.moved = false;
		for(b = minb; b <= maxb ; b+= bstep) old = joinpoint(this,type,a,b,old,maxl);
	}
	c.stroke();
	c.beginPath(); 
	if(type=="az"){
		minb = 0;
		maxb = 90-bstep;
	}else{
		minb = -90+step;
		maxb = 90;
	}
	minb *= this.d2r;
	maxb *= this.d2r;
	old = {x:-1,y:-1,moved:false};
	// Draw grid lines in azimuth/RA/longitude
	for(b = minb; b < maxb ; b+= step){
		old.moved = false;
		for(a = 0 ; a <= 2*Math.PI ; a += bstep) old = joinpoint(this,type,a,b,old,maxl);
	}
	c.stroke();
	return this;
}

VirtualSky.prototype.drawCardinalPoints = function(){
	if(!this.cardinalpoints) return this;
	var i,x,y,pos,ang,f,m,r;
	var azs = new Array(0,90,180,270);
	var d = [this.getPhrase('N'),this.getPhrase('E'),this.getPhrase('S'),this.getPhrase('W')];
	var pt = 15;
	var c = this.ctx;
	c.beginPath();
	c.fillStyle = this.col.cardinal;
	var fontsize = this.fontsize();
	for(i = 0 ; i < azs.length ; i++){
		if(c.measureText){
			m = c.measureText(d[i]);
			r = (m.width > fontsize) ? m.width/2 : fontsize/2;
		}else r = fontsize/2;
		ang = (azs[i]-this.az_off)*this.d2r;
		if(this.polartype){
			f = (this.tall/2) - r*1.5;
			x = -f*Math.sin(ang);
			y = -f*Math.cos(ang);
			x = isFinite(x) ? this.wide/2 + x - r : 0;
			y = isFinite(y) ? this.tall/2 + y + r: 0;
		}else{
			pos = this.azel2xy(ang,0,this.wide,this.tall);
			x = isFinite(pos.x) ? pos.x - r : 0;
			y = isFinite(pos.y) ? pos.y - pt/2 : 0;
			if(x < 0 || x > this.wide-pt) x = -r;
		}
		if(x > 0) c.fillText(d[i],x,y);
	}
	c.fill();
	return this;
}

// Assume decimal Ra/Dec
VirtualSky.prototype.highlight = function(i,colour){
	if(this.pointers[i].ra && this.pointers[i].dec){
		colour = (this.pointers[i].colour) ? this.pointers[i].colour : ((colour) ? colour : "rgba(255,0,0,1)");
		if(this.negative) colour = this.getNegative(colour);
		var pos = this.radec2xy(this.pointers[i].ra*this.d2r, this.pointers[i].dec*this.d2r);
		var c = this.ctx;
		if(this.isVisible(pos.el)){
			this.pointers[i].az = pos.az;
			this.pointers[i].el = pos.el;
			this.pointers[i].x = pos.x;
			this.pointers[i].y = pos.y;
			this.pointers[i].d = 5;
			c.fillStyle = colour;
			c.strokeStyle = colour;
			c.beginPath(); 
			c.fillRect(this.pointers[i].x-this.pointers[i].d/2,this.pointers[i].y-this.pointers[i].d/2,5,5);
			this.drawLabel(pos.x,pos.y,this.pointers[i].d,colour,this.pointers[i].label);
		}
	}
	return this;
}

// Function to join the dots
function joinpoint(s,type,a,b,old,maxl){
	var x,y,show,c,pos;
	c = s.ctx;
	if(type=="az") pos = s.azel2xy((a-s.az_off*s.d2r),b,s.wide,s.tall);
	else if(type=="eq") pos = s.radec2xy(a,b);
	else if(type=="ec") pos = s.ecliptic2xy(a,b,s.times.LST);
	else if(type=="gal") pos = s.gal2xy(a,b);
	x = pos.x;
	y = pos.y;
	if(type=="az") show = true;
	else show = ((s.isVisible(pos.el)) ? true : false);
	if(show){
		if(isFinite(x) && isFinite(y)){
			if(type=="az"){
				if(!old.moved || Math.sqrt(Math.pow(old.x-x,2)+Math.pow(old.y-y,2)) > s.tall/2) c.moveTo(x,y);
				c.lineTo(x,y);
				old.moved = true;
			}else{
				// If the last point on s contour is more than a canvas width away
				// it is probably supposed to be behind us so we won't draw a line 
				if(!old.moved || Math.sqrt(Math.pow(old.x-x,2)+Math.pow(old.y-y,2)) > maxl){
					c.moveTo(x,y);
					old.moved = true;
				}else c.lineTo(x,y);
			}
			old.x = x;
			old.y = y;
			return old;
		}
	}
	return old;
}

VirtualSky.prototype.maxLine = function(f){
	if(this.projection.id == "gnomic") return this.tall;
	if(typeof f!=="number") f = 3;
	return this.tall/f;
}

// Expects a latitude,longitude string (comma separated)
VirtualSky.prototype.setGeo = function(pos){
	if(typeof pos!=="string") return this;
	pos = pos.split(',');
	this.setLatitude(pos[0]);
	this.setLongitude(pos[1]);
	return this;
}

// Input: latitude (deg)
VirtualSky.prototype.setLatitude = function(l){
	this.latitude = inrangeEl(parseFloat(l)*this.d2r);
	return this; 
}

// Input: longitude (deg)
VirtualSky.prototype.setLongitude = function(l){
	this.longitude = parseFloat(l)*this.d2r;
	while(this.longitude <= -Math.PI) this.longitude += 2*Math.PI;
	while(this.longitude > Math.PI) this.longitude -= 2*Math.PI;
	return this; 
}

VirtualSky.prototype.setRADec = function(r,d){
	return this.setRA(r).setDec(d);
}

VirtualSky.prototype.setRA = function(r){
	this.ra_off = (r%360)*this.d2r;
	return this;
}

VirtualSky.prototype.setDec = function(d){
	this.dc_off = d*this.d2r
	return this;
}

// Pan the view to the specified RA,Dec
// Inputs: RA (deg), Dec (deg), duration (seconds)
VirtualSky.prototype.panTo = function(ra,dec,s){
	if(!s) s = 1000;
	if(typeof ra!=="number" || typeof dec!=="number") return this;
	this.panning = { s: { ra:this.ra_off*this.r2d, dec:this.dc_off*this.r2d }, e: { ra: ra, dec: dec}, duration: s, start: new Date() };
	this.panning.dr = this.panning.e.ra-this.panning.s.ra;
	this.panning.dd = this.panning.e.dec-this.panning.s.dec;
	if(this.panning.dr > 180) this.panning.dr = -(360-this.panning.dr);
	if(this.panning.dr < -180) this.panning.dr = (360+this.panning.dr);
	return this.panStep();
}

// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
	return  window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function( callback ){ window.setTimeout(callback, 1000 / 60); };
})();

// Animation step for the panning
VirtualSky.prototype.panStep = function(){
	var ra,dc;
	var now = new Date();
	var t = (now - this.panning.start)/this.panning.duration;
	ra = this.panning.s.ra + (this.panning.dr)*(t);
	dc = this.panning.s.dec + (this.panning.dd)*(t);

	// Still animating
	if(t < 1){
		// update and draw
		this.setRADec(ra,dc).draw();	
		var _obj = this;
		// request new frame
		requestAnimFrame(function() { _obj.panStep(); });
	}else{
		// We've ended
		this.setRADec(this.panning.e.ra,this.panning.e.dec).draw();
	}
	return this;
}

VirtualSky.prototype.liveSky = function(pos){
	this.islive = !this.islive;
	if(this.islive) interval = window.setInterval(function(sky){ sky.setClock('now'); },1000,this);
	else{
		if(typeof interval!="undefined") clearInterval(interval);
	}
	return this;
}

VirtualSky.prototype.start = function(){
	this.islive = true;
	// Clear existing interval
	if(typeof interval!="undefined") clearInterval(interval);
	interval = window.setInterval(function(sky){ sky.setClock('now'); },1000,this);
}
VirtualSky.prototype.stop = function(){
	this.islive = false;
	// Clear existing interval
	if(typeof interval!="undefined") clearInterval(interval);
}
// Increment the clock by the amount specified
VirtualSky.prototype.advanceTime = function(by,wait){
	if(typeof by=="undefined"){
		this.clock = new Date();
		this.times = this.astronomicalTimes();
	}else{
		by = parseFloat(by);
		if(!wait) wait = 1000/this.fps; // ms between frames
		var fn = function(vs,by){ vs.setClock(by); };
		clearInterval(this.interval_time)
		this.interval_time = window.setInterval(fn,wait,this,by);
	}
	return this;
}
VirtualSky.prototype.setClock = function(seconds){
	if(typeof seconds=="string"){
		seconds = convertTZ(seconds);
		if(!this.input.clock){
			if(seconds=="now") this.clock = new Date();
			else this.clock = new Date(seconds);
		}else{
			this.clock = (typeof this.input.clock==="string") ? this.input.clock.replace(/%20/g,' ') : this.input.clock;
			if(typeof this.clock=="string") this.clock = new Date(this.clock);
		}
	}else if(typeof seconds=="object"){
		this.clock = seconds;
		this.now = this.clock;
	}else this.clock = new Date(this.clock.getTime() + seconds*1000);
	this.now = this.clock;
	this.times = this.astronomicalTimes();
	this.draw();
	return this;
}
VirtualSky.prototype.toggleAtmosphere = function(){ this.gradient = !this.gradient; this.draw(); return this; }
VirtualSky.prototype.toggleStars = function(){ this.showstars = !this.showstars; this.draw(); return this; }
VirtualSky.prototype.toggleStarLabels = function(){ this.showstarlabels = !this.showstarlabels; this.draw(); return this; }
VirtualSky.prototype.toggleNegative = function(){ this.negative = !this.negative; this.col = this.colours[(this.negative ? "negative" : "normal")]; this.draw(); return this; }
VirtualSky.prototype.toggleConstellationLines = function(){ this.constellation.lines = !this.constellation.lines; this.draw(); return this; }
VirtualSky.prototype.toggleConstellationBoundaries = function(){ this.constellation.boundaries = !this.constellation.boundaries; this.draw(); return this; }
VirtualSky.prototype.toggleConstellationLabels = function(){ this.constellation.labels = !this.constellation.labels; this.draw(); return this; }
VirtualSky.prototype.toggleMeteorShowers = function(){ this.meteorshowers = !this.meteorshowers; this.draw(); return this; }
VirtualSky.prototype.toggleCardinalPoints = function(){ this.cardinalpoints = !this.cardinalpoints; this.draw(); return this; }
VirtualSky.prototype.toggleGridlinesAzimuthal = function(){ this.grid.az = !this.grid.az; this.draw(); return this; }
VirtualSky.prototype.toggleGridlinesEquatorial = function(){ this.grid.eq = !this.grid.eq; this.draw(); return this; }
VirtualSky.prototype.toggleGridlinesGalactic = function(){ this.grid.gal = !this.grid.gal; this.draw(); return this; }
VirtualSky.prototype.toggleEcliptic = function(){ this.ecliptic = !this.ecliptic; this.draw(); return this; }
VirtualSky.prototype.toggleMeridian = function(){ this.meridian = !this.meridian; this.draw(); return this; }
VirtualSky.prototype.toggleGround = function(){ this.ground = !this.ground; this.draw(); return this; }
VirtualSky.prototype.toggleGalaxy = function(){ this.showgalaxy = !this.showgalaxy; this.draw(); return this; }
VirtualSky.prototype.toggleMeteorShowers = function(){ this.meteorshowers = !this.meteorshowers; this.draw(); return this; }
VirtualSky.prototype.togglePlanetHints = function(){ this.showplanets = !this.showplanets; this.draw(); return this; }
VirtualSky.prototype.togglePlanetLabels = function(){ this.showplanetlabels = !this.showplanetlabels; this.draw(); return this; }
VirtualSky.prototype.toggleOrbits = function(){ this.showorbits = !this.showorbits; this.draw(); return this; }
VirtualSky.prototype.toggleAzimuthMove = function(az){
	if(this.az_step == 0){
		this.az_step = (typeof az=="number") ? az : -1;
		this.moveIt();
	}else{
		this.az_step = 0;
		if(typeof this.timer_az!="undefined") clearTimeout(this.timer_az);
	}
	return this;
}
VirtualSky.prototype.addPointer = function(input){
	// Check if we've already added this
	var style,url,img,label,credit;
	var matched = -1;
	var p;
	for(var i = 0 ; i < this.pointers.length ; i++){
		if(this.pointers[i].ra == input.ra && this.pointers[i].dec == input.dec && this.pointers[i].label == input.label) matched = i;
	}
	// Hasn't been added already
	if(matched < 0){
		input.ra *= 1;	// Correct for a bug
		input.dec *= 1;
		i = this.pointers.length;
		p = input;
		if(!p.html){
			style = (p.style) ? p.style : "width:128px;height:128px;";
			url = (p.url) ? p.url : "http://server1.wikisky.org/v2?ra="+(p.ra/15)+"&de="+(p.dec)+"&zoom=6&img_source=DSS2";
			img = (p.img) ? p.img : 'http://server7.sky-map.org/imgcut?survey=DSS2&w=128&h=128&ra='+(p.ra/15)+'&de='+p.dec+'&angle=0.25&output=PNG';
			label = (p.credit) ? p.credit : "View in Wikisky";
			credit = (p.credit) ? p.credit : "DSS2/Wikisky";
			p.html =  (p.html) ? p.html : '<div class="virtualskyinfocredit"><a href="'+url+'" style="color: white;">'+credit+'<\/a><\/div><a href="'+url+'" style="display:block;'+style+'"><img src="'+img+'" style="border:0px;'+style+'" title="'+label+'" \/><\/a>';
		}
		this.pointers[i] = p;
	}
	return (this.pointers.length);
}
VirtualSky.prototype.changeAzimuth = function(inc){
	this.az_off += (typeof inc=="number") ? inc : 5;
	this.draw();
	return this;
}
VirtualSky.prototype.moveIt = function(){
	// Send 'this' context to the setTimeout function so we can redraw
	this.timer_az = window.setTimeout(function(mysky){ mysky.az_off += mysky.az_step; mysky.draw(); mysky.moveIt(); },100,this);
	return this;
}
VirtualSky.prototype.spinIt = function(tick,wait){
	if(typeof tick == "number") this.spin = (tick == 0) ? 0 : (this.spin+tick);
	else{
		var t = 1.0/this.fps;
		var s = 2;
		// this.spin is the number of seconds to update the clock by 
		if(this.spin == 0) this.spin = (tick == "up") ? t : -t;
		else{
			if(Math.abs(this.spin) < 1) s *= 2;
			if(this.spin > 0) this.spin = (tick == "up") ? (this.spin*s) : (this.spin/s);
			else if(this.spin < 0) this.spin = (tick == "up") ? (this.spin/s) : (this.spin*s);
			if(this.spin < t && this.spin > -t) this.spin = 0;
		}
	}
	if(typeof this.interval_time!="undefined") clearInterval(this.interval_time);
	if(this.spin != 0) this.advanceTime(this.spin,wait);
	return this;
}
VirtualSky.prototype.getOffset = function(el){
	var _x = 0;
	var _y = 0;
	while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
		_x += el.offsetLeft - el.scrollLeft;
		_y += el.offsetTop - el.scrollTop;
		el = el.parentNode;
	}
	return { top: _y, left: _x };
}
VirtualSky.prototype.getJD = function(today) {
	// The Julian Date of the Unix Time epoch is 2440587.5
	if(!today) today = this.clock;
	return ( today.getTime() / 86400000.0 ) + 2440587.5;
}
VirtualSky.prototype.getNegative = function(colour){
	var end = (colour.indexOf("rgb") == 0) ? (colour.lastIndexOf(")")) :  0;
	if(end == 0) return colour;
	var rgb = colour.substring(colour.indexOf("(")+1,end).split(",");
	return (rgb.length==3) ? ('rgb('+(255-rgb[0])+','+(255-rgb[1])+','+(255-rgb[2])+')') : ('rgba('+(255-rgb[0])+','+(255-rgb[1])+','+(255-rgb[2])+','+(rgb[3])+')');
}
// Calculate the Great Circle angular distance (in radians) between two points defined by d1,l1 and d2,l2
VirtualSky.prototype.greatCircle = function(l1,d1,l2,d2){
	return Math.acos(Math.cos(d1)*Math.cos(d2)*Math.cos(l1-l2)+Math.sin(d1)*Math.sin(d2));
}

// Bind events
VirtualSky.prototype.bind = function(ev,fn){
	if(typeof ev!="string" || typeof fn!="function") return this;
	if(this.events[ev]) this.events[ev].push(fn);
	else this.events[ev] = [fn];
	return this;
}
// Trigger a defined event with arguments. This is meant for internal use
// sky.trigger("zoom",args)
VirtualSky.prototype.trigger = function(ev,args){
	if(typeof ev != "string") return;
	if(typeof args != "object") args = {};
	var o = [];
	var _obj = this;
	if(typeof this.events[ev]=="object"){
		for(i = 0 ; i < this.events[ev].length ; i++){
			if(typeof this.events[ev][i] == "function") o.push(this.events[ev][i].call(_obj,args))
		}
	}
	if(o.length > 0) return o
}

// Some useful functions
function convertTZ(s){
	function formatHour(h){
		var s = (h >= 0 ? "+" : "-");
		h = Math.abs(h);
		var m = (h - Math.floor(h))*60;
		var h = Math.floor(h);
		return s+(h < 10 ? "0"+h : h)+(m < 10 ? "0"+m : m);
	}
	var tzs = { A:1, ACDT:10.5, ACST:9.5, ADT:-3, AEDT:11, AEST:10, AKDT:-8, AKST:-9, AST:-4, AWST:8, B:2, BST:1, C:3, CDT:-5, CEDT:2, CEST:2, CET:1, CST:-6, CXT:7, D:4, E:5, EDT:-4, EEDT:3, EEST:3, EET:2, EST:-5, F:6, G:7, GMT:0, H:8, HAA:-3, HAC:-5, HADT:-9, HAE:-4, HAP:-7, HAR:-6, HAST:-10, HAT:-2.5, HAY:-8, HNA:-4, HNC:-6, HNE:-5, HNP:-8, HNR:-7, HNT:-3.5, HNY:-9, I:9, IST:9, IST:1, JST:9, K:10, L:11, M:12, MDT:-6, MESZ:2, MEZ:1, MST:-7, N:-1, NDT:-2.5, NFT:11.5, NST:-3.5, O:-2, P:-3, PDT:-7, PST:-8, Q:-4, R:-5, S:-6, T:-7, U:-8, UTC:0, UT:0, V:-9, W:-10, WEDT:1, WEST:1, WET:0, WST:8, X:-11, Y:-12, Z:0 }
	// Get location of final space character
	var i = s.lastIndexOf(' ');
	// Replace the time zone with the +XXXX version
	if(i > 0 && tzs[s.substr(i+1)]){
		return s.substring(0,i)+" "+formatHour(tzs[s.substr(i+1)]);
	}
	return s;
}

$.virtualsky = function(placeholder,input) {
	if(typeof input=="object") input.container = placeholder;
	else {
		if(typeof placeholder=="string") input = { container: placeholder };
		else input = placeholder;
	}
	input.plugins = $.virtualsky.plugins;
	return new VirtualSky(input);
};

$.virtualsky.plugins = [];
})(jQuery);
