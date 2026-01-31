require('dotenv').config();
const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');
const play = require('play-dl');

const videoTutorialsPath = path.join(__dirname, '..', 'videoTutorials.json');
const articleTutorialsPath = path.join(__dirname, '..', 'articleTutorials.json');
const credentialsPath = path.join(__dirname, '..', 'google-credentials.json');

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const RANGE = 'Sheet1!A2:G';

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
            imageUrl: details.thumbnails[details.thumbnails.length - 1].url,
        };
    } catch (error) {
        console.warn(`Could not fetch YouTube info for ${url}: ${error.message}`);
        return null;
    }
}

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

async function updateTutorials() {
    console.log('Starting tutorial update process...');

    let sheetData;
    try {
        sheetData = await fetchSheetData();
    } catch (error) {
        console.error('Aborting update due to sheet fetch error.');
        return;
    }

    if (sheetData.length === 0) {
        console.log('No data in Google Sheet. Clearing existing JSON files.');
        await fs.writeFile(videoTutorialsPath, JSON.stringify([], null, 2));
        await fs.writeFile(articleTutorialsPath, JSON.stringify([], null, 2));
        return;
    }

    let allVideos = [];
    let allArticles = [];

    for (const [index, row] of sheetData.entries()) {
        let [type, url, title, description, imageUrl, source, tags] = row;
        if (!url || !type) continue;

        if (type.toLowerCase() === 'video' && url.includes('youtube.com')) {
            console.log(`Processing YouTube link: ${url}`);
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
            id: `${type.toLowerCase().substring(0, 3)}${(index + 1).toString().padStart(3, '0')}`,
            url,
            title: title || 'Untitled',
            description: description || '',
            imageUrl: imageUrl || '',
            source: source || 'Unknown',
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        };

        if (type.toLowerCase() === 'video') {
            allVideos.push(tutorial);
        } else if (type.toLowerCase() === 'article') {
            allArticles.push(tutorial);
        }
    }

    await fs.writeFile(videoTutorialsPath, JSON.stringify(allVideos, null, 2));
    console.log(`${allVideos.length} video tutorials processed and saved.`);

    await fs.writeFile(articleTutorialsPath, JSON.stringify(allArticles, null, 2));
    console.log(`${allArticles.length} article tutorials processed and saved.`);

    console.log('Tutorial update process finished.');
}

updateTutorials();
