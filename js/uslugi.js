// Contentful Configuration
const SPACE_ID = "4ixjtlu1qu2t";
const ACCESS_TOKEN = "_kWA034q-PDeVGw0OHOKw53huGv0B059HrMkbeJBz1I";

// Check if Contentful SDK is loaded
if (typeof contentful === "undefined") {
	console.error("Contentful SDK not loaded. Please check the CDN link.");
}

// Initialize Contentful client
let client;
try {
	client = contentful.createClient({
		space: SPACE_ID,
		accessToken: ACCESS_TOKEN,
	});
} catch (error) {
	console.error("Error initializing Contentful client:", error);
}

// Helper function to escape HTML
function escapeHtml(text) {
	if (!text) return "";
	const div = document.createElement("div");
	div.textContent = text;
	return div.innerHTML;
}

// Helper function to extract plain text from Rich Text
function extractTextFromRichText(node) {
	if (!node) return "";

	if (typeof node === "string") {
		return node;
	}

	// Handle text nodes
	if (node.nodeType === "text") {
		return node.value || "";
	}

	// Handle document or block nodes with content
	if (node.content && Array.isArray(node.content)) {
		return node.content.map(extractTextFromRichText).join(" ");
	}

	return "";
}

// Fetch and display services
document.addEventListener("DOMContentLoaded", async () => {
	const uslugiWrapper = document.querySelector(".uslugi__wrapper");

	if (!uslugiWrapper) return;

	if (!client) {
		uslugiWrapper.innerHTML = `
			<div class="uslugi__error">
				<h2>Błąd konfiguracji</h2>
				<p>Nie udało się połączyć z Contentful. Sprawdź konfigurację.</p>
			</div>
		`;
		return;
	}

	try {
		// Show loading state
		uslugiWrapper.innerHTML =
			'<div class="uslugi__loading">Ładowanie usług...</div>';

		// Fetch services from Contentful with content type "service"
		const response = await client.getEntries({
			content_type: "service",
			order: "sys.createdAt",
			limit: 100,
		});

		const services = response.items;

		if (services.length === 0) {
			uslugiWrapper.innerHTML = `
				<div class="uslugi__empty">
					<h2>Brak usług</h2>
					<p>Obecnie nie ma dostępnych usług do wyświetlenia.</p>
				</div>
			`;
			return;
		}

		// Generate HTML for services
		const servicesHTML = services
			.map((service, index) => {
				const fields = service.fields;

				// Get service fields
				const name = fields.name || "Bez nazwy";
				const description = fields.description || "";
				const cost = fields.cost || 0;
				const time = fields.time || 0;

				// Process description content - for now use plain text, rich text support to be added
				let descriptionHTML = "";
				if (description) {
					// Check if it's a Rich Text document (has nodeType and content)
					if (description.nodeType === "document" && description.content) {
						// Rich Text field - convert to plain text for now
						descriptionHTML = escapeHtml(extractTextFromRichText(description));
					} else if (typeof description === "string") {
						// Plain text field
						descriptionHTML = escapeHtml(description);
					} else {
						// Fallback
						descriptionHTML = escapeHtml(String(description));
					}
				}

				// Create unique ID for this service
				const serviceId = `service-${index}`;

				return `
				<article class="service-box" data-service-id="${serviceId}">
					<div class="service-box__header">
						<div class="service-box__header-left">
							<h2 class="service-box__title">${escapeHtml(name)}</h2>
							<span class="service-box__toggle" aria-expanded="false">Opis*</span>
							<div class="service-box__description" aria-hidden="true">${descriptionHTML}</div>
						</div>
						<div class="service-box__meta">
							<span class="service-box__cost">${cost} zł</span>
							<span class="service-box__time">${time} min</span>
						</div>
					</div>
				</article>
			`;
			})
			.join("");

		// Insert services into the page
		uslugiWrapper.innerHTML = `
			<div class="uslugi__services">
				${servicesHTML}
			</div>
		`;

		// Force hide descriptions initially
		const descriptions = document.querySelectorAll(".service-box__description");
		descriptions.forEach((desc) => {
			desc.style.maxHeight = "0";
			desc.style.opacity = "0";
		});

		// Add toggle functionality for service descriptions
		const toggleButtons = document.querySelectorAll(".service-box__toggle");
		toggleButtons.forEach((button) => {
			button.addEventListener("click", () => {
				const serviceBox = button.closest(".service-box");
				const description = serviceBox.querySelector(
					".service-box__description"
				);
				const isExpanded = button.getAttribute("aria-expanded") === "true";

				if (isExpanded) {
					// Collapse
					description.setAttribute("aria-hidden", "true");
					button.setAttribute("aria-expanded", "false");
					description.style.maxHeight = "0";
					description.style.opacity = "0";
				} else {
					// Expand
					description.setAttribute("aria-hidden", "false");
					button.setAttribute("aria-expanded", "true");
					description.style.maxHeight = description.scrollHeight + "px";
					description.style.opacity = "1";
				}
			});
		});
	} catch (error) {
		console.error("Error fetching services:", error);
		uslugiWrapper.innerHTML = `
			<div class="uslugi__error">
				<h2>Wystąpił błąd</h2>
				<p>Nie udało się załadować usług. Spróbuj ponownie później.</p>
				<p style="margin-top: 1rem; font-size: 0.9rem; opacity: 0.7;">Błąd: ${error.message}</p>
			</div>
		`;
	}
});
A