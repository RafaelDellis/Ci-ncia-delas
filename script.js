const SUPABASE_URL = "https://yzrrgnejwmmcactlamjj.supabase.co";

const SUPABASE_KEY = "sb_publishable_tySZEfnlrpCUJoig7fG_tg_wrXOS9jz";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// =========================
// CENA
// =========================

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


// =========================
// TERRA
// =========================

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


// =========================
// LUZES
// =========================

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


// =========================
// GEOJSON DA ÁFRICA
// =========================

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

        console.error(
            "ERRO AO CARREGAR O GEOJSON:",
            erro
        );

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
                -raio *
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
                color: 0xFFFFFF
            });

        const linha =
            new THREE.Line(
                geometria,
                material
            );

        terra.add(linha);

    });

}


// =========================
// MARCADORES
// =========================

const marcadoresCientistas = [];


function criarPontoCientista(cientista) {

    // Ponto vermelho visível

    const geometriaPonto =
        new THREE.SphereGeometry(
            0.025,
            16,
            16
        );

    const materialPonto =
        new THREE.MeshBasicMaterial({
            color: 0xff4444
        });

    const ponto =
        new THREE.Mesh(
            geometriaPonto,
            materialPonto
        );


    // Converter latitude e longitude

    const latitudeRad =
        cientista.latitude * Math.PI / 180;

    const longitudeRad =
        cientista.longitude * Math.PI / 180;

    const raioPonto = 3.08;


    ponto.position.x =
        raioPonto *
        Math.cos(latitudeRad) *
        Math.cos(longitudeRad);

    ponto.position.y =
        raioPonto *
        Math.sin(latitudeRad);

    ponto.position.z =
        -raioPonto *
        Math.cos(latitudeRad) *
        Math.sin(longitudeRad);


    terra.add(ponto);


    // Área invisível para facilitar o clique

    const areaClique =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.10,
                16,
                16
            ),
            new THREE.MeshBasicMaterial({
                transparent: true,
                opacity: 0
            })
        );


    areaClique.position.copy(
        ponto.position
    );


    // Guardar os dados da cientista

    areaClique.userData.cientista =
        cientista;


    terra.add(areaClique);


    // Guardar marcador na lista

    marcadoresCientistas.push(
        areaClique
    );

}


// =========================
// CARREGAR CIENTISTAS DO SUPABASE
// =========================

async function carregarCientistas() {

    const { data, error } =
        await supabaseClient
            .from("cientistas")
            .select("*");


    if (error) {

        console.error(
            "Erro ao carregar cientistas:",
            error
        );

        return;

    }


    console.log(
        "Cientistas carregadas:",
        data
    );


    data.forEach(function(cientista) {

        criarPontoCientista(
            cientista
        );

    });

}


// =========================
// CLIQUE NOS MARCADORES
// =========================

const raycaster =
    new THREE.Raycaster();

const mouse =
    new THREE.Vector2();


renderizador.domElement.addEventListener(
    "click",
    function(event) {

        const retangulo =
            renderizador.domElement.getBoundingClientRect();


        mouse.x =
            ((event.clientX - retangulo.left) /
            retangulo.width) * 2 - 1;


        mouse.y =
            -((event.clientY - retangulo.top) /
            retangulo.height) * 2 + 1;


        raycaster.setFromCamera(
            mouse,
            camera
        );


        const intersecoes =
            raycaster.intersectObjects(
                marcadoresCientistas
            );


        if (intersecoes.length > 0) {

            const cientista =
                intersecoes[0]
                    .object
                    .userData
                    .cientista;


            document.getElementById(
                "nomeCientista"
            ).textContent =
                cientista.nome;


            document.getElementById(
                "paisCientista"
            ).textContent =
                "País: " + cientista.pais;


            document.getElementById(
                "areaCientista"
            ).textContent =
                "Área: " + cientista.area;


            document.getElementById(
                "descricaoCientista"
            ).textContent =
                cientista.descricao;

            document.getElementById(
                "resumoPaisCientista"
            ).textContent =
                cientista.resumo_pais;


            document.getElementById(
                "infoCientista"
            ).style.display =
                "block";

        }

    }
);


// =========================
// MOUSE - ROTAÇÃO
// =========================

let arrastando = false;

let mouseX = 0;
let mouseY = 0;


renderizador.domElement.addEventListener(
    "mousedown",
    function(event) {

        arrastando = true;

        mouseX = event.clientX;
        mouseY = event.clientY;

    }
);


renderizador.domElement.addEventListener(
    "mouseup",
    function() {

        arrastando = false;

    }
);


renderizador.domElement.addEventListener(
    "mousemove",
    function(event) {

        if (!arrastando) {

            return;

        }


        const movimentoX =
            event.clientX - mouseX;

        const movimentoY =
            event.clientY - mouseY;


        terra.rotation.y +=
            movimentoX * 0.005;


        terra.rotation.x +=
            movimentoY * 0.005;


        mouseX = event.clientX;
        mouseY = event.clientY;

    }
);


// =========================
// ZOOM
// =========================

renderizador.domElement.addEventListener(
    "wheel",
    function(event) {

        camera.position.z +=
            event.deltaY * 0.01;


        if (camera.position.z < 4) {

            camera.position.z = 4;

        }


        if (camera.position.z > 15) {

            camera.position.z = 15;

        }

    }
);


// =========================
// CÂMERA
// =========================

camera.position.z = 8;


// =========================
// ANIMAÇÃO
// =========================

function animar() {

    requestAnimationFrame(animar);

    renderizador.render(
        cena,
        camera
    );

}

animar();


// =========================
// CARREGAR DADOS
// =========================

carregarCientistas();


// =========================
// FECHAR CARD
// =========================

document.getElementById(
    "fecharInfo"
).addEventListener(
    "click",
    function() {

        document.getElementById(
            "infoCientista"
        ).style.display = "none";

    }
);