document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('main section');
    const moreLinks = document.querySelectorAll('.more-link');

    // 1. 데이터 로드 및 전체 페이지 렌더링
    loadAndRenderContent();

    // 2. SPA 네비게이션 설정
    setupNavigation();

    /**
     * data.json을 로드하고 전체 콘텐츠를 렌더링하는 메인 함수
     */
    async function loadAndRenderContent() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            // 각 섹션에 카드 렌더링
            renderCards('#video-tutorials .card-container', data.videoTutorials);
            renderCards('#article-tutorials .card-container', data.articleTutorials);
            renderCards('#my-blog .card-container', data.blogPosts);

            // 홈 페이지 채우기
            populateHomePage();

            // 초기 섹션 표시
            const initialHash = window.location.hash || '#home';
            showSection(initialHash);

        } catch (error) {
            console.error("콘텐츠 로딩에 실패했습니다:", error);
            const mainContainer = document.querySelector('main');
            mainContainer.innerHTML = '<p class="error-message">콘텐츠를 불러오는 데 문제가 발생했습니다. 나중에 다시 시도해 주세요.</p>';
        }
    }

    /**
     * 지정된 컨테이너에 튜토리얼 카드를 렌더링하는 함수
     * @param {string} containerSelector - 카드를 삽입할 컨테이너의 CSS 선택자
     * @param {Array} items - 렌더링할 데이터 아이템 배열
     */
    function renderCards(containerSelector, items) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        container.innerHTML = ''; // 기존 콘텐츠 비우기

        if (!items || items.length === 0) {
            container.innerHTML = '<p>아직 등록된 튜토리얼이 없습니다.</p>';
            return;
        }

        items.forEach(item => {
            const card = document.createElement('a');
            card.href = item.url;
            card.className = 'card';
            card.target = "_blank"; // 새 탭에서 링크 열기
            card.rel = "noopener noreferrer";

            card.innerHTML = `
                <img src="${item.imageUrl}" alt="${item.title}">
                <div class="card-content">
                    <h3>${item.title}</h3>
                    <p>${item.description}</p>
                    <p class="source">출처: ${item.source}</p>
                </div>
            `;
            container.appendChild(card);
        });
    }

    /**
     * 홈 페이지에 각 섹션의 최신 콘텐츠를 복제하여 채우는 함수
     */
    function populateHomePage() {
        const sources = {
            '#latest-videos': '#video-tutorials',
            '#latest-articles': '#article-tutorials',
            '#latest-blog': '#my-blog'
        };

        for (const [target, source] of Object.entries(sources)) {
            const targetContainer = document.querySelector(target);
            const sourceContainer = document.querySelector(`${source} .card-container`);
            
            if (!targetContainer || !sourceContainer) continue;

            const cards = sourceContainer.querySelectorAll('.card');
            // 최신 3개 항목을 가져옵니다. (slice는 원본 배열을 변경하지 않습니다)
            const cardsToDisplay = Array.from(cards).slice(0, 3);

            targetContainer.innerHTML = '';

            if (cardsToDisplay.length > 0) {
                cardsToDisplay.forEach(card => {
                    const cardClone = card.cloneNode(true);
                    targetContainer.appendChild(cardClone);
                });
            } else {
                targetContainer.innerHTML = `<p class="no-content">표시할 콘텐츠가 없습니다.</p>`;
            }
        }
    }

    /**
     * SPA 네비게이션 관련 이벤트를 설정하는 함수
     */
    function setupNavigation() {
        navLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                handleLinkClick(event, link.getAttribute('href'));
            });
        });

        moreLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                handleLinkClick(event, link.getAttribute('href'));
            });
        });

        window.addEventListener('popstate', () => {
            const targetId = window.location.hash || '#home';
            showSection(targetId);
        });
    }

    /**
     * 링크 클릭 공통 처리 함수
     */
    function handleLinkClick(event, targetId) {
        event.preventDefault();
        if (window.location.hash !== targetId) {
            history.pushState(null, null, targetId);
        }
        showSection(targetId);
        window.scrollTo(0, 0);
    }

    /**
     * 특정 ID의 섹션을 보여주는 함수
     */
    function showSection(targetId) {
        sections.forEach(section => {
            section.classList.add('hidden');
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
        });

        const targetSection = document.querySelector(targetId);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }

        const activeLink = document.querySelector(`.nav-link[href="${targetId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
});
