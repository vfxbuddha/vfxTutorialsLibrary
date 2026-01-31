require('dotenv').config();
const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');

// 파일 경로 설정
const videoTutorialsPath = path.join(__dirname, '..', 'videoTutorials.json');
const articleTutorialsPath = path.join(__dirname, '..', 'articleTutorials.json');

// 구글 시트 설정
const sheets = google.sheets('v4');
const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const RANGE = 'Sheet1!A2:G'; // A2부터 시작하여 데이터만 가져옴

/**
 * 파일에서 기존 데이터를 읽어옵니다.
 * 파일이 없으면 빈 배열을 반환합니다.
 */
async function readExistingData(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return []; // 파일이 없으면 빈 배열 반환
        }
        console.error(`Error reading file ${filePath}:`, error);
        throw error;
    }
}

/**
 * 구글 시트에서 데이터를 가져옵니다.
 */
async function fetchSheetData() {
    try {
        const response = await sheets.spreadsheets.values.get({
            key: API_KEY,
            spreadsheetId: SHEET_ID,
            range: RANGE,
        });
        return response.data.values || [];
    } catch (error) {
        console.error('Error fetching Google Sheet data:', error.message);
        // API 키 또는 시트 ID가 잘못되었을 경우 사용자에게 명확한 안내 제공
        if (error.response && error.response.status === 403) {
            console.error('Permission denied. Please check your Google Sheets API key and ensure the sheet is publicly accessible.');
        }
        throw error;
    }
}

/**
 * 새로운 튜토리얼 데이터를 JSON 파일에 추가합니다.
 */
async function updateTutorials() {
    console.log('Starting tutorial update process...');

    let sheetData;
    try {
        sheetData = await fetchSheetData();
    } catch (error) {
        console.error('Could not fetch data from Google Sheet. Aborting update.');
        return;
    }

    if (sheetData.length === 0) {
        console.log('No new data found in the Google Sheet.');
        return;
    }

    console.log(`Found ${sheetData.length} rows in the sheet.`);

    // 기존 데이터 읽기
    const existingVideos = await readExistingData(videoTutorialsPath);
    const existingArticles = await readExistingData(articleTutorialsPath);

    // 중복 체크를 위한 기존 URL 집합 생성
    const existingVideoUrls = new Set(existingVideos.map(v => v.url));
    const existingArticleUrls = new Set(existingArticles.map(a => a.url));

    let newVideos = [];
    let newArticles = [];

    // 시트 데이터를 순회하며 JSON 객체로 변환
    for (const row of sheetData) {
        const [type, url, title, description, imageUrl, source, tags] = row;

        // 필수 필드(url, title)가 없으면 건너뜁니다.
        if (!url || !title) {
            console.warn(`Skipping row due to missing URL or Title: ${row}`);
            continue;
        }

        const tutorial = {
            id: Date.now() + Math.random(), // 간단한 고유 ID 생성
            url,
            title,
            description: description || '',
            imageUrl: imageUrl || '',
            source: source || '',
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            publishedAt: new Date().toISOString(),
        };

        if (type.toLowerCase() === 'video') {
            if (!existingVideoUrls.has(url)) {
                newVideos.push(tutorial);
                existingVideoUrls.add(url); // 다음 중복 체크를 위해 추가
            }
        } else if (type.toLowerCase() === 'article') {
            if (!existingArticleUrls.has(url)) {
                newArticles.push(tutorial);
                existingArticleUrls.add(url);
            }
        }
    }

    // 새로운 데이터가 있을 경우에만 파일에 쓰기
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
        console.log('No new items to add. JSON files are already up to date.');
    } else {
        console.log('Tutorial update process finished successfully.');
    }
}

updateTutorials();
