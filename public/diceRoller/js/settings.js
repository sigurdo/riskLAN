//Funksjoner:
function apnelukke(e) {
	var hva = e.target.id;
	var skalEndresEl = document.querySelector('#'+hva+' div');
	skalEndresEl.style.display = (skalEndresEl.style.display == 'block') ? 'none' : 'block';
}

function slett(e) {
	bruk();
	var slettNr = Number(e.target.id[5]);
	var valgVentetid = JSON.parse(localStorage.getItem('5QSGeP_valgVentetid'));
	valgVentetid.splice(slettNr, 1);
	localStorage.setItem('5QSGeP_valgVentetid', JSON.stringify(valgVentetid));
	oppdaterInput();
}

function settDef(e) {
	bruk();
	var settNr = Number(e.target.id[7]);
	var valgVentetid = JSON.parse(localStorage.getItem('5QSGeP_valgVentetid'));
	for (var i = 0; i < valgVentetid.length; i++) {
		valgVentetid[i].def = false;
	}
	valgVentetid[settNr].def = true;
	localStorage.setItem('5QSGeP_valgVentetid', JSON.stringify(valgVentetid));
	oppdaterInput();
}

function leggTil() {
	bruk();
	var valgVentetid = JSON.parse(localStorage.getItem('5QSGeP_valgVentetid'));
	var ny = {
		navn: document.querySelector('#navnNy').value,
		ms: Number(document.querySelector('#msNy').value),
		def: false
	}
	//Finner riktig plass:
	var narmest = valgVentetid[valgVentetid.length - 1].ms;
	var narmestPlass = valgVentetid.length;
	for (var i = 0; i < valgVentetid.length; i++) {
		var diff = valgVentetid[i].ms - ny.ms;
		if(diff > 0 && diff <= narmest) {
			narmest = diff;
			narmestPlass = i;
		}
	}
	valgVentetid.splice(narmestPlass, 0, ny);
	localStorage.setItem('5QSGeP_valgVentetid', JSON.stringify(valgVentetid));
	oppdaterInput();
}

function oppdaterInput() {
	for (var i = 0; i < 1000; i++) {
		var option = document.createElement('option');
		option.value = i;
		option.innerHTML = i;
		defMinAngEl.appendChild(option);
	}

	var defMinAng = localStorage.getItem('5QSGeP_defMinAng');
	if (JSON.parse(defMinAng) == null) {
		localStorage.setItem('5QSGeP_defMinAng', 3);
		defMinAng = localStorage.getItem('5QSGeP_defMinAng');
	}

	defMinAngEl.value = defMinAng;

	//Oppdaterer valg for ventetid:
	valgVentetidEl.innerHTML = '';
	
	var temp = localStorage.getItem('5QSGeP_valgVentetid');
	if (JSON.parse(temp) == null) {
		localStorage.setItem('5QSGeP_valgVentetid', JSON.stringify([
			{navn: 'Ingen', ms: 0, def: false},
			{navn: 'Kort', ms: 250, def: false},
			{navn: 'Middels', ms: 750, def: true},
			{navn: 'Lang', ms: 3144, def: false},
			{navn: 'Episk', ms: 6288, def: false}
		]));
		var valgVentetid = JSON.parse(localStorage.getItem('5QSGeP_valgVentetid'));
	}
	else {
		var valgVentetid = JSON.parse(temp);
	}

	var tr = document.createElement('tr');
	tr.innerHTML = '<th> Navn </th> <th> ms </th> <th> Default </th> <th>  </th>';
	valgVentetidEl.appendChild(tr);

	for (var i = 0; i < valgVentetid.length; i++) {
		var tr = document.createElement('tr');
		var navnEl = document.createElement('td');
		navnEl.innerHTML = '<input type="text" id="navn'+i+'" value="'+valgVentetid[i].navn+'">';
		tr.appendChild(navnEl);

		var msEl = document.createElement('td');
		msEl.innerHTML = '<input type="number" id="ms'+i+'" value="'+valgVentetid[i].ms+'">';
		tr.appendChild(msEl);

		var settDefEl = document.createElement('td');
		settDefEl.id = 'settDef'+i;
		if (valgVentetid[i].def) {
			settDefEl.innerHTML = '<img id="defValgVentetidBilde" src="media/checkmark.png">';
		}
		else {
			settDefEl.style.cursor = 'pointer';
			settDefEl.innerHTML = '';
			settDefEl.addEventListener('click', settDef);
		}
		tr.appendChild(settDefEl);

		var slettEl = document.createElement('td');
		slettEl.id = 'slett'+i;
		slettEl.style.cursor = 'pointer';
		slettEl.innerHTML = '<img class="slettValgVentetidBilde" id="slett'+i+'" src="media/slett.png">';
		slettEl.addEventListener('click', slett);
		tr.appendChild(slettEl);

		valgVentetidEl.appendChild(tr);
	}

	var tr = document.createElement('tr');
	var navnEl = document.createElement('td');
	navnEl.innerHTML = '<input type="text" id="navnNy" value="Ny">';
	tr.appendChild(navnEl);

	var msEl = document.createElement('td');
	msEl.innerHTML = '<input type="number" id="msNy" value="0">';
	tr.appendChild(msEl);

	var settDefEl = document.createElement('td');
	tr.appendChild(settDefEl);

	var leggTilEl = document.createElement('td');
	leggTilEl.style.cursor = 'pointer';
	leggTilEl.innerHTML = '<img id="leggTilValgVentetidBilde" src="media/add.png">';
	leggTilEl.addEventListener('click', leggTil);
	tr.appendChild(leggTilEl);

	valgVentetidEl.appendChild(tr);
}

function bruk() {
	//5QSGeP som står først i alle item-navnene er bare en tilfeldig kombinasjon av symboler for å være sikker på å unngå krøll med andre nettsiders cookies
	localStorage.setItem('5QSGeP_defMinAng', defMinAngEl.value);

	//For valg for ventetid
	var valgVentetid = JSON.parse(localStorage.getItem('5QSGeP_valgVentetid'));
	for (var i = 0; i < valgVentetid.length; i++) {
		valgVentetid[i].navn = document.querySelector('#navn'+i).value;
		valgVentetid[i].ms = Number(document.querySelector('#ms'+i).value);
	}

	valgVentetid.sort(function(a, b) {return a.ms - b.ms;}); //Sorterer stigende etter ms

	localStorage.setItem('5QSGeP_valgVentetid', JSON.stringify(valgVentetid));
}

function tilbakestill() {
	localStorage.setItem('5QSGeP_defMinAng', null);
	localStorage.setItem('5QSGeP_valgVentetid', null);

	oppdaterInput();
}


//Globale variabler:


//Elementer:
var bodyEl = document.querySelector('body');
var blitzEl = document.querySelector('#blitz');
var musikkEl = document.querySelector('#musikk');
var defMinAngEl = document.querySelector('#defMinAng');
var valgVentetidEl = document.querySelector('#valgVentetid');
var spillMusikkEl = document.querySelector('#spillMusikk');
var lydsporEl = document.querySelector('#lydspor');
var brukEl = document.querySelector('#bruk');
var tilbakestillEl = document.querySelector('#tilbakestill');


//Lyttere:
brukEl.addEventListener('click', function() {
	bruk();
	oppdaterInput();
});
tilbakestillEl.addEventListener('click', tilbakestill);
var h2 = document.querySelectorAll('h2');
for (var i = 0; i < h2.length; i++) {
	h2[i].addEventListener('click', apnelukke);
}


//Funksjonskall:
oppdaterInput();