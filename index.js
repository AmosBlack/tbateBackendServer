const express = require('express');
const app = express();
const axios = require('axios');
const cheerio = require('cheerio');
const firebase = require('firebase');
const cron = require('node-cron');
const moment = require('moment-timezone');

// Firebase initialization
const firebaseConfig = {
  apiKey: 'AIzaSyAndTqSX-EfgG3URZDGGVf_uB-K3hSpVlw',
  authDomain: 'tbatevault.firebaseapp.com',
  databaseURL: 'https://tbatevault-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'tbatevault',
  storageBucket: 'tbatevault.appspot.com',
  messagingSenderId: '601887097241',
  appId: '1:601887097241:web:c82ab39ff0ad0e4f9d1308',
};

const firebaseApp = firebase.initializeApp(firebaseConfig);
const DB = firebaseApp.database();

async function getChapterData() {
  try {
    const snapshot = await DB.ref('chapters-count').once('value');
    const result = await axios.get('https://lnreader.org/the-beginning-after-the-end-535558/chapter-prologue');
    const $ = cheerio.load(result.data);
    const optionCount = $("select[onchange='location = this.options[this.selectedIndex].value;']").find('option').length - 40;

    if (optionCount > snapshot.val()) {
      await DB.ref('chapters-count').set(optionCount);
      const link = $("select[onchange='location = this.options[this.selectedIndex].value;']").find('option').last().attr('val');
      const res = await axios.get(link);
      const x = cheerio.load(res.data);
      let chapterText = x.html('#chapterText');
      chapterText = chapterText.replaceAll('Sponsored Content', '');
      await DB.ref(`chapters/${optionCount}`).set(chapterText);
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// Start the server and schedule the cron job
const startServer = () => {
  app.listen(3000, () => {
    console.log('Server started on port 3000');

    // Cron job
    const timezone = 'America/New_York'; // Set the New York timezone
    const cronExpression = '*/15 * * * 5'; // Run every 15 minutes on Fridays

    cron.schedule(cronExpression, async () => {
      try {
        await moment.tz(timezone);
        await getChapterData();
      } catch (error) {
        console.error(error);
      }
    }, {
      timezone,
    });
  });
};

app.get('/update-chapters', (req, res) => {
  getChapterData()
    .then(() => res.send('Cron is executed'))
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error executing cron job');
    });
});

// Start the server and schedule the cron job
startServer();
