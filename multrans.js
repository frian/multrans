#! /usr/bin/env node

/*jshint esversion: 6 */

const fs = require('fs');
// const path = require('path');
const program = require('commander');
const googleTranslateApi = require('@k3rn31p4nic/google-translate-api');

const conf = require('./config');
const version = require('./package.json').version;


program
    .usage('[options] string_to_translate')
    .description('translate to one or more languages')
    .option('-f, --from <lang>', 'language of input string', conf.defaultFromLang)
    .option('-t, --to <lang>', 'languages to translate to', conf.defaultToLangs)
    .option('-v, --verbose');

program
    .command('set')
    .description('view and edit default in and out lang(s). (-h for help)')
    .option("-i, --input <lang>", "Set input lang")
    .option("-o, --output <lang(s)>", "Set output lang(s)")
    .action(function(options) {
        if (options.input === undefined && options.output === undefined) {
            console.log("default input lang :     " + conf.defaultFromLang);
            console.log("default output lang(s) : " + conf.defaultToLangs);
            process.exit(0);
        }
        else if (options.input) {
            console.log('set input lang to : ' + options.input);
            conf.defaultFromLang = options.input;
            let newConf = JSON.stringify(conf, null, 4);
            fs.writeFileSync('config.json', newConf);
            process.exit(0);
        }
        else if (options.output) {
            console.log('set output lang(s) to ' + options.output);
            conf.defaultToLangs = options.output;
            let newConf = JSON.stringify(conf, null, 4);
            fs.writeFileSync('config.json', newConf);
            process.exit(0);
        }
    })
    .on('--help', function(){
      console.log('');
      console.log('Examples:');
      console.log('  $ ' + program._name + ' set             show defaults');
      console.log('  $ ' + program._name + ' set -i fr       set input lang to fr');
      console.log('  $ ' + program._name + ' set -o es,de    set output langs to es and de');
    });

    program.on('--help', function(){
      console.log('');
      console.log('Examples:');
      console.log('  $ ' + program._name + ' "I am a translator"');
      console.log('  $ ' + program._name + ' -f en -t fr,it,de,es,ru "I can translate in multiple languages"');
    });

program
    .version(version)
    .parse(process.argv);


if (! program.args.length) {
  program.help();
}


const fromLang = program.from || conf.defaultFromLang;

const toLangs = program.to.split(',') || conf.defaultToLangs.split(',');


// -- check if we have a same language in --from and --to
if (toLangs.includes(fromLang)) {
    console.log("  ERROR : same language in --from and --to");
    process.exit(0);
}

const verbose = program.verbose;

// -- flag for printResult
let multiTrans = false;

if (toLangs.length > 1) {
    multiTrans = true;
}


const toTranslate = program.args[0];


// -- flag ; we want ro check this only once
let didYouMeanCheck = true;


//
// -- run ---------------------------------------------------------------------
//
if (verbose) {
    console.log('');
    console.log("translating : " + toTranslate + " from '" + fromLang + "' to '" + toLangs + "'");
    console.log('');
}


let checkTranslation = '';
let reverseTranslation = '';

translate(toTranslate, fromLang, toLangs[0])
    .then((result) => {
        return new Promise(function(resolve, reject) {
            checkTranslation = result.text;
            resolve(checkTranslation);
        });
    })
    .then(() => {
        return translate(checkTranslation, toLangs[0], fromLang).then((result) => {

            reverseTranslation = result.text;

            if (toTranslate.toLowerCase() !== reverseTranslation.toLowerCase()) {
                console.log('');
                console.log("    WARNING : reverse translation differs from input");
                console.log('');
                console.log("    input :               " + toTranslate);
                console.log("    reverse translation : " + reverseTranslation);
                console.log('');
            }
        });
    })
    .then(() => {
        const translations = [];

        toLangs.forEach(function(toLang) {
            translations.push(translate(toTranslate, fromLang, toLang));
        });

        Promise.all(translations).then(printResult).then(printDone);
    })
    .catch((error) => {
        console.error(error);
    });


//
// -- functions ----------------------------------------------------------
//
function printResult(results) {
    if (multiTrans === false) {
        console.log("  " + results[0].text);
        return;
    }
    results.forEach(function(result) {
        console.log("  " + result.lang + " : " + result.text);
    });
}

function printDone() {
    if (verbose) {
        console.log('');
        console.log("done");
    }
}

function translate(string, fromLang, toLang) {

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
            reject(err);
        });
    });
}
