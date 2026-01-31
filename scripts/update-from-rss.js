const Parser = require('rss-parser');
const fs = require('fs').promises;

// 1. 설정: RSS 피드 URL 및 데이터 파일 경로
const RSS_FEEDS = [
    {
        url: 'https://www.allanmckay.com/feed/', // 변경된 RSS 피드
        type: 'articleTutorials',
        source: 'Allan McKay'
    },
    {
        url: 'https://www.creativebloq.com/feed',
        type: 'articleTutorials',
        source: 'Creative Bloq'
    }
];

const DATA_FILE_PATH = './data.json';

/**
 * RSS 피드를 파싱하여 data.json을 업데이트하는 메인 함수
 */
async function updateContentFromRss() {
    console.log('RSS 피드 업데이트를 시작합니다...');
    const parser = new Parser();
    let newDataCount = 0;

    try {
        // 기존 데이터 읽기
        const dataFile = await fs.readFile(DATA_FILE_PATH, 'utf8');
        const jsonData = JSON.parse(dataFile);

        // 이미 존재하는 URL들을 Set으로 만들어 빠른 조회를 가능하게 함
        const existingUrls = new Set();
        Object.values(jsonData).flat().forEach(item => existingUrls.add(item.url));

        for (const feedInfo of RSS_FEEDS) {
            console.log(`'${feedInfo.source}' 피드를 확인하는 중... (${feedInfo.url})`);
            const feed = await parser.parseURL(feedInfo.url);
            let itemsAddedFromFeed = 0;

            for (const item of feed.items) {
                const itemUrl = item.link;

                if (!existingUrls.has(itemUrl)) {
                    const newItem = {
                        id: `rss-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        title: item.title || '제목 없음',
                        description: item.contentSnippet ? item.contentSnippet.substring(0, 150) + '...' : '설명 없음',
                        imageUrl: extractImageUrl(item) || 'https://images.unsplash.com/photo-1579275542419-7ac941211718?w=800', // 기본 이미지
                        url: itemUrl,
                        source: feedInfo.source
                    };

                    // 해당 타입의 배열 맨 앞에 추가
                    if (jsonData[feedInfo.type]) {
                        jsonData[feedInfo.type].unshift(newItem);
                        existingUrls.add(itemUrl); // Set에도 추가하여 중복 방지
                        newDataCount++;
                        itemsAddedFromFeed++;
                    }
                }
            }
             console.log(`-> ${itemsAddedFromFeed}개의 새로운 항목을 추가했습니다.`);
        }

        if (newDataCount > 0) {
            // 업데이트된 JSON 데이터를 파일에 다시 쓰기 (깔끔하게 포맷팅)
            await fs.writeFile(DATA_FILE_PATH, JSON.stringify(jsonData, null, 2));
            console.log(`\n총 ${newDataCount}개의 새로운 튜토리얼이 추가되었습니다. data.json 파일이 업데이트되었습니다.`);
        } else {
            console.log('\n새로운 튜토리얼이 없습니다. data.json은 이미 최신 상태입니다.');
        }

    } catch (error) {
        console.error('RSS 피드를 업데이트하는 중 오류가 발생했습니다:', error);
    }
}

/**
 * RSS 아이템에서 이미지 URL을 추출하는 함수
 * 다양한 RSS 형식을 고려 (enclosure, media:thumbnail, content 등)
 */
function extractImageUrl(item) {
    if (item.enclosure && item.enclosure.url && item.enclosure.type.startsWith('image')) {
        return item.enclosure.url;
    }
    if (item['media:group'] && item['media:group']['media:thumbnail']) {
        return item['media:group']['media:thumbnail'][0].$.url;
    }
    if (item.content) {
        const match = item.content.match(/<img[^>]+src="([^">]+)"/);
        if (match) {
            return match[1];
        }
    }
    return null;
}

// 스크립트 실행
updateContentFromRss();
