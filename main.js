document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('main section');
    const moreLinks = document.querySelectorAll('.more-link');

    // 홈페이지 채우기 함수 호출
    populateHomePage();

    // 초기 상태 설정: URL 해시값에 따라 섹션 표시 또는 기본 홈 섹션 표시
    const initialHash = window.location.hash || '#home';
    showSection(initialHash);

    // 네비게이션 링크 이벤트 리스너
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            handleLinkClick(event, link.getAttribute('href'));
        });
    });

    // '더보기' 링크 이벤트 리스너
    moreLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            handleLinkClick(event, link.getAttribute('href'));
        });
    });

    // 브라우저 뒤로가기/앞으로가기 버튼 처리
    window.addEventListener('popstate', () => {
        const targetId = window.location.hash || '#home';
        showSection(targetId);
    });

    /**
     * 링크 클릭 공통 처리 함수
     * @param {Event} event - 클릭 이벤트
     * @param {string} targetId - 보여줄 섹션의 ID (e.g., '#home')
     */
    function handleLinkClick(event, targetId) {
        event.preventDefault(); // 기본 앵커 동작 방지
        history.pushState(null, null, targetId);
        showSection(targetId);
        window.scrollTo(0, 0); // 페이지 상단으로 스크롤
    }

    /**
     * 특정 ID의 섹션을 보여주는 함수
     * @param {string} targetId - 보여줄 섹션의 ID
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

    /**
     * 홈 페이지에 각 섹션의 최신 콘텐츠를 채우는 함수
     */
    function populateHomePage() {
        const sources = {
            '#latest-videos': '#video-tutorials',
            '#latest-articles': '#article-tutorials',
            '#latest-blog': '#my-blog'
        };

        for (const [target, source] of Object.entries(sources)) {
            const targetContainer = document.querySelector(target);
            const sourceContainer = document.querySelector(source);
            
            if (!targetContainer || !sourceContainer) continue;

            const cards = sourceContainer.querySelectorAll('.card');
            const cardsToDisplay = Array.from(cards).slice(0, 3);

            // 기존 콘텐츠 비우기
            targetContainer.innerHTML = '';

            if (cardsToDisplay.length > 0) {
                cardsToDisplay.forEach(card => {
                    // card를 감싸고 있는 a 태그 전체를 복제해야 링크가 유지됩니다.
                    const cardClone = card.cloneNode(true);
                    targetContainer.appendChild(cardClone);
                });
            } else {
                // 'my-blog' 섹션처럼 카드가 없는 경우, p 태그의 메시지를 가져와 표시
                const message = sourceContainer.querySelector('p');
                if(message) {
                    targetContainer.innerHTML = `<p class="no-content">${message.textContent}</p>`;
                } else {
                     targetContainer.innerHTML = `<p class="no-content">표시할 콘텐츠가 없습니다.</p>`;
                }
            }
        }
    }
});
