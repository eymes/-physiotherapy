// Dane usług - 10 pozycji
const servicesData = [
	{
		id: 1,
		name: "Terapia manualna",
		time: 60,
		price: 200,
		description: "Kompleksowa terapia manualna obejmująca techniki mobilizacji i manipulacji stawów, masaż tkanek głębokich oraz pracę z punktami spustowymi. Skierowana do osób z bólami kręgosłupa, stawów oraz napięciami mięśniowymi."
	},
	{
		id: 2,
		name: "Fizjoterapia pourazowa",
		time: 45,
		price: 180,
		description: "Specjalistyczna rehabilitacja po urazach, złamaniach i operacjach. Program dostosowany indywidualnie do rodzaju urazu i etapu gojenia, z naciskiem na bezpieczny powrót do pełnej sprawności."
	},
	{
		id: 3,
		name: "Terapia bólu przewlekłego",
		time: 60,
		price: 220,
		description: "Kompleksowe podejście do leczenia bólu przewlekłego z wykorzystaniem technik manualnych, edukacji pacjenta oraz strategii radzenia sobie z bólem. Skierowana do osób zmagających się z długotrwałymi dolegliwościami bólowymi."
	},
	{
		id: 4,
		name: "Rehabilitacja sportowa",
		time: 50,
		price: 200,
		description: "Specjalistyczna rehabilitacja dla sportowców po kontuzjach oraz profilaktyka urazów. Obejmuje ocenę biomechaniczną, trening funkcjonalny i przygotowanie do powrotu do aktywności sportowej."
	},
	{
		id: 5,
		name: "Terapia stawu skroniowo-żuchwowego",
		time: 45,
		price: 180,
		description: "Leczenie dysfunkcji stawu skroniowo-żuchwowego, bólów głowy pochodzenia mięśniowego oraz problemów z żuciem. Wykorzystanie technik manualnych i ćwiczeń terapeutycznych."
	},
	{
		id: 6,
		name: "Fizjoterapia kobiet w ciąży",
		time: 60,
		price: 200,
		description: "Specjalistyczna opieka fizjoterapeutyczna dla kobiet w ciąży i po porodzie. Terapia bólów kręgosłupa, przygotowanie do porodu oraz rehabilitacja mięśni dna miednicy."
	},
	{
		id: 7,
		name: "Terapia manualna kręgosłupa",
		time: 60,
		price: 220,
		description: "Zaawansowane techniki manualne skierowane na leczenie dysfunkcji kręgosłupa szyjnego, piersiowego i lędźwiowego. Mobilizacje, manipulacje oraz terapia tkanek miękkich."
	},
	{
		id: 8,
		name: "Rehabilitacja neurologiczna",
		time: 60,
		price: 200,
		description: "Kompleksowa rehabilitacja dla pacjentów po udarach, urazach neurologicznych oraz z chorobami neurodegeneracyjnymi. Praca nad przywróceniem funkcji ruchowych i poprawą jakości życia."
	},
	{
		id: 9,
		name: "Terapia powięziowa",
		time: 50,
		price: 190,
		description: "Specjalistyczna terapia powięziowa z wykorzystaniem technik rozluźniania mięśniowo-powięziowego. Skuteczna w leczeniu bólów mięśniowych, ograniczeń ruchomości i napięć."
	},
	{
		id: 10,
		name: "Konsultacja fizjoterapeutyczna",
		time: 30,
		price: 120,
		description: "Kompleksowa ocena stanu zdrowia, analiza postawy ciała oraz konsultacja dotycząca problemów bólowych. Opracowanie indywidualnego planu terapii i zaleceń terapeutycznych."
	}
];

// Funkcja escape HTML
function escapeHtml(text) {
	if (!text) return "";
	const div = document.createElement("div");
	div.textContent = text;
	return div.innerHTML;
}

// Funkcja generująca HTML karty
function createServiceCard(service) {
	return `
		<article class="service-card" data-service-id="${service.id}">
			<div class="service-card__badge">
				<div class="service-card__badge-content">
					<span class="service-card__price">${service.price} zł</span>
					<span class="service-card__time">${service.time} min</span>
				</div>
			</div>
			<div class="service-card__content">
				<h3 class="service-card__title">${escapeHtml(service.name)}</h3>
				<button class="service-card__btn" data-service-id="${service.id}" aria-label="Pokaż opis usługi ${escapeHtml(service.name)}">
					Opis <span class="service-card__btn-arrow">→</span>
				</button>
			</div>
		</article>
	`;
}

// Funkcja renderująca opis (obsługa HTML)
function renderDescription(description) {
	if (typeof description === "string" && description.includes("<")) {
		return description;
	}
	return escapeHtml(description);
}

// Funkcja otwierająca modal
function openModal(service) {
	const modal = document.getElementById("serviceModal");
	const modalTitle = document.getElementById("modalTitle");
	const modalDescription = document.getElementById("modalDescription");
	const modalOverlay = document.getElementById("modalOverlay");

	if (!modal || !modalTitle || !modalDescription || !modalOverlay) return;

	modalTitle.textContent = service.name;
	modalDescription.innerHTML = renderDescription(service.description);

	modal.classList.add("active");
	modalOverlay.classList.add("active");
	document.body.classList.add("no-scroll");

	const closeBtn = modal.querySelector(".modal__close");
	if (closeBtn) {
		setTimeout(() => closeBtn.focus(), 100);
	}
}

// Funkcja zamykająca modal
function closeModal() {
	const modal = document.getElementById("serviceModal");
	const modalOverlay = document.getElementById("modalOverlay");

	if (modal) modal.classList.remove("active");
	if (modalOverlay) modalOverlay.classList.remove("active");
	document.body.classList.remove("no-scroll");
}

// Inicjalizacja po załadowaniu DOM
document.addEventListener("DOMContentLoaded", () => {
	const uslugiWrapper = document.querySelector(".uslugi__wrapper");

	if (!uslugiWrapper) return;

	// Generuj HTML dla wszystkich kart
	const cardsHTML = servicesData.map(service => createServiceCard(service)).join("");

	// Wstaw karty do wrappera
	uslugiWrapper.innerHTML = `
		<div class="uslugi__grid">
			${cardsHTML}
		</div>
	`;

	// Dodaj event listenery do przycisków "Opis"
	const descriptionButtons = document.querySelectorAll(".service-card__btn");
	descriptionButtons.forEach(button => {
		button.addEventListener("click", (e) => {
			e.preventDefault();
			const serviceId = parseInt(button.getAttribute("data-service-id"));
			const service = servicesData.find(s => s.id === serviceId);
			if (service) {
				openModal(service);
			}
		});
	});

	// Obsługa zamykania modala
	const closeBtn = document.querySelector(".modal__close");
	const modalOverlay = document.getElementById("modalOverlay");

	if (closeBtn) {
		closeBtn.addEventListener("click", closeModal);
	}

	if (modalOverlay) {
		modalOverlay.addEventListener("click", closeModal);
	}

	// Zamykanie modala klawiszem ESC
	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape") {
			const modal = document.getElementById("serviceModal");
			if (modal && modal.classList.contains("active")) {
				closeModal();
			}
		}
	});
});
