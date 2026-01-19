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

// Helper function to escape HTML (for simple text fields)
function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// Helper function to render Contentful Rich Text to HTML
// This converts the "tree" of data into real HTML tags
function renderRichText(node) {
    if (!node) return '';
    if (typeof node === 'string') return node;

    // Handle Text Nodes (bold, italic, etc.)
    if (node.nodeType === 'text') {
        let text = escapeHtml(node.value || '');
        if (node.marks) {
            node.marks.forEach(mark => {
                if (mark.type === 'bold') text = `<strong>${text}</strong>`;
                if (mark.type === 'italic') text = `<em>${text}</em>`;
                if (mark.type === 'underline') text = `<u>${text}</u>`;
                if (mark.type === 'code') text = `<code>${text}</code>`;
            });
        }
        return text;
    }

    // Process children recursively
    const content = node.content ? node.content.map(child => renderRichText(child)).join('') : '';

    // Map Contentful nodes to HTML tags
    switch (node.nodeType) {
        case 'document': return content;
        case 'paragraph': return `<p>${content}</p>`;
        case 'heading-1': return `<h3>${content}</h3>`;
        case 'heading-2': return `<h4>${content}</h4>`;
        case 'heading-3': return `<h5>${content}</h5>`;
        case 'heading-4': return `<h6>${content}</h6>`;
        case 'heading-5': return `<h6>${content}</h6>`;
        case 'heading-6': return `<h6>${content}</h6>`;
        case 'unordered-list': return `<ul>${content}</ul>`;
        case 'ordered-list': return `<ol>${content}</ol>`;
        case 'list-item': return `<li>${content}</li>`;
        case 'blockquote': return `<blockquote>${content}</blockquote>`;
        case 'hr': return '<hr />';
        case 'hyperlink':
            const uri = node.data && node.data.uri ? node.data.uri : '#';
            return `<a href="${uri}" target="_blank" rel="noopener noreferrer">${content}</a>`;
        default: return content;
    }
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
        uslugiWrapper.innerHTML = '<div class="uslugi__loading">Ładowanie usług...</div>';

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
        const servicesHTML = services.map((service, index) => {
                const fields = service.fields;

                // Get service fields
                const name = fields.name || "Bez nazwy";
                const description = fields.description || "";
                const cost = fields.cost || 0;
                const time = fields.time || 0;

                // Process description content using Rich Text Renderer
                let descriptionHTML = renderRichText(description);

                // Create unique ID for this service
                const serviceId = `service-${index}`;

                return `
                <article class="service-box" data-service-id="${serviceId}">
                    <div class="service-box__header">
                        <div class="service-box__header-left" style="flex: 1;">
                            <h2 class="service-box__title">${escapeHtml(name)}</h2>
                            <span class="service-box__toggle" role="button" tabindex="0" aria-expanded="false">Pokaż opis</span>
                            <div class="service-box__description" aria-hidden="true">
                                ${descriptionHTML}
                            </div>
                        </div>
                        <div class="service-box__meta">
                            <span class="service-box__cost">${cost} zł</span>
                            <span class="service-box__time">${time} min</span>
                        </div>
                    </div>
                </article>
            `;
            }).join("");

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
            desc.style.overflow = "hidden";
        });

        // Add toggle functionality for service descriptions
        const toggleButtons = document.querySelectorAll(".service-box__toggle");
        toggleButtons.forEach((button) => {
            button.addEventListener("click", (e) => {
                e.preventDefault();
                const wrapper = button.parentElement; // Get parent container
                const description = wrapper.querySelector(".service-box__description");
                const isExpanded = button.getAttribute("aria-expanded") === "true";

                if (isExpanded) {
                    // Collapse
                    description.setAttribute("aria-hidden", "true");
                    button.setAttribute("aria-expanded", "false");
                    button.textContent = "Pokaż opis";
                    description.style.maxHeight = "0";
                    description.style.opacity = "0";
                    description.style.marginTop = "0"; // Remove margin when hidden
                } else {
                    // Expand
                    description.setAttribute("aria-hidden", "false");
                    button.setAttribute("aria-expanded", "true");
                    button.textContent = "Ukryj opis";
                    description.style.maxHeight = description.scrollHeight + "px";
                    description.style.opacity = "1";
                    description.style.marginTop = "1rem"; // Add margin when visible
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