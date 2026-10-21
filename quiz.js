(function () {

    const botaoAbrir = document.getElementById("abrirQuiz");
    const telaQuiz = document.getElementById("quiz");
    const botaoFechar = document.getElementById("fecharQuiz");
    const conteudo = document.getElementById("quizConteudo");

    let perguntas = null;
    let cientistas = [];
    let maximos = {};

    let indiceAtual = 0;
    let pontuacao = {};
    let respostasEscolhidas = [];

    function escapar(texto) {

        return String(texto === null || texto === undefined ? "" : texto)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");

    }

    function resumir(texto, limite) {

        texto = String(texto || "");

        if (texto.length <= limite) {
            return texto;
        }

        const corte = texto.lastIndexOf(". ", limite);

        if (corte > limite * 0.5) {
            return texto.slice(0, corte + 1);
        }

        return texto.slice(0, limite).trim() + "…";

    }

    function mostrarMensagem(texto, comBotaoTentar) {

        let html = '<p class="quiz-descricao">' + escapar(texto) + '</p>';

        if (comBotaoTentar) {
            html += '<button class="quiz-opcao" id="quizTentar">Tentar de novo</button>';
        }

        conteudo.innerHTML = html;

        if (comBotaoTentar) {
            document.getElementById("quizTentar").addEventListener("click", abrirQuiz);
        }

    }

    async function carregarDados() {

        const [respostaPerguntas, respostaCientistas] = await Promise.all([

            supabaseClient
                .from("quiz_perguntas")
                .select("id, texto, ordem, quiz_respostas(id, texto, ordem, quiz_pontos(cientista_id, pontos))")
                .order("ordem"),

            supabaseClient
                .from("cientistas")
                .select("*")

        ]);

        if (respostaPerguntas.error) {
            throw respostaPerguntas.error;
        }

        if (respostaCientistas.error) {
            throw respostaCientistas.error;
        }

        perguntas = respostaPerguntas.data
            .map(function (p) {

                return {
                    id: p.id,
                    texto: p.texto,
                    respostas: (p.quiz_respostas || [])
                        .slice()
                        .sort(function (a, b) {
                            return (a.ordem || 0) - (b.ordem || 0);
                        })
                        .map(function (r) {
                            return {
                                id: r.id,
                                texto: r.texto,
                                pontos: r.quiz_pontos || []
                            };
                        })
                };

            })
            .filter(function (p) {
                return p.respostas.length > 0;
            });

        if (perguntas.length === 0) {
            throw new Error("Nenhuma pergunta cadastrada.");
        }

        cientistas = respostaCientistas.data;

        calcularMaximos();

    }

    function calcularMaximos() {

        maximos = {};

        perguntas.forEach(function (pergunta) {

            const melhorDaPergunta = {};

            pergunta.respostas.forEach(function (resposta) {

                resposta.pontos.forEach(function (ponto) {

                    const id = String(ponto.cientista_id);

                    if (!melhorDaPergunta[id] || ponto.pontos > melhorDaPergunta[id]) {
                        melhorDaPergunta[id] = ponto.pontos;
                    }

                });

            });

            Object.keys(melhorDaPergunta).forEach(function (id) {
                maximos[id] = (maximos[id] || 0) + melhorDaPergunta[id];
            });

        });

    }

    function somarPontos(resposta) {

        resposta.pontos.forEach(function (ponto) {

            const id = String(ponto.cientista_id);

            pontuacao[id] = (pontuacao[id] || 0) + ponto.pontos;

        });

    }

    function iniciarQuiz() {

        indiceAtual = 0;
        respostasEscolhidas = [];
        pontuacao = {};

        mostrarPergunta();

    }

    function mostrarPergunta() {

        const pergunta = perguntas[indiceAtual];
        const total = perguntas.length;
        const progresso = (indiceAtual / total) * 100;

        let html = "";

        html += '<div class="quiz-barra"><div class="quiz-barra-preenchida" style="width:' + progresso + '%"></div></div>';
        html += '<p class="quiz-contador">Pergunta ' + (indiceAtual + 1) + ' de ' + total + '</p>';
        html += '<h2 class="quiz-pergunta">' + escapar(pergunta.texto) + '</h2>';
        html += '<div class="quiz-opcoes">';

        pergunta.respostas.forEach(function (resposta, i) {
            html += '<button class="quiz-opcao" data-indice="' + i + '">' + escapar(resposta.texto) + '</button>';
        });

        html += '</div>';

        if (indiceAtual > 0) {
            html += '<button class="quiz-secundario" id="quizVoltar">← Voltar</button>';
        }

        conteudo.innerHTML = html;

        conteudo.querySelectorAll(".quiz-opcao").forEach(function (botao) {
            botao.addEventListener("click", function () {
                escolherResposta(Number(botao.dataset.indice));
            });
        });

        const voltar = document.getElementById("quizVoltar");

        if (voltar) {
            voltar.addEventListener("click", voltarPergunta);
        }

    }

    function escolherResposta(indiceResposta) {

        const resposta = perguntas[indiceAtual].respostas[indiceResposta];

        respostasEscolhidas[indiceAtual] = indiceResposta;

        somarPontos(resposta);

        indiceAtual++;

        if (indiceAtual < perguntas.length) {
            mostrarPergunta();
        } else {
            mostrarResultado();
        }

    }

    function voltarPergunta() {

        indiceAtual--;

        pontuacao = {};

        for (let i = 0; i < indiceAtual; i++) {
            somarPontos(perguntas[i].respostas[respostasEscolhidas[i]]);
        }

        respostasEscolhidas.length = indiceAtual;

        mostrarPergunta();

    }

    function calcularRanking() {

        return cientistas
            .filter(function (c) {
                return maximos[String(c.id)] > 0;
            })
            .map(function (c) {

                const id = String(c.id);
                const pontos = pontuacao[id] || 0;

                return {
                    cientista: c,
                    pontos: pontos,
                    afinidade: Math.round((pontos / maximos[id]) * 100)
                };

            })
            .sort(function (a, b) {

                if (b.afinidade !== a.afinidade) {
                    return b.afinidade - a.afinidade;
                }

                return b.pontos - a.pontos;

            });

    }

    function mostrarResultado() {

        const ranking = calcularRanking();

        if (ranking.length === 0) {
            mostrarMensagem("Não foi possível calcular o resultado. Verifique se as respostas têm pontos ligados às cientistas.", false);
            return;
        }

        const vencedora = ranking[0];
        const c = vencedora.cientista;

        let html = "";

        html += '<div class="quiz-barra"><div class="quiz-barra-preenchida" style="width:100%"></div></div>';
        html += '<p class="quiz-contador">Seu resultado</p>';
        html += '<h2 class="quiz-pergunta">Você se parece com ' + escapar(c.nome) + '!</h2>';
        html += '<p class="quiz-afinidade">' + vencedora.afinidade + '% de afinidade</p>';
        html += '<p class="quiz-detalhe"><strong>País:</strong> ' + escapar(c.pais) + '</p>';
        html += '<p class="quiz-detalhe"><strong>Área:</strong> ' + escapar(c.area) + '</p>';
        html += '<p class="quiz-descricao">' + escapar(resumir(c.descricao, 380)) + '</p>';

        if (ranking.length > 1) {

            html += '<h3 class="quiz-subtitulo">Outras cientistas parecidas com você</h3>';

            ranking.slice(1, 3).forEach(function (item) {

                html += '<div class="quiz-ranking-item">';
                html += '<span>' + escapar(item.cientista.nome) + '</span>';
                html += '<span>' + item.afinidade + '%</span>';
                html += '</div>';

            });

        }

        html += '<div class="quiz-acoes">';

        if (encontrarMarcador(c)) {
            html += '<button class="quiz-opcao" id="quizVerGlobo">Ver no globo</button>';
        }

        html += '<button class="quiz-secundario" id="quizRefazer">Refazer o quiz</button>';
        html += '</div>';

        conteudo.innerHTML = html;

        document.getElementById("quizRefazer").addEventListener("click", iniciarQuiz);

        const verGlobo = document.getElementById("quizVerGlobo");

        if (verGlobo) {
            verGlobo.addEventListener("click", function () {
                fecharQuiz();
                irParaCientista(c);
            });
        }

    }

    function encontrarMarcador(cientista) {

        if (typeof marcadoresCientistas === "undefined") {
            return null;
        }

        for (let i = 0; i < marcadoresCientistas.length; i++) {

            const dados = marcadoresCientistas[i].userData.cientista;

            if (String(dados.id) === String(cientista.id)) {
                return marcadoresCientistas[i];
            }

        }

        return null;

    }

    let rotacaoAlvo = null;

    function irParaCientista(cientista) {

        const marcador = encontrarMarcador(cientista);

        if (!marcador) {
            return;
        }

        const direcao = marcador.position.clone().normalize();

        rotacaoAlvo = new THREE.Quaternion().setFromUnitVectors(
            direcao,
            new THREE.Vector3(0, 0, 1)
        );

        const c = marcador.userData.cientista;

        document.getElementById("nomeCientista").textContent = c.nome;
        document.getElementById("paisCientista").textContent = "País: " + c.pais;
        document.getElementById("areaCientista").textContent = "Área: " + c.area;
        document.getElementById("descricaoCientista").textContent = c.descricao;
        document.getElementById("resumoPaisCientista").textContent = c.resumo_pais;
        document.getElementById("infoCientista").style.display = "block";

    }

    function animarRotacao() {

        requestAnimationFrame(animarRotacao);

        if (!rotacaoAlvo) {
            return;
        }

        terra.quaternion.slerp(rotacaoAlvo, 0.08);

        if (terra.quaternion.angleTo(rotacaoAlvo) < 0.002) {

            terra.quaternion.copy(rotacaoAlvo);
            rotacaoAlvo = null;

        }

    }

    animarRotacao();

    renderizador.domElement.addEventListener("pointerdown", function () {
        rotacaoAlvo = null;
    });

    async function abrirQuiz() {

        telaQuiz.style.display = "flex";

        if (!perguntas) {

            mostrarMensagem("Carregando perguntas...", false);

            try {
                await carregarDados();
            } catch (erro) {

                console.error("Erro ao carregar o quiz:", erro);

                perguntas = null;

                mostrarMensagem("Não foi possível carregar o quiz. Verifique as tabelas no Supabase e tente de novo.", true);

                return;

            }

        }

        iniciarQuiz();

    }

    function fecharQuiz() {

        telaQuiz.style.display = "none";

    }

    botaoAbrir.addEventListener("click", abrirQuiz);
    botaoFechar.addEventListener("click", fecharQuiz);

    telaQuiz.addEventListener("click", function (event) {

        if (event.target === telaQuiz) {
            fecharQuiz();
        }

    });

})();
