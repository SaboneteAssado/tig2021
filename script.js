var map;
var marker;
var apagar;
var center;

var markers = new Array();
let caches;

var directionsService;
var directionsRenderer;

//varaiaveis para o caminho entre 2 markers
var start;
var end;
var startCache;
var endCache;

var dif_min;
var dif_max;

var slider;
var bounds;

var customIcons = {
	
	Traditional: {
		icon: 'http://labs.google.com/ridefinder/images/mm_20_red.png '
	},
	Multi: {
		icon: 'http://labs.google.com/ridefinder/images/mm_20_green.png '
	},
	Wherigo: {
		icon: 'http://labs.google.com/ridefinder/images/mm_20_white.png '
	},
	Webcam: {
		icon: 'http://labs.google.com/ridefinder/images/mm_20_blue.png '
	},
	CITO: {
		icon: 'http://labs.google.com/ridefinder/images/mm_20_yellow.png '
	},
	Earthcache: {
		icon: 'http://labs.google.com/ridefinder/images/mm_20_orange.png '
	},
	Event: {
		icon: 'http://labs.google.com/ridefinder/images/mm_20_gray.png '
	},
	Mystery: {
		icon: 'http://labs.google.com/ridefinder/images/mm_20_brown.png '
	},
	Letterbox: {
		icon: 'http://labs.google.com/ridefinder/images/mm_20_purple.png '
	},
	Apagar: {
		icon: 'http://labs.google.com/ridefinder/images/mm_20_black.png '
	},
	Partida: {
		icon: 'http://maps.google.com/mapfiles/kml/pal2/icon13.png '
	},
	Chegada: {
		icon: 'http://www.google.com/mapfiles/arrow.png '
	}
	
	
	
}

function initMap() {

	center = {lat: 38.6628635, lng: -9.1867446};
	apagar = null;

	const mapCO = {
		mapTypeIds:[google.maps.MapTypeId.SATELLITE,google.maps.MapTypeId.HYBRID,google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.TERRAIN],
		style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
		position: google.maps.ControlPosition.TOP_LEFT
	};

	const mapOptions = {
		center: center,
		zoom: 16,
		mapTypeId:google.maps.MapTypeId.ROADMAP,
		mapTypeControl:true,
		mapTypeControlOptions: mapCO
	};          

	let infoWindow = new google.maps.InfoWindow;

	map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
	
	bounds= new google.maps.LatLngBounds(center, center);

	//ir buscar as caches a BD
	downloadUrl("xmloutdom.php", (data) => {
		let xml = data.responseXML;
		caches = xml.documentElement.getElementsByTagName("cache");
		for (let i = 0; i < caches.length; i++) {
			
			let code = caches[i].getAttribute("code");
			let name = caches[i].getAttribute("name");
			let owner = caches[i].getAttribute("owner");
			let altitude = caches[i].getAttribute("altitude");
			let kind = caches[i].getAttribute("kind");
			let size = caches[i].getAttribute("size");
			let difficulty = caches[i].getAttribute("difficulty");
			let terrain = caches[i].getAttribute("terrain");
			let favorites = caches[i].getAttribute("favorites");
			let founds = caches[i].getAttribute("founds");
			let not_founds = caches[i].getAttribute("not_founds");
			let curStatus = caches[i].getAttribute("status");
			
			let point = new google.maps.LatLng(
			   parseFloat(caches[i].getAttribute("latitude")),
			   parseFloat(caches[i].getAttribute("longitude")));
			
			//temos de planear o que vamos mostrar na info window
			let html = "" + name;
			let icon = customIcons[kind] || {};
			
			markers[i] = new google.maps.Marker({
					map: map,
					kind: kind,
					position: point,
					icon: icon.icon,
					code: code
			});
			
			bounds.extend(point);
			bindInfoWindow(markers[i], map, infoWindow, html);
			bindRemove(markers[i],name);
			cacheClick(markers[i]);
			bindRoute(markers[i]);
		}
	});
	
	//marcador de quando se clica no mapa
	marker = new google.maps.Marker({
			position: center, 
			map: map
		});
	marker.setVisible(false);
	mapClick(map,marker);
	
	directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    document.getElementById("min_text").value = ("Min: "+document.getElementById("min").value);
    document.getElementById("max_text").value = ("Max: "+document.getElementById("max").value);
    
    dif_min = 0;
    dif_max = 5;
}

//-----------------------------------------------------------------------------------

//direcoes
function startRoute(){
    let tmode;
    if(document.getElementById("w").checked) tmode='WALKING'
    if(document.getElementById("d").checked) tmode='DRIVING'
    directionsRenderer.setMap(map);
    var request = {
    origin: start,
    destination: end,
    travelMode: tmode
  };
  directionsService.route(request, function(result, status) {
    if (status == 'OK') {
      directionsRenderer.setDirections(result);
    }
  });
}

//recomecar direcoes
function resetDirections(){
	startCache.setIcon(customIcons[startCache.kind].icon);
	endCache.setIcon(customIcons[endCache.kind].icon);
	
    start=null;
    end=null;
    directionsRenderer.setMap(null);
}

//associar uma janela com info da cache no mapa
function bindInfoWindow(cache, map, infoWindow, html) {
	google.maps.event.addListener(cache, 'click', ()=> {
		infoWindow.setContent(html);
		infoWindow.open(map, cache);
	});
}

//ir buscar as caches BD
function downloadUrl(url,callback) {
	let request = window.ActiveXObject ?
	new ActiveXObject('Microsoft.XMLHTTP') :
	new XMLHttpRequest;

	request.onreadystatechange = ()=> {
		if (request.readyState == 4) {
		 request.onreadystatechange = doNothing;
		 callback(request, request.status);
		}
	};

	request.open('GET', url, true);
	request.send(null);
}

function doNothing() {}

//conseguir associar o dbclick a uma cache e ter informacao de remocao
function bindRemove(cache,name){
	google.maps.event.addListener(cache, 'rightclick', () => {
		//tratar da mudanca do icon
		if ( apagar != null) {
			apagar.setIcon(customIcons[apagar.kind].icon);
		}
		apagar = cache;
		apagar.setIcon(customIcons['Apagar'].icon);
		
		//mudar o campo do form
		let field = document.getElementById("del");
		let n = field.elements[0];
		n.value = cache.code;
	});
}

//associa pontos para direcoes
function bindRoute(cache){
	google.maps.event.addListener(cache, 'dblclick', ()=> {
            if(start==null){
				startCache = cache;
				startCache.setIcon(customIcons['Partida'].icon);
                start = cache.getPosition(); 
			}				
            else{
				endCache = cache;
				endCache.setIcon(customIcons['Chegada'].icon);
                end = cache.getPosition();
                startRoute();
            }
        });
}

//guardar a pos de clickar no mapa e meter no form
function mapClick(map,marker){
	google.maps.event.addListener(map, 'click', function(event) {
		
		marker.setPosition(event.latLng);
		marker.setVisible(true);
		
		var form=document.getElementById("insCache");
		var latf=form.elements[3];
		latf.value=event.latLng.lat();
		var lngf=form.elements[4];
		lngf.value=event.latLng.lng();
	});
}

//copia informacao da cache mete no form
function cacheClick(cache){
	google.maps.event.addListener(cache, 'click', function(event) {
		var form=document.getElementById("insCache");
			var latf=form.elements[0];
			latf.value=cache.code;
			
			var latf=form.elements[3];
			latf.value=event.latLng.lat();
			var lngf=form.elements[4];
			lngf.value=event.latLng.lng();
	});
}

function panOut(){
    for(let j=0; j<markers.length; j++) {
        if (markers[j].getVisible()) 
			bounds.extend(markers[j].getPosition());
    }
	map.fitBounds(bounds);
}

//faz update do mapa em funcao da legenda
function checkLegend(tagr) {
	
}

function updateTextInput(val) {
          document.getElementById('lblid').innerHTML = val; 
}

function updateDiff(){
            dif_min = document.getElementById("min").value;
            dif_max = document.getElementById("max").value;
            document.getElementById("min_text").value = ("Min: "+min);
            document.getElementById("max_text").value = ("Max: "+max);
            checkLegend('diff');
}

function unselectOpt(box){
    let w = document.getElementById("w");
    let d = document.getElementById("d");
    switch(box){
        case 'w':
            d.checked=false;
            break;
        case 'd':
            w.checked=false;
            break
    }
}
	