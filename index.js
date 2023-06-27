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


function scrapeChap(link,count) {
    axios
        .get(link)
        .then((res) => {
            const x = cheerio.load(res.data);
            console.log(chapterText)
            var chapterText = x.html('#chapterText');
            chapterText = chapterText.replaceAll('Sponsored Content', '');
            DB.ref(`chapters/${count}`).set(chapterText);
        })
        .catch((error) => {
            console.log(error)
        });
}


function getChapterData() {
    DB.ref('chapters-count').once('value').then((snapshot) => {
        axios
            .get('https://lnreader.org/the-beginning-after-the-end-535558/chapter-prologue')
            .then((result) => {
                const $ = cheerio.load(result.data);
                var optionCount = $("select[onchange='location = this.options[this.selectedIndex].value;']").find('option').length - 40;
                if (optionCount > snapshot.val()) {
                    DB.ref('chapters-count').set(optionCount);
                    const link = $("select[onchange='location = this.options[this.selectedIndex].value;']").find('option').last().attr('value');
                    console.log(link)
                    scrapeChap(link,optionCount)
                }
            })
            .catch((error) => {
                return 'failure';
            });
    });
}


app.get('/update-chapters', (req, res) => {
    getChapterData(res.send("Cron is executed"))
});


app.listen(3000, () => {
    console.log('Server started on port 3000');

    // // Cron job
    // const timezone = 'America/New_York'; // Set the New York timezone
    // const cronExpression = '*/15 * * * 5'; // Run every 15 minutes on Fridays

    // cron.schedule(cronExpression, () => {
    //   moment.tz(timezone).then(() => {
    //     getChapterData();
    //   });
    // }, {
    //   timezone,
    // });
});


