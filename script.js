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
			let state = caches[i].getAttribute("state");
			let county = caches[i].getAttribute("county");
			let publish = caches[i].getAttribute("publish");
			let curStatus = caches[i].getAttribute("status");
			let last_log = caches[i].getAttribute("last_log");
			
			let point = new google.maps.LatLng(
			   parseFloat(caches[i].getAttribute("latitude")),
			   parseFloat(caches[i].getAttribute("longitude")));
			
			//temos de planear o que vamos mostrar na info window
			let html = "" + name;
			
			let icon = customIcons[kind] || {};
			
			markers[i] = new google.maps.Marker({
					map: map,
					position: point,
					icon: icon.icon,
					
					code: code,
					name: name,
					owner: owner,
					altitude: altitude,
					kind: kind,
					size: size,
					difficulty: difficulty,
					terrain: terrain,
					favorites: favorites,
					founds: founds,
					not_founds: not_founds,
					state: state,
					county: county,
					publish: publish,
					curStatus : curStatus,
					last_log: last_log
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
	mapOrMarkerClick(map,marker);
	
	
	directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    document.getElementById("min_text").value = ("Min: "+document.getElementById("min").value);
    document.getElementById("max_text").value = ("Max: "+document.getElementById("max").value);
    
    dif_min = 0;
    dif_max = 5;
	
	//lockar o delete
	deleteLock();
}

//-----------------------------------------------------------------------------------

//delete button lock
function deleteLock(){
	document.getElementById("del").elements[1].setAttribute("disabled", "" );
}

//locks cache info form
function lockForm(form){
	for ( i = 0; i < form.elements.length; i++){
		var n = form.elements[i];
		n.setAttribute("disabled", "" );;
	}
}

//unlocks cache info form
function unlockForm(form){
	for ( i = 0; i < form.elements.length; i++){
		var n = form.elements[i];
		n.removeAttribute("disabled");;
	}
}

//comecar direcoes
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
		var form=document.getElementById("insCache");
		lockForm(form);
		
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
		
		document.getElementById("del").elements[1].removeAttribute("disabled");
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
function mapOrMarkerClick(map,marker){
	google.maps.event.addListener(map, 'click', function(event) {
		var form=document.getElementById("insCache");
		unlockForm(form);
		
		marker.setPosition(event.latLng);
		marker.setVisible(true);
		
		setFormDefault(event,form);
		//mudar o botao para add
		var botaof = form.elements[18];
		botaof.value = "Add cache";	
	});
	google.maps.event.addListener(marker, 'click', function(event) {
		var form=document.getElementById("insCache");
		unlockForm(form);
		
		setFormDefault(event,form);
		//mudar o botao para add
		var botaof = form.elements[18];
		botaof.value = "Add cache";	
	});
}

function setFormDefault(event,form){
	for ( i = 0; i < form.elements.length-1; i++){
		var n = form.elements[i];
		n.value = "";
	}

	var latf=form.elements[3];
	latf.removeAttribute("disabled");
	latf.value=event.latLng.lat();
	var lngf=form.elements[4];
	lngf.removeAttribute("disabled");
	lngf.value=event.latLng.lng();
}

//copia informacao da cache mete no form
function cacheClick(cache){
	google.maps.event.addListener(cache, 'click', function(event) {
		var form=document.getElementById("insCache");
		unlockForm(form);
		fillFormInfo(cache,form);
		
		//mudar o botao para update
		var botaof = form.elements[18];
		botaof.value = "Update cache";
			
	});
}

function fillFormInfo(cache){
	var form=document.getElementById("insCache");
		
		var codef=form.elements[0];
		codef.value=cache.code;
		var namef = form.elements[1];
		namef.value=cache.name;
		var ownerf = form.elements[2];
		ownerf.value=cache.owner;
		
		form.elements[3].value = cache.position.lat();
		form.elements[4].value = cache.position.lng();
		
		form.elements[3].setAttribute("disabled", "" );
		form.elements[4].setAttribute("disabled", "" );
		
		var altitudef=form.elements[5];
		altitudef.value=cache.altitude;
		var kindf=form.elements[6];
		kindf.value=cache.kind;
		var sizef = form.elements[7];
		sizef.value=cache.size;
		var difficultyf = form.elements[8];
		difficultyf.value=cache.difficulty;
		var terrainf=form.elements[9];
		terrainf.value=cache.terrain;
		var favoritesf=form.elements[10];
		favoritesf.value=cache.favorites;
		var foundsf=form.elements[11];
		foundsf.value=cache.founds;
		var nfoundsf=form.elements[12];
		nfoundsf.value=cache.not_founds;
		var statef=form.elements[13];
		statef.value=cache.state;
		var countyf=form.elements[14];
		countyf.value=cache.county;
		var publishf = form.elements[15];
		publishf.value=cache.publish;
		var statusf = form.elements[16];
		statusf.value = cache.curStatus;
		var llogf = form.elements[17];
		llogf.value = cache.last_log;
}

//parte relativa ao pan out
function panOut(){
    for(let j=0; j<markers.length; j++) {
        if (markers[j].getVisible()) 
			bounds.extend(markers[j].getPosition());
    }
	map.fitBounds(bounds);
}

//faz update do mapa em funcao da legenda
function checkLegend() {
    for(let j=0; j<markers.length; j++) {
        let dif = caches[j].getAttribute("difficulty");
        let status = caches[j].getAttribute("status");
        let size = caches[j].getAttribute("size");
        let kind = caches[j].getAttribute("kind");
        let dif_bool = false;
        let stat_bool = false;
        let size_bool = false;
        let kind_bool = false;
        switch (status){
            case 'A':  if (status_A.checked) stat_bool=true; break;
		    case 'D':  if(status_D.checked) stat_bool=true; break;
		    case 'E':  if(status_E.checked) stat_bool=true; break;    
        }
        switch (size) {
		      case 'Micro':  if(size_M.checked) size_bool= true; break;
		      case 'Small':  if(size_S.checked) size_bool=true; break;
		      case 'Regular':  if(size_R.checked) size_bool=true; break;
              case 'Unknown': if(size_U.checked) size_bool=true; break;
              case 'Other':  if(size_O.checked) size_bool=true; break;
              case 'Large':  if(size_L.checked) size_bool=true; break;
		       }
        switch (kind) {
		      case 'Traditional':  if(Traditional.checked) kind_bool=true; break;
		      case 'Webcam':  if(Webcam.checked) kind_bool=true; break;
		      case 'Mystery':  if(Mystery.checked) kind_bool=true; break;
              case 'Multi':  if(Multi.checked) kind_bool=true; break;
              case 'Letterbox':   if(Letterbox.checked) kind_bool=true; break;
              case 'Event':  if(Eventy.checked) kind_bool=true; break;
              case 'CITO':  if(CITO.checked) kind_bool=true; break;
              case 'Earthcache':  if(Earthcache.checked) kind_bool=true; break;
              case 'Wherigo':  if(Wherigo .checked) kind_bool=true; break;
		       }
        if(dif<=dif_max && dif>=dif_min)   dif_bool=true;
        
        if(dif_bool && stat_bool && size_bool && kind_bool) markers[j].setVisible(true);
        else markers[j].setVisible(false);
        
    }
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

//verifica select do walking e driving 
function unselectOpt(box){
    let w = document.getElementById("w");
    let d = document.getElementById("d");
    switch(box){
        case 'w':
            d.checked=false;
			startRoute();
            break;
        case 'd':
            w.checked=false;
			startRoute();
            break
    }
}
	