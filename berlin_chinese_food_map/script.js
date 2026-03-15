const windowWidth = window.screen.width;
const scaleFactor = 1;
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

// 定义全局变量 geojsonData
let geojsonData;

fetch("restaurants.geojson")
    .then(r => r.json())
    .then(data => {
        console.log('原始数据:', data); // 调试信息
        preprocessData(data); // 调用预处理函数
        geojsonData = data; // 将预处理后的数据赋值给全局变量
        console.log('预处理后的数据:', data); // 调试信息

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

        // 确保在函数外部定义 districtFilter 和 categoryFilter
        const districtFilter = document.getElementById('district-filter');
        const categoryFilter = document.getElementById('category-filter');

        // 过滤数据并更新地图
        function filterData() {
            const selectedDistrict = districtFilter.value;
            const selectedCategory = categoryFilter.value;

            const filteredFeatures = geojsonData.features.filter(feature => {
                const matchesDistrict = selectedDistrict === 'all' || feature.properties.district === selectedDistrict;
                const matchesCategory = selectedCategory === 'all' || feature.properties.category === selectedCategory;
                return matchesDistrict && matchesCategory;
            });

            updateMap(filteredFeatures);
        }

        // 更新地图显示
        function updateMap(features) {
            // 清空现有的 MarkerClusterGroup
            markers.clearLayers();

            // 如果没有剩余点，返回
            if (features.length === 0) {
                console.warn('没有符合条件的点');
                return;
            }

            // 创建边界对象
            const bounds = L.latLngBounds();

            // 添加过滤后的点
            features.forEach(feature => {
                const lat = feature.geometry.coordinates[1];
                const lon = feature.geometry.coordinates[0];
                const marker = L.marker([lat, lon], { icon: redIcon });

                 marker.bindPopup(`
                    <b>${feature.properties.name}</b><br>
                    <b>${(feature.properties.name!==feature.properties.englishName)?feature.properties.englishName:''}</b><br>
                    ${feature.properties.address}<br><br>

                    <button onclick="openGoogleMaps(${lat}, ${lon}, \`${feature.properties.englishName}\`)" class="popup-btn">
                        ➤ Open in Google Maps 
                    </button>
                `);

                markers.addLayer(marker);

                // 扩展边界
                bounds.extend([lat, lon]);
            });

            // 将更新后的 MarkerClusterGroup 添加回地图
            map.addLayer(markers);

            // 缩放地图到边界范围
            map.fitBounds(bounds);
        }

        // 监听下拉菜单变化
        [districtFilter, categoryFilter].forEach(filter => {
            filter.addEventListener('change', filterData);
        });

        // 初始化过滤器和地图
        initializeFilters(data);
        filterData();
    })
    .catch(err => console.error('加载 geojson 数据时出错:', err));

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

// 预处理数据，去除 district 的前后空格
function preprocessData(data) {
    data.features.forEach(feature => {
        if (feature.properties && feature.properties.district) {
            feature.properties.district = feature.properties.district.trim();
        }
    });
}

// 初始化下拉菜单选项
function initializeFilters(data) {
    const districtFilter = document.getElementById('district-filter');
    const categoryFilter = document.getElementById('category-filter');

    if (!districtFilter || !categoryFilter) {
        console.error('下拉菜单元素未找到');
        return;
    }

    const districts = new Set();
    const categories = new Set();

    data.features.forEach(feature => {
        if (feature.properties && feature.properties.district) {
            districts.add(feature.properties.district.trim()); // 去除前后空格
        }
        if (feature.properties && feature.properties.category) {
            categories.add(feature.properties.category);
        }
    });

    console.log('提取的区域:', districts); // 调试信息
    console.log('提取的类别:', categories); // 调试信息

    // 对区域进行排序
    Array.from(districts).sort().forEach(district => {
        const option = document.createElement('option');
        option.value = district;
        option.textContent = district;
        districtFilter.appendChild(option);
    });

    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

// 获取按钮和过滤框元素
const toggleFilterButton = document.getElementById('toggle-filter');
const filtersContainer = document.getElementById('filters');

// 添加按钮点击事件监听器
toggleFilterButton.addEventListener('click', () => {
    filtersContainer.classList.toggle('hidden');
});
