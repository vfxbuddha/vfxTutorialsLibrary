document.addEventListener('DOMContentLoaded', () => {
    // Load data and display content for the current page
    const loadContent = async () => {
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            routeContent(data);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    // Router function to determine which content to render based on the page
    const routeContent = (data) => {
        const bodyId = document.body.id;

        switch (bodyId) {
            case 'home-page':
                populateHomePage(data);
                break;
            case 'video-tutorials-page':
                populateCardContainer(data.videoTutorials, '#video-tutorials .card-container');
                break;
            case 'article-tutorials-page':
                populateCardContainer(data.articleTutorials, '#article-tutorials .card-container');
                break;
            case 'blog-page':
                populateCardContainer(data.myBlog, '#my-blog .card-container');
                break;
        }
    };

    // Populate the home page with the latest items from each section
    const populateHomePage = (data) => {
        // Display only the latest 3 items for each section
        populateCardContainer(data.videoTutorials.slice(0, 3), '#home-video-tutorials');
        populateCardContainer(data.articleTutorials.slice(0, 3), '#home-article-tutorials');
        populateCardContainer(data.myBlog.slice(0, 3), '#home-my-blog');
    };

    // Create and populate content cards in the specified container
    const populateCardContainer = (items, containerSelector) => {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        container.innerHTML = ''; // Clear existing content
        if (!items || items.length === 0) {
            container.innerHTML = '<p class="no-content">No content to display.</p>';
            return;
        }

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <a href="${item.url}" target="_blank" rel="noopener noreferrer">
                    <div class="card-image-container">
                        <img src="${item.imageUrl}" alt="${item.title}" loading="lazy">
                    </div>
                    <div class="card-content">
                        <h3>${item.title}</h3>
                        <p>${item.description}</p>
                        <span class="card-source">Source: ${item.source}</span>
                    </div>
                </a>
            `;
            container.appendChild(card);
        });
    };

    // Initial content load
    loadContent();
});
