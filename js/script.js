document.addEventListener("DOMContentLoaded", () => {
	const hamburger = document.getElementById("hamburger");
	const navMenu = document.getElementById("navMenu");
	const overlay = document.getElementById("overlay");
	const body = document.body;

	const toggleMenu = () => {
		navMenu.classList.toggle("active");
		overlay.classList.toggle("active");
		body.classList.toggle("no-scroll");
		// toggle hamburger X state and update accessibility attr
		hamburger.classList.toggle("active");
		hamburger.setAttribute(
			"aria-expanded",
			navMenu.classList.contains("active") ? "true" : "false"
		);
	};

	hamburger.addEventListener("click", toggleMenu);

	// Zamknij menu po kliknięciu w przyciemnienie
	overlay.addEventListener("click", toggleMenu);

	// Handle anchor clicks: smooth scroll with offset (navbar height + section padding)
	const navLinks = document.querySelectorAll(".nav-menu a");
	function scrollToSectionAndOffset(hash) {
		if (!hash || hash === "#") return;
		const target = document.querySelector(hash);
		if (!target) return;
		const header = document.querySelector(".navbar");
		const headerHeight = header ? header.offsetHeight : 0;
		const compStyle = getComputedStyle(target);
		const paddingTop = parseFloat(compStyle.paddingTop) || 0;
		// Add a small extra offset on larger screens so the section sits a bit lower
		const extraOffset = window.innerWidth >= 1200 ? 64 : 36; // px (increased slightly)
		let top;
		if (hash === "#home") {
			// For home section, scroll to the very top without offset
			top = 0;
		} else {
			top =
				target.getBoundingClientRect().top +
				window.pageYOffset -
				headerHeight -
				paddingTop +
				extraOffset;
		}
		window.scrollTo({ top, behavior: "smooth" });
	}

	navLinks.forEach((link) => {
		link.addEventListener("click", (e) => {
			const href = link.getAttribute("href");
			if (href && href.startsWith("#")) {
				const isDesktop = window.innerWidth >= 992; // match CSS desktop breakpoint
				if (!isDesktop) {
					// on mobile keep native behavior: close menu if open and allow default jump
					if (navMenu.classList.contains("active")) {
						toggleMenu();
					}
					if (href === "#home") {
						// For home on mobile, scroll to top instead of default jump
						e.preventDefault();
						window.scrollTo({ top: 0, behavior: "smooth" });
					}
					return; // don't preventDefault for other links
				}
				// Desktop/tablet: smooth offset scrolling
				e.preventDefault();
				const perform = () => scrollToSectionAndOffset(href);
				if (navMenu.classList.contains("active")) {
					toggleMenu();
					setTimeout(perform, 250);
				} else {
					perform();
				}
			}
		});
	});

	// Also handle other in-page anchor links (e.g., hero button) using same offset rules
	const pageAnchors = document.querySelectorAll(
		'a[href^="#"]:not(.nav-menu a)'
	);
	pageAnchors.forEach((link) => {
		link.addEventListener("click", (e) => {
			const href = link.getAttribute("href");
			if (href && href.startsWith("#")) {
				const isDesktop = window.innerWidth >= 992;
				if (!isDesktop) {
					// on mobile keep native behavior: close menu if open and allow default jump
					if (navMenu.classList.contains("active")) {
						toggleMenu();
					}
					return; // don't preventDefault
				}
				// Desktop/tablet: smooth offset scrolling
				e.preventDefault();
				scrollToSectionAndOffset(href);
			}
		});
	});

	// If page loads with a hash, adjust scroll after load (desktop only)
	if (window.location.hash && window.innerWidth >= 992) {
		setTimeout(() => scrollToSectionAndOffset(window.location.hash), 100);
	}
});
