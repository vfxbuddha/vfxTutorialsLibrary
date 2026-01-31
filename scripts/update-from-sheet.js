require('dotenv').config();
const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');
const play = require('play-dl');

// 파일 경로 설정
const videoTutorialsPath = path.join(__dirname, '..', 'videoTutorials.json');
const articleTutorialsPath = path.join(__dirname, '..', 'articleTutorials.json');
const credentialsPath = path.join(__dirname, '..', 'google-credentials.json');

// 구글 시트 설정
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const RANGE = 'Sheet1!A2:G';

/**
 * 새로운 순차적 ID를 생성합니다.
 */
function getNextId(existingData, prefix) {
    let maxId = 0;
    if (existingData.length > 0) {
        for (const item of existingData) {
            const idNum = parseInt(item.id.replace(prefix, ''), 10);
            if (!isNaN(idNum) && idNum > maxId) maxId = idNum;
        }
    }
    return `${prefix}${(maxId + 1).toString().padStart(3, '0')}`;
}

/**
 * YouTube URL에서 동영상 정보를 가져옵니다.
 */
async function getYouTubeVideoInfo(url) {
    try {
        const videoInfo = await play.video_info(url);
        const details = videoInfo.video_details;
        let description = details.description || '';
        if (description.length > 50) {
            description = description.substring(0, 50) + '...';
        }
        return {
            title: details.title,
            description: description,
            imageUrl: details.thumbnails[details.thumbnails.length - 1].url, // 가장 높은 해상도 썸네일
        };
    } catch (error) {
        console.warn(`Could not fetch YouTube info for ${url}: ${error.message}`);
        return null;
    }
}

/**
 * 파일에서 기존 데이터를 읽어옵니다.
 */
async function readExistingData(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') return [];
        throw error;
    }
}

/**
 * 서비스 계정을 사용하여 구글 시트 데이터를 가져옵니다.
 */
async function fetchSheetData() {
    try {
        const auth = new google.auth.GoogleAuth({ keyFile: credentialsPath, scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'] });
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: RANGE });
        return response.data.values || [];
    } catch (error) {
        console.error('Error fetching Google Sheet data:', error.message);
        throw error;
    }
}

/**
 * 새로운 튜토리얼 데이터를 JSON 파일에 추가합니다.
 */
async function updateTutorials() {
    console.log('Starting advanced tutorial update process...');

    let sheetData;
    try {
        sheetData = await fetchSheetData();
    } catch (error) {
        console.error('Aborting update due to sheet fetch error.');
        return;
    }

    if (sheetData.length === 0) {
        console.log('No data in Google Sheet.');
        return;
    }

    const existingVideos = await readExistingData(videoTutorialsPath);
    const existingArticles = await readExistingData(articleTutorialsPath);
    const existingVideoUrls = new Set(existingVideos.map(v => v.url));
    const existingArticleUrls = new Set(existingArticles.map(a => a.url));

    let newVideos = [];
    let newArticles = [];

    for (const row of sheetData) {
        let [type, url, title, description, imageUrl, source, tags] = row;
        if (!url) continue;

        // YouTube 정보 자동 채우기
        if (type.toLowerCase() === 'video' && url.includes('youtube.com')) {
            console.log(`Fetching YouTube info for: ${url}`);
            const videoInfo = await getYouTubeVideoInfo(url);
            if (videoInfo) {
                title = title || videoInfo.title;
                description = description || videoInfo.description;
                imageUrl = imageUrl || videoInfo.imageUrl;
                source = source || 'YouTube';
            }
        } else if (description && description.length > 50) {
            description = description.substring(0, 50) + '...';
        }

        const tutorial = {
            url,
            title: title || 'Untitled',
            description: description || '',
            imageUrl: imageUrl || '',
            source: source || 'Unknown',
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        };

        if (type.toLowerCase() === 'video' && !existingVideoUrls.has(url)) {
            tutorial.id = getNextId([...existingVideos, ...newVideos], 'vid');
            newVideos.push(tutorial);
        } else if (type.toLowerCase() === 'article' && !existingArticleUrls.has(url)) {
            tutorial.id = getNextId([...existingArticles, ...newArticles], 'art');
            newArticles.push(tutorial);
        }
    }

    if (newVideos.length > 0) {
        const updatedVideos = [...existingVideos, ...newVideos];
        await fs.writeFile(videoTutorialsPath, JSON.stringify(updatedVideos, null, 2));
        console.log(`${newVideos.length} new video tutorials added.`);
    }

    if (newArticles.length > 0) {
        const updatedArticles = [...existingArticles, ...newArticles];
        await fs.writeFile(articleTutorialsPath, JSON.stringify(updatedArticles, null, 2));
        console.log(`${newArticles.length} new article tutorials added.`);
    }

    if (newVideos.length === 0 && newArticles.length === 0) {
        console.log('JSON files are already up to date.');
    }

    console.log('Tutorial update process finished.');
}

updateTutorials();
