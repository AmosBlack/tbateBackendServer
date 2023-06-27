const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const firebase = require('firebase');
const cron = require('node-cron');
const moment = require('moment-timezone');

const app = express();

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
    //scrape the link
    axios
        .get(link)
        .then((res) => {
            //parse html
            const x = cheerio.load(res.data);
            //store the html inside chapterText
            var chapterText = x.html('#chapterText');
            //filter out sponsored content
            chapterText = chapterText.replaceAll('Sponsored Content', '');
            //on location given as count, push the chapter html in db
            DB.ref(`chapters/${count}`).set(chapterText);
        })
        .catch((error) => {
            console.log(error)
        });
}


function getChapterData() {
    //pull the number of chapters from db asynchronously
    DB.ref('chapters-count').once('value').then((snapshot) => {
        //scrape a chapter 
        axios
            .get('https://lnreader.org/the-beginning-after-the-end-535558/chapter-prologue')
            .then((result) => {
                //load html
                const $ = cheerio.load(result.data); //parsed html
                // from it scrape the number of chapters
                var optionCount = $("select[onchange='location = this.options[this.selectedIndex].value;']").find('option').length - 40; //no of chapters on lnreader
                //if db chapters less than on lnreader
                if (optionCount > snapshot.val()) {
                    //update chapter count
                    DB.ref('chapters-count').set(optionCount);
                    //link for the latest chapter scraped from lnreader
                    const link = $("select[onchange='location = this.options[this.selectedIndex].value;']").find('option').last().attr('value');
                    //scrape from this link, along with no of chapters for location in db
                    scrapeChap(link,optionCount)
                }
            })
            .catch((error) => {
                return console.log(error);
            });
    });
}


app.get('/update-chapters', (req, res) => {
    getChapterData(res.send("Cron has been executed"))
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


