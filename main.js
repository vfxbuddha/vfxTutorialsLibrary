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

    // --- Logic for Detail Pages (Video, Article, Blog) ---
    const isDetailPage = bodyId.includes('-page') && bodyId !== 'home-page';

    if (isDetailPage) {
        let originalData = [];
        const sortSelect = document.getElementById('sort-select');
        const tagFilterSelect = document.getElementById('tag-filter-select');
        const cardContainer = document.querySelector('.card-container');

        const populateCards = (items) => {
            if (!cardContainer) return;
            cardContainer.innerHTML = '';

            if (!items || items.length === 0) {
                cardContainer.innerHTML = '<p class="no-content">No content matching the criteria.</p>';
                return;
            }

            items.forEach(item => {
                const card = document.createElement('div');
                card.className = 'card';

                const imageUrl = item.imageUrl || 'assets/images/default-thumbnail.jpg';
                const title = item.title || 'Untitled';
                const description = item.description || 'No description available.';
                const source = item.source || 'Unknown Source';
                const tagsHtml = item.tags && item.tags.length > 0
                    ? `<div class="card-tags">${item.tags.map(tag => `<span data-tag="${tag}">#${tag}</span>`).join('')}</div>`
                    : '';

                card.innerHTML = `
                    <a href="${item.url}" target="_blank" rel="noopener noreferrer">
                        <div class="card-image-container">
                            <img src="${imageUrl}" alt="${title}" loading="lazy">
                        </div>
                        <div class="card-content">
                            <h3>${title}</h3>
                            <p>${description}</p>
                            ${tagsHtml}
                            <span class="card-source">Source: ${source}</span>
                        </div>
                    </a>
                `;
                cardContainer.appendChild(card);
            });
        };

        const populateTagFilter = () => {
            const allTags = [...new Set(originalData.flatMap(item => item.tags || []))].sort();
            tagFilterSelect.innerHTML = '<option value="all">All Tags</option>'; // Reset
            allTags.forEach(tag => {
                const option = document.createElement('option');
                option.value = tag;
                option.textContent = `#${tag}`;
                tagFilterSelect.appendChild(option);
            });
        };

        const applyFiltersAndSort = () => {
            let processedData = [...originalData];
            const sortValue = sortSelect.value;
            const tagValue = tagFilterSelect.value;

            // 1. Filter by tag
            if (tagValue !== 'all') {
                processedData = processedData.filter(item => item.tags && item.tags.includes(tagValue));
            }

            // 2. Sort the data
            switch (sortValue) {
                case 'latest':
                    processedData.reverse(); // Assumes original array is oldest to newest
                    break;
                case 'oldest':
                    // Do nothing, keep original order
                    break;
                case 'a-z':
                    processedData.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
                    break;
                case 'z-a':
                    processedData.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
                    break;
            }
            populateCards(processedData);
        };

        const initPage = async () => {
            let jsonUrl = '';
            if (bodyId === 'video-tutorials-page') jsonUrl = 'videoTutorials.json';
            else if (bodyId === 'article-tutorials-page') jsonUrl = 'articleTutorials.json';
            else if (bodyId === 'blog-page') jsonUrl = 'myBlog.json';

            if (jsonUrl) {
                originalData = await fetchData(jsonUrl);
                populateTagFilter();
                applyFiltersAndSort(); // Initial population

                // --- Event Listeners ---
                sortSelect.addEventListener('change', applyFiltersAndSort);
                tagFilterSelect.addEventListener('change', applyFiltersAndSort);
                cardContainer.addEventListener('click', (e) => {
                    if (e.target.matches('.card-tags span')) {
                        e.preventDefault(); // Prevent link navigation
                        const tag = e.target.dataset.tag;
                        if (tag) {
                            tagFilterSelect.value = tag;
                            applyFiltersAndSort();
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    }
                });
            }
        };

        initPage();

    } else if (bodyId === 'home-page') {
        // --- Logic for Home Page ---
        const populateHomeCardContainer = (items, containerSelector) => {
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
                const imageUrl = item.imageUrl || 'assets/images/default-thumbnail.jpg';
                const title = item.title || 'Untitled Tutorial';
                const description = item.description || 'No description available.';
                const source = item.source || 'Unknown Source';
                const tagsHtml = item.tags && item.tags.length > 0
                    ? `<div class="card-tags">${item.tags.map(tag => `<span>#${tag}</span>`).join('')}</div>`
                    : '';

                card.innerHTML = `
                    <a href="${item.url}" target="_blank" rel="noopener noreferrer">
                        <div class="card-image-container">
                            <img src="${imageUrl}" alt="${title}" loading="lazy">
                        </div>
                        <div class="card-content">
                            <h3>${title}</h3>
                            <p>${description}</p>
                            ${tagsHtml}
                            <span class="card-source">Source: ${source}</span>
                        </div>
                    </a>
                `;
                container.appendChild(card);
            });
        };

        const loadHomePageContent = async () => {
            const [videoTutorials, articleTutorials, myBlog] = await Promise.all([
                fetchData('videoTutorials.json'),
                fetchData('articleTutorials.json'),
                fetchData('myBlog.json')
            ]);
            populateHomeCardContainer(videoTutorials.reverse().slice(0, 4), '#home-video-tutorials .card-container');
            populateHomeCardContainer(articleTutorials.reverse().slice(0, 4), '#home-article-tutorials .card-container');
            populateHomeCardContainer(myBlog.reverse().slice(0, 4), '#home-my-blog .card-container');
        };

        loadHomePageContent();
    }
});
