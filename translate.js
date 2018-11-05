#! /usr/bin/env node

const googleTranslateApi = require('google-translate-api');

// const toTranslate = "comment vas-tu aujourd'hui?";

const langs = ["it", "en", "de"];

let didYouMeanCheck = true;

if (!process.argv[2]) {
    console.log("  missing argument");
    return;
}

const toTranslate = process.argv[2];

function translate(string, fromLang, toLang) {

    // Return new promise
    return new Promise(function(resolve, reject) {

        googleTranslateApi(
            string, {
                from: fromLang,
                to: toLang,
                raw: true}
            ).then(res => {
                if (res.from.text.didYouMean && didYouMeanCheck === true) {
                    didYouMeanCheck = false;
                    console.log("  Did you mean  : " + res.from.text.value);
                    console.log('');
                }
                resolve({text: res.text, lang: toLang});
            }
        ).catch(err => {
            reject(err)
        });
    })
}

const printResult = (results) => {
    results.forEach(function(result) {
        console.log("  " + result.lang + " : " + result.text);
    });
}

const printDone = () => {
    console.log('');
    console.log("done");
}

function main() {

    console.log('');
    console.log("translating : " + toTranslate);
    console.log('');

    let checkTranslation = '';
    let reverseTranslation = '';

    translate(toTranslate, 'fr', 'en')
        .then((result) => {
            checkTranslation = result.text;
        })
        .catch((error) => {
            console.error(error);
        })
        .then(() => {
            translate(checkTranslation, 'en', 'fr').then((result) => {

                reverseTranslation = result.text;

                if (toTranslate.toLowerCase() !== reverseTranslation.toLowerCase()) {
                    console.log('');
                    console.log("    WARNING : reverse translation differs from input");
                    console.log('');
                    console.log("    input :               " + toTranslate);
                    console.log("    reverse translation : " + reverseTranslation);
                    console.log('');
                }
            })
        })
        .then(() => {
            const translations = [];

            langs.forEach(function(toLang) {
                translations.push(translate(toTranslate, 'fr', toLang));
            });

            Promise.all(translations).then(printResult).then(printDone);
        });



}

main();
