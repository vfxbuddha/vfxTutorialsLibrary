
document.addEventListener('DOMContentLoaded', () => {
    const bodyId = document.body.id;

    const fetchData = async (url) => {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error loading data from ${url}:`, error);
            return [];
        }
    };

    const populateCardContainer = (items, containerSelector) => {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        container.innerHTML = '';
        if (!items || items.length === 0) {
            container.innerHTML = '<p class="no-content">No content to display.</p>';
            return;
        }

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card';

            const tagsHtml = item.tags && item.tags.length > 0
                ? `<div class="card-tags">${item.tags.map(tag => `<span>#${tag}</span>`).join('')}</div>`
                : '';

            card.innerHTML = `
                <a href="${item.url}" target="_blank" rel="noopener noreferrer">
                    <div class="card-image-container">
                        <img src="${item.imageUrl}" alt="${item.title}" loading="lazy">
                    </div>
                    <div class="card-content">
                        <h3>${item.title}</h3>
                        <p>${item.description}</p>
                        ${tagsHtml}
                        <span class="card-source">Source: ${item.source}</span>
                    </div>
                </a>
            `;
            container.appendChild(card);
        });
    };

    const loadPageContent = async () => {
        switch (bodyId) {
            case 'home-page':
                const [videoTutorials, articleTutorials, myBlog] = await Promise.all([
                    fetchData('videoTutorials.json'),
                    fetchData('articleTutorials.json'),
                    fetchData('myBlog.json')
                ]);
                populateCardContainer(videoTutorials.slice(0, 3), '#home-video-tutorials');
                populateCardContainer(articleTutorials.slice(0, 3), '#home-article-tutorials');
                populateCardContainer(myBlog.slice(0, 3), '#home-my-blog');
                break;

            case 'video-tutorials-page':
                const videoData = await fetchData('videoTutorials.json');
                populateCardContainer(videoData, '#video-tutorials .card-container');
                break;

            case 'article-tutorials-page':
                const articleData = await fetchData('articleTutorials.json');
                populateCardContainer(articleData, '#article-tutorials .card-container');
                break;

            case 'blog-page':
                const blogData = await fetchData('myBlog.json');
                populateCardContainer(blogData, '#my-blog .card-container');
                break;
        }
    };

    loadPageContent();
});
