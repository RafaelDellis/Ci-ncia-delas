const cena = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const renderizador = new THREE.WebGLRenderer({
    antialias: true
});

renderizador.setSize(
    window.innerWidth,
    window.innerHeight
);

document.getElementById("globo").appendChild(
    renderizador.domElement
);

const geometria = new THREE.SphereGeometry(
    3,
    64,
    64
);

const textura = new THREE.TextureLoader().load(
    "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg"
);

const material = new THREE.MeshStandardMaterial({
    map: textura
});

const terra = new THREE.Mesh(
    geometria,
    material
);

cena.add(terra);

fetch("africa.geojson")
    .then(function(resposta) {

        console.log("Arquivo encontrado:", resposta);

        return resposta.json();
    })
    .then(function(dados) {

        console.log("GeoJSON carregado:", dados);

        dados.features.forEach(function(pais) {

            const tipo = pais.geometry.type;
            const coordenadas = pais.geometry.coordinates;

            if (tipo === "Polygon") {
                desenharPais(coordenadas);
            }

            if (tipo === "MultiPolygon") {

                coordenadas.forEach(function(poligono) {
                    desenharPais(poligono);
                });

            }

        });

    })
    .catch(function(erro) {

        console.error("ERRO AO CARREGAR O GEOJSON:", erro);

    });
    function desenharPais(poligono) {

    poligono.forEach(function(contorno) {

        const pontos = [];

        contorno.forEach(function(coordenada) {

            const longitude = coordenada[0];
            const latitude = coordenada[1];

            const longitudeRad =
                longitude * Math.PI / 180;

            const latitudeRad =
                latitude * Math.PI / 180;

            const raio = 3.02;

            const x =
                raio *
                Math.cos(latitudeRad) *
                Math.cos(longitudeRad);

            const y =
                raio *
                Math.sin(latitudeRad);

            const z =
                raio *
                Math.cos(latitudeRad) *
                Math.sin(longitudeRad);

            pontos.push(
                new THREE.Vector3(x, y, z)
            );

        });

        const geometria =
            new THREE.BufferGeometry();

        geometria.setFromPoints(pontos);

        const material =
            new THREE.LineBasicMaterial({
                color: 0x00ff88
            });

        const linha =
            new THREE.Line(
                geometria,
                material
            );

        terra.add(linha);

    });

}

let arrastando = false;
let mouseX = 0;
let mouseY = 0;

let velocidadeX = 0;
let velocidadeY = 0;

renderizador.domElement.addEventListener("mousedown", function(event) {

    arrastando = true;

    mouseX = event.clientX;
    mouseY = event.clientY;

});

renderizador.domElement.addEventListener("mouseup", function() {

    arrastando = false;

});

renderizador.domElement.addEventListener("mousemove", function(event) {

    if (!arrastando) {
        return;
    }

    const movimentoX = event.clientX - mouseX;
    const movimentoY = event.clientY - mouseY;

    terra.rotation.y += movimentoX * 0.005;
    terra.rotation.x += movimentoY * 0.005;

    mouseX = event.clientX;
    mouseY = event.clientY;

});

renderizador.domElement.addEventListener("wheel", function(event) {

    camera.position.z += event.deltaY * 0.01;

    if (camera.position.z < 4) {
        camera.position.z = 4;
    }

    if (camera.position.z > 15) {
        camera.position.z = 15;
    }

});



camera.position.z = 8;

const luz = new THREE.DirectionalLight(
    0xffffff,
    2
);

luz.position.set(5, 3, 5);

cena.add(luz);

const luzAmbiente = new THREE.AmbientLight(
    0xffffff,
    0.3
);

cena.add(luzAmbiente);

function animar() {

    requestAnimationFrame(animar);

    

    renderizador.render(
        cena,
        camera
    );
}

animar();