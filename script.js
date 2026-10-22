const SUPABASE_URL = "https://yzrrgnejwmmcactlamjj.supabase.co";

const SUPABASE_KEY = "sb_publishable_tySZEfnlrpCUJoig7fG_tg_wrXOS9jz";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


const cena = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const renderizador = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
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


const luz = new THREE.DirectionalLight(
    0xffffff,
    2
);

luz.position.set(5, 3, 5);

cena.add(luz);

terra.rotation.y = -1.92;
terra.rotation.x = 0;


const luzAmbiente = new THREE.AmbientLight(
    0xffffff,
    0.3
);

cena.add(luzAmbiente);


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
                color: 0xEEA11D
            });

        const linha =
            new THREE.Line(
                geometria,
                material
            );

        terra.add(linha);

    });

}


const marcadoresCientistas = [];


function criarPontoCientista(cientista) {

    const geometriaPonto =
        new THREE.SphereGeometry(
            0.025,
            16,
            16
        );

    const materialPonto =
        new THREE.MeshBasicMaterial({
            color: 0xE8431A
        });

    const ponto =
        new THREE.Mesh(
            geometriaPonto,
            materialPonto
        );

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

    areaClique.userData.cientista =
        cientista;

    areaClique.userData.ponto = ponto;

    terra.add(areaClique);

    marcadoresCientistas.push(
        areaClique
    );

}


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


const raycaster =
    new THREE.Raycaster();

const mouse =
    new THREE.Vector2();


renderizador.domElement.addEventListener(
    "click",
    function(event) {

        if (houveArrasto) {

            houveArrasto = false;

            return;

        }

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


const RAIO_TERRA = 3;

let zMinimo = 4;
let zMaximo = 15;
let zPadrao = 8;
let orientacaoRetrato = null;


function definirZoom(z) {

    camera.position.z =
        Math.min(zMaximo, Math.max(zMinimo, z));

}


function calcularZoom() {

    const meia =
        Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));

    const retrato = camera.aspect < 1;

    const fracao = retrato ? 0.88 : 0.98;

    const k =
        fracao * Math.min(meia, meia * camera.aspect);

    const caber = Math.sqrt(
        RAIO_TERRA * RAIO_TERRA +
        (RAIO_TERRA / k) * (RAIO_TERRA / k)
    );

    zPadrao = Math.max(8, caber);

    zMaximo = Math.max(15, zPadrao * 1.2);

    return retrato;

}


function ajustarTamanho() {

    const largura = window.innerWidth;
    const altura = window.innerHeight;

    renderizador.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, 2)
    );

    renderizador.setSize(largura, altura);

    camera.aspect = largura / altura;
    camera.updateProjectionMatrix();

    const retrato = calcularZoom();

    if (retrato !== orientacaoRetrato) {

        orientacaoRetrato = retrato;
        camera.position.z = zPadrao;

    } else {

        definirZoom(camera.position.z);

    }

}


window.addEventListener("resize", ajustarTamanho);
window.addEventListener("orientationchange", ajustarTamanho);


const ponteiros = new Map();

let houveArrasto = false;

let inicioArrastoX = 0;
let inicioArrastoY = 0;

let distanciaPinca = 0;
let zInicialPinca = 0;


function distanciaEntrePonteiros() {

    const lista = Array.from(ponteiros.values());

    return Math.hypot(
        lista[0].x - lista[1].x,
        lista[0].y - lista[1].y
    );

}


renderizador.domElement.addEventListener(
    "pointerdown",
    function(event) {

        if (event.pointerType === "mouse" && event.button !== 0) {

            return;

        }

        renderizador.domElement.setPointerCapture(event.pointerId);

        ponteiros.set(
            event.pointerId,
            { x: event.clientX, y: event.clientY }
        );

        if (ponteiros.size === 1) {

            houveArrasto = false;

            inicioArrastoX = event.clientX;
            inicioArrastoY = event.clientY;

        }

        if (ponteiros.size === 2) {

            distanciaPinca = distanciaEntrePonteiros();
            zInicialPinca = camera.position.z;

            houveArrasto = true;

        }

    }
);


renderizador.domElement.addEventListener(
    "pointermove",
    function(event) {

        const anterior = ponteiros.get(event.pointerId);

        if (!anterior) {

            return;

        }

        const movimentoX = event.clientX - anterior.x;
        const movimentoY = event.clientY - anterior.y;

        anterior.x = event.clientX;
        anterior.y = event.clientY;

        if (ponteiros.size === 1) {

            const distanciaTotal = Math.hypot(
                event.clientX - inicioArrastoX,
                event.clientY - inicioArrastoY
            );

            if (distanciaTotal > 6) {

                houveArrasto = true;

            }

            if (houveArrasto) {

                terra.rotation.y += movimentoX * 0.005;
                terra.rotation.x += movimentoY * 0.005;

            }

        } else if (ponteiros.size === 2) {

            const distancia = distanciaEntrePonteiros();

            if (distancia > 0 && distanciaPinca > 0) {

                definirZoom(
                    zInicialPinca * distanciaPinca / distancia
                );

            }

        }

    }
);


function soltarPonteiro(event) {

    ponteiros.delete(event.pointerId);

    if (ponteiros.size === 1) {

        const restante = Array.from(ponteiros.values())[0];

        inicioArrastoX = restante.x;
        inicioArrastoY = restante.y;

    }

}


renderizador.domElement.addEventListener("pointerup", soltarPonteiro);
renderizador.domElement.addEventListener("pointercancel", soltarPonteiro);


renderizador.domElement.addEventListener(
    "wheel",
    function(event) {

        event.preventDefault();

        definirZoom(
            camera.position.z + event.deltaY * 0.01
        );

    },
    { passive: false }
);


const posicaoMarcador = new THREE.Vector3();


function atualizarMarcadores() {

    requestAnimationFrame(atualizarMarcadores);

    if (marcadoresCientistas.length === 0) {

        return;

    }

    const altura = renderizador.domElement.clientHeight;

    const meia =
        Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));

    const distancia =
        Math.max(camera.position.z - RAIO_TERRA, 1);

    const pxPorUnidade =
        altura / (2 * distancia * meia);

    const escalaPonto =
        Math.max(1, 4.5 / (0.025 * pxPorUnidade));

    const escalaToque =
        Math.max(1, 24 / (0.10 * pxPorUnidade));

    marcadoresCientistas.forEach(function(area) {

        area.scale.setScalar(escalaToque);

        if (area.userData.ponto) {

            area.userData.ponto.scale.setScalar(escalaPonto);

        }

        area.getWorldPosition(posicaoMarcador);

        const visivel =
            posicaoMarcador.dot(camera.position) >
            posicaoMarcador.lengthSq();

        area.layers.set(visivel ? 0 : 1);

    });

}

atualizarMarcadores();


const cardInfo = document.getElementById("infoCientista");

new MutationObserver(function() {

    document.body.classList.toggle(
        "card-aberto",
        cardInfo.style.display === "block"
    );

}).observe(cardInfo, {
    attributes: true,
    attributeFilter: ["style"]
});


ajustarTamanho();


function animar() {

    requestAnimationFrame(animar);

    renderizador.render(
        cena,
        camera
    );

}

animar();


carregarCientistas();


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
