class Carta extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="styles.css">
            <div class="carta"></div>
        `;
    }

    set valor(carta) {
        const cartaDiv = this.shadowRoot.querySelector('.carta');
        cartaDiv.textContent = `${carta.valor} ${carta.palo}`;
        cartaDiv.style.color = (carta.palo === '♥' || carta.palo === '♦') ? 'red' : 'black';
    }
}
customElements.define('carta-element', Carta);

const inicio = document.getElementById("inicio");
const juego = document.getElementById("juego");
const mensajeFinal = document.getElementById("mensaje-final");
const dealerCards = document.getElementById("dealer-cards");
const playerCards = document.getElementById("player-cards");
const btnJugar = document.getElementById("btn-jugar");
const btnPedir = document.getElementById("btn-pedir");
const btnPlantar = document.getElementById("btn-plantar");

let mazo = [];
let manoJugador = [];
let manoDealer = [];

function crearMazo() {
    const palos = ['♠', '♥', '♦', '♣'];
    const valores = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    mazo = [];
    for (let palo of palos) {
        for (let valor of valores) {
            mazo.push({ valor, palo });
        }
    }
    mazo = mazo.sort(() => Math.random() - 0.5);
}

function calcularPuntos(mano) {
    let puntos = 0;
    let ases = 0;
    mano.forEach(carta => {
        if (['J', 'Q', 'K'].includes(carta.valor)) {
            puntos += 10;
        } else if (carta.valor === 'A') {
            ases++;
            puntos += 11;
        } else {
            puntos += parseInt(carta.valor);
        }
    });
    while (puntos > 21 && ases > 0) {
        puntos -= 10;
        ases--;
    }
    return puntos;
}

function repartirCarta(destino) {
    return new Promise((resolve) => {
        setTimeout(() => {
            let carta = mazo.pop();
            destino.push(carta);
            renderizarCartas();
            resolve();
        }, 500);
    });
}

function renderizarCartas(revelarDealer = false) {
    dealerCards.innerHTML = '';
    playerCards.innerHTML = '';
    
    manoDealer.forEach((carta, index) => {
        let elemento = document.createElement('carta-element');
        if (index === 0 && !revelarDealer) {
            elemento.valor = { valor: ' ', palo: ' ' };
            elemento.shadowRoot.querySelector('.carta').classList.add('volteada');
        } else {
            elemento.valor = carta;
        }
        dealerCards.appendChild(elemento);
    });
    
    manoJugador.forEach(carta => {
        let elemento = document.createElement('carta-element');
        elemento.valor = carta;
        playerCards.appendChild(elemento);
    });
}

async function iniciarJuego() {
    console.log("Función iniciarJuego ejecutada"); // Mensaje de depuración
    inicio.style.display = 'none';
    juego.style.display = 'block';
    mensajeFinal.textContent = '';
    btnPedir.disabled = false;
    btnPlantar.disabled = false;
    crearMazo();
    manoJugador = [];
    manoDealer = [];
    await repartirCarta(manoJugador);
    await repartirCarta(manoDealer);
    await repartirCarta(manoJugador);
    await repartirCarta(manoDealer);
    verificarJuego();
}

function verificarJuego() {
    let puntosJugador = calcularPuntos(manoJugador);
    if (puntosJugador === 21 && manoJugador.length === 2) {
        mensajeFinal.textContent = "¡Blackjack! ¡Has ganado!";
        btnPedir.disabled = true;
        btnPlantar.disabled = true;
    } else if (puntosJugador > 21) {
        mensajeFinal.textContent = "Te pasaste de 21. ¡Has perdido!";
        btnPedir.disabled = true;
        btnPlantar.disabled = true;
    }
}

function turnoCrupier() {
    return new Promise(async (resolve) => {
        while (calcularPuntos(manoDealer) < 17) {
            await repartirCarta(manoDealer);
        }
        resolve();
    });
}

async function finalizarJuego() {
    btnPedir.disabled = true;
    btnPlantar.disabled = true;
    await turnoCrupier();
    renderizarCartas(true);
    let puntosJugador = calcularPuntos(manoJugador);
    let puntosDealer = calcularPuntos(manoDealer);
    if (puntosDealer > 21 || puntosJugador > puntosDealer) {
        mensajeFinal.textContent = "¡Has ganado!";
    } else if (puntosJugador < puntosDealer) {
        mensajeFinal.textContent = "El crupier gana.";
    } else {
        mensajeFinal.textContent = "Empate.";
    }
}

btnJugar.addEventListener("click", () => {
    console.log("Botón Jugar clickeado"); // Mensaje de depuración
    iniciarJuego();
});

btnPedir.addEventListener("click", async () => {
    await repartirCarta(manoJugador);
    verificarJuego();
});

btnPlantar.addEventListener("click", finalizarJuego);