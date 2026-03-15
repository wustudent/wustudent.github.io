const windowWidth = window.screen.width;
const scaleFactor = windowWidth > 1200 ? 1 : (windowWidth > 800 ? 1.3 : 1.5);
const map = L.map('map').setView([52.519932, 13.404692], 12);

L.tileLayer('https://sgx.geodatenzentrum.de/wmts_topplus_open/tile/1.0.0/web_light/default/WEBMERCATOR/{z}/{y}/{x}.png', {
    maxZoom: 18,
    attribution: 'Map data: &copy; <a href="http://www.govdata.de/dl-de/by-2-0">dl-de/by-2-0</a>',
    tileSize: scaleFactor===1?256:512,
    zoomOffset: scaleFactor===1?0:-1,
})
.addTo(map);

var zoomControl = document.querySelector('.leaflet-control-zoom');
var locateBtn = document.querySelector('#locate-btn');
if (zoomControl) {
    zoomControl.style.transform = `scale(${scaleFactor>1 ? 2 : 1})`;
    zoomControl.style.transformOrigin = 'top left';
}
if (locateBtn) {
    locateBtn.style.transform = `scale(${scaleFactor})`;
    locateBtn.style.transformOrigin = 'top left';
}

const markers = L.markerClusterGroup();
const redIcon = new L.Icon({
    iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

    iconSize: [25*scaleFactor, 41*scaleFactor],
    iconAnchor: [12*scaleFactor, 41*scaleFactor],
    popupAnchor: [1*scaleFactor, -34*scaleFactor]
});

const blueIcon = new L.Icon({
    iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
    shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

    iconSize: [25*scaleFactor, 41*scaleFactor],
    iconAnchor: [12*scaleFactor, 41*scaleFactor],
    popupAnchor: [1*scaleFactor, -34*scaleFactor]
});


function openGoogleMaps(lat, lon, name) {
    const url = `https://www.google.com/maps?q=${name}&sll=${lat},${lon}`;
    window.open(url, "_blank");
}

fetch("restaurants.geojson")
    .then(r => r.json())
    .then(data => {

        const markers = L.markerClusterGroup({
            iconCreateFunction: function (cluster) {
                const count = cluster.getChildCount();

                return L.divIcon({
                    html: `<div class="cluster-circle">${count}</div>`,
                    className: "cluster-wrapper",
                    iconSize: [40*scaleFactor, 40*scaleFactor]
                });
            }
        });

        data.features.forEach(f => {

            const p = f.properties;
            const latlng = [
                f.geometry.coordinates[1],
                f.geometry.coordinates[0]
            ];

            const lat = latlng[0];
            const lon = latlng[1];

            const marker = L.marker([lat, lon], { icon: redIcon });

            marker.bindPopup(`
                <b>${p.name}</b><br>
                <b>${(p.name!==p.englishName)?p.englishName:''}</b><br>
                ${p.address}<br><br>

                <button onclick="openGoogleMaps(${lat}, ${lon}, \`${p.englishName}\`)" class="popup-btn">
                    ➤ Open in Google Maps 
                </button>
            `);

            markers.addLayer(marker);
        });

        map.addLayer(markers);

    });

(function () {
    const locateBtn = document.getElementById('locate-btn');
    if (!locateBtn) return;

    let locateMarker = null;
    let accuracyCircle = null;

    locateBtn.addEventListener('click', () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser.');
            return;
        }

        locateBtn.disabled = true;
        const prevText = locateBtn.textContent;
        locateBtn.textContent = '⏳';

        navigator.geolocation.getCurrentPosition((pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const accuracy = pos.coords.accuracy || 0;
            const latlng = [lat, lng];

            // add/move locate marker
            if (locateMarker) {
                locateMarker.setLatLng(latlng);
            } else {
                locateMarker = L.marker(latlng, { icon: blueIcon}).addTo(map).bindPopup('You are here');
            }

            // add/move accuracy circle
            if (accuracyCircle) {
                accuracyCircle.setLatLng(latlng).setRadius(accuracy);
            } else {
                accuracyCircle = L.circle(latlng, { radius: accuracy, color: '#136AEC', fillColor: '#136AEC', fillOpacity: 0.15 }).addTo(map);
            }

            // center map on user location and scale to show accuracy circle
            map.setView(latlng, 15);

            locateMarker.openPopup();
            locateBtn.disabled = false;
            locateBtn.textContent = prevText;
        }, (err) => {
            alert('Unable to retrieve your location: ' + (err.message || err.code));
            locateBtn.disabled = false;
            locateBtn.textContent = prevText;
        }, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        });
    });
})();
