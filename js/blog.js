// Contentful Configuration
const SPACE_ID = '4ixjtlu1qu2t';
const ACCESS_TOKEN = '_kWA034q-PDeVGw0OHOKw53huGv0B059HrMkbeJBz1I';

// Check if Contentful SDK is loaded
if (typeof contentful === 'undefined') {
	console.error('Contentful SDK not loaded. Please check the CDN link.');
}

// Initialize Contentful client
let client;
try {
	client = contentful.createClient({
		space: SPACE_ID,
		accessToken: ACCESS_TOKEN,
	});
} catch (error) {
	console.error('Error initializing Contentful client:', error);
}

// Helper function to format date
function formatDate(dateString) {
	const date = new Date(dateString);
	return date.toLocaleDateString('pl-PL', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
}

// Helper function to escape HTML
function escapeHtml(text) {
	if (!text) return '';
	const div = document.createElement('div');
	div.textContent = text;
	return div.innerHTML;
}

// Helper function to truncate text
function truncateText(text, maxLength = 200) {
	if (!text || text.length <= maxLength) return text;
	return text.substring(0, maxLength).trim() + '...';
}

// Helper function to process media (images or videos)
function processMedia(media) {
	if (!media) return '';
	
	// Handle array of media
	if (Array.isArray(media)) {
		return media.map(item => processMediaItem(item)).join('');
	}
	
	// Handle single media item
	return processMediaItem(media);
}

// Helper function to process a single media item
function processMediaItem(mediaItem) {
	if (!mediaItem) return '';
	
	// Check if it's a video (has file with video content type or video URL)
	if (mediaItem.fields && mediaItem.fields.file) {
		const file = mediaItem.fields.file;
		const contentType = file.contentType || '';
		const url = file.url || '';
		
		// Check if it's a video
		if (contentType.startsWith('video/') || url.match(/\.(mp4|webm|ogg|mov)$/i)) {
			const videoUrl = url.startsWith('//') ? `https:${url}` : url;
			const title = mediaItem.fields.title || '';
			return `
				<div class="blog-post__media blog-post__media--video">
					<video controls>
						<source src="${videoUrl}" type="${contentType}">
						Twoja przeglądarka nie obsługuje odtwarzania wideo.
					</video>
				</div>
			`;
		}
		
		// Otherwise treat as image
		const imageUrl = url.startsWith('//') ? `https:${url}` : url;
		const imageAlt = mediaItem.fields.title || mediaItem.fields.description || '';
		return `
			<div class="blog-post__media blog-post__media--image">
				<img src="${imageUrl}" alt="${imageAlt}">
			</div>
		`;
	}
	
	// Handle direct URL strings (for videos from external sources)
	if (typeof mediaItem === 'string') {
		// Check if it's a video URL
		if (mediaItem.match(/\.(mp4|webm|ogg|mov)$/i) || mediaItem.includes('youtube.com') || mediaItem.includes('youtu.be') || mediaItem.includes('vimeo.com')) {
			if (mediaItem.includes('youtube.com') || mediaItem.includes('youtu.be')) {
				// Extract YouTube video ID
				const videoId = mediaItem.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
				if (videoId) {
					return `
						<div class="blog-post__media blog-post__media--video">
							<iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
						</div>
					`;
				}
			} else if (mediaItem.includes('vimeo.com')) {
				// Extract Vimeo video ID
				const videoId = mediaItem.match(/vimeo\.com\/(\d+)/)?.[1];
				if (videoId) {
					return `
						<div class="blog-post__media blog-post__media--video">
							<iframe src="https://player.vimeo.com/video/${videoId}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
						</div>
					`;
				}
			} else {
				// Direct video URL
				return `
					<div class="blog-post__media blog-post__media--video">
						<video controls>
							<source src="${mediaItem}">
							Twoja przeglądarka nie obsługuje odtwarzania wideo.
						</video>
					</div>
				`;
			}
		} else {
			// Treat as image URL
			return `
				<div class="blog-post__media blog-post__media--image">
					<img src="${mediaItem}" alt="">
				</div>
			`;
		}
	}
	
	return '';
}

// Helper function to process Rich Text content from Contentful
function processRichText(richText) {
	if (!richText) return '';
	
	// If it's already a string, return it
	if (typeof richText === 'string') {
		return richText;
	}
	
	// If it's a Rich Text document, extract text content
	if (richText.nodeType === 'document' && richText.content) {
		return extractTextFromRichText(richText);
	}
	
	// If it's an object with content array
	if (richText.content && Array.isArray(richText.content)) {
		return extractTextFromRichText(richText);
	}
	
	return String(richText);
}

// Extract plain text from Contentful Rich Text
function extractTextFromRichText(node) {
	if (!node) return '';
	
	if (typeof node === 'string') {
		return node;
	}
	
	// Handle text nodes
	if (node.nodeType === 'text' || node.nodeType === 3) {
		return node.value || node.text || '';
	}
	
	// Handle document or block nodes with content
	if (node.content && Array.isArray(node.content)) {
		return node.content.map(extractTextFromRichText).join(' ');
	}
	
	// Handle nodes with value property
	if (node.value) {
		return node.value;
	}
	
	// Handle nodes with text property
	if (node.text) {
		return node.text;
	}
	
	return '';
}

// Fetch and display blog posts
document.addEventListener('DOMContentLoaded', async () => {
	const blogWrapper = document.querySelector('.blog__wrapper');
	
	if (!blogWrapper) return;

	if (!client) {
		blogWrapper.innerHTML = `
			<div class="blog__error">
				<h2>Błąd konfiguracji</h2>
				<p>Nie udało się połączyć z Contentful. Sprawdź konfigurację.</p>
			</div>
		`;
		return;
	}

	try {
		// Show loading state
		blogWrapper.innerHTML = '<div class="blog__loading">Ładowanie artykułów...</div>';

		// Fetch blog posts from Contentful with content type "blog"
		const response = await client.getEntries({
			content_type: 'blog',
			order: '-sys.createdAt',
			limit: 100,
		});

		const posts = response.items;

		if (posts.length === 0) {
			blogWrapper.innerHTML = `
				<div class="blog__empty">
					<h2>Brak artykułów</h2>
					<p>Obecnie nie ma dostępnych artykułów do wyświetlenia.</p>
				</div>
			`;
			return;
		}

		// Generate HTML for blog posts
		const postsHTML = posts.map((post, index) => {
			const fields = post.fields;
			
			// Get title, article, and media fields
			const title = fields.title || 'Bez tytułu';
			const article = fields.article || '';
			const media = fields.media || null;
			const publishDate = post.sys.createdAt;

			// Format date
			const formattedDate = formatDate(publishDate);

			// Process article content
			const fullArticle = processRichText(article);
			// Remove extra whitespace and normalize
			const cleanArticle = fullArticle.replace(/\s+/g, ' ').trim();
			const truncatedArticle = truncateText(cleanArticle, 200);
			const hasMoreContent = cleanArticle.length > 200;

			// Create unique ID for this post
			const postId = `blog-post-${index}`;

			return `
				<article class="blog-post" data-post-id="${postId}">
					<div class="blog-post__content">
						<div class="blog-post__meta">
							<time datetime="${publishDate}">${formattedDate}</time>
						</div>
						<h2 class="blog-post__title">${escapeHtml(title)}</h2>
						<div class="blog-post__article">
							<div class="blog-post__article-preview">
								${escapeHtml(truncatedArticle)}
							</div>
							${hasMoreContent ? `
								<div class="blog-post__article-full" style="display: none;">
									${processMedia(media)}
									<div class="blog-post__article-text">
										${escapeHtml(cleanArticle)}
									</div>
								</div>
								<button class="blog-post__read-more btn btn--primary" data-post="${postId}">
									Czytaj więcej
								</button>
								<button class="blog-post__read-less btn btn--primary" data-post="${postId}" style="display: none;">
									Czytaj mniej
								</button>
							` : ''}
						</div>
					</div>
				</article>
			`;
		}).join('');

		// Insert posts into the page
		blogWrapper.innerHTML = `
			<div class="blog__header">
				<h1 class="blog__title">Blog</h1>
				<p class="blog__subtitle">Artykuły i porady dotyczące fizjoterapii i zdrowia</p>
			</div>
			<div class="blog__posts">
				${postsHTML}
			</div>
		`;

		// Add event listeners for read more/less buttons
		const readMoreButtons = document.querySelectorAll('.blog-post__read-more');
		const readLessButtons = document.querySelectorAll('.blog-post__read-less');

		readMoreButtons.forEach(button => {
			button.addEventListener('click', function() {
				const postId = this.getAttribute('data-post');
				const post = document.querySelector(`[data-post-id="${postId}"]`);
				const preview = post.querySelector('.blog-post__article-preview');
				const full = post.querySelector('.blog-post__article-full');
				const readMore = post.querySelector('.blog-post__read-more');
				const readLess = post.querySelector('.blog-post__read-less');

				if (preview && full && readMore && readLess) {
					preview.style.display = 'none';
					full.style.display = 'block';
					readMore.style.display = 'none';
					readLess.style.display = 'inline-block';
					
					// Smooth scroll to top of article
					post.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}
			});
		});

		readLessButtons.forEach(button => {
			button.addEventListener('click', function() {
				const postId = this.getAttribute('data-post');
				const post = document.querySelector(`[data-post-id="${postId}"]`);
				const preview = post.querySelector('.blog-post__article-preview');
				const full = post.querySelector('.blog-post__article-full');
				const readMore = post.querySelector('.blog-post__read-more');
				const readLess = post.querySelector('.blog-post__read-less');

				if (preview && full && readMore && readLess) {
					preview.style.display = 'block';
					full.style.display = 'none';
					readMore.style.display = 'inline-block';
					readLess.style.display = 'none';
					
					// Smooth scroll to top of article
					post.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}
			});
		});

	} catch (error) {
		console.error('Error fetching blog posts:', error);
		blogWrapper.innerHTML = `
			<div class="blog__error">
				<h2>Wystąpił błąd</h2>
				<p>Nie udało się załadować artykułów. Spróbuj ponownie później.</p>
				<p style="margin-top: 1rem; font-size: 0.9rem; opacity: 0.7;">Błąd: ${error.message}</p>
			</div>
		`;
	}
});

