const axios = require("axios")
const cheerio = require("cheerio")
const firebase = require("firebase")
const cron = require("node-cron")
const moment = require('moment-timezone');

//firebase-initializationk
const firebaseConfig = {
    apiKey: "AIzaSyAndTqSX-EfgG3URZDGGVf_uB-K3hSpVlw",
    authDomain: "tbatevault.firebaseapp.com",
    databaseURL: "https://tbatevault-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "tbatevault",
    storageBucket: "tbatevault.appspot.com",
    messagingSenderId: "601887097241",
    appId: "1:601887097241:web:c82ab39ff0ad0e4f9d1308"
};
const app = firebase.initializeApp(firebaseConfig)
const DB = firebase.database()


function getChapterData() {
    DB.ref(`chapters-count`).once("value").then((snapshot) => {
        //40 extra vol 8.5 chaps
        axios.get('https://lnreader.org/the-beginning-after-the-end-535558/chapter-prologue')
            .then(result => {
                const $ = cheerio.load(result.data)
                var optionCount = $("select[onchange='location = this.options[this.selectedIndex].value;']").find("option").length - 40
                console.log(optionCount)
                if (optionCount > snapshot.val()) {
                    DB.ref(`chapters-count`).set(optionCount)
                    const link = $("select[onchange='location = this.options[this.selectedIndex].value;']").find("option").last().attr("val")
                    axios.get(link)
                        .then(res => {
                            const x = cheerio.load(res.data)
                            var chapterText = x.html('#chapterText')
                            chapterText = chapterText.replaceAll("Sponsored Content", '')
                            DB.ref(`chapters/${optionCount}`).set(chapterText)
                            return true

                        })
                        .catch(error => {
                            return false
                        })
                }

            })
            .catch(error => {
                return false
            })


    })
}

getChapterData()

//cron job
const timezone = 'America/New_York'; // Set the New York timezone
const cronExpression = '*/15 * * * 5'; // Run every 15 minutes on Fridays

cron.schedule(cronExpression, () => {
    moment.tz(timezone).then(() => {
        getChapterData();
    });
}, {
    timezone
});