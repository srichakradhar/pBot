// This loads the environment variables from the .env file
require('dotenv-extended').load();

var builder = require('botbuilder');
var restify = require('restify');
var spellService = require('./spell-service');
// var axios = require('axios');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});
// Create connector and listen for messages
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
server.post('/api/messages', connector.listen());

var bot = new builder.UniversalBot(connector, function (session) {
    session.send('Sorry, I did not understand \'%s\'. Type \'help\' if you need assistance.', session.message.text);
});

const PRForm = 'I need information on PR Form';
const POStatus = 'What is the status of P0 for PR396316';
const VendorStatus = 'Is the supplier Poppulo set up in SAP for NL location?';
const EmailQuotes = 'Do we accept email quotes from suppliers?';
const Help = 'Help';
const acceptEmailQuotes = true;

var bot = new builder.UniversalBot(connector, [
    function (session) {
        session.sendTyping();
        setTimeout(() => {
            builder.Prompts.choice(session,
                'You can ask me something like:',
                [EmailQuotes, VendorStatus, PRForm, POStatus, Help],
                { listStyle: builder.ListStyle.button });
          }, 3000);
    },
    function (session, result) {
        if (result.response) {
            switch (result.response.entity) {
                case EmailQuotes:
                    session.beginDialog('Email Quote');
                break;
                case POStatus:
                    session.send('This functionality is not yet implemented! Try resetting your password.');
                    session.reset();
                    break;
                case VendorStatus:
                    session.beginDialog('Vendor Availability');
                    break;
                case PRForm:
                    session.send('This functionality is not yet implemented! Try resetting your password.');
                    session.reset();
                    break;
                case VendorStatus:
                    session.beginDialog('Help');
                    break;
            }
        } else {
            session.send('Sorry, I did not understand \'%s\'. Type \'help\' if you need assistance.', session.message.text);
        }
    },
    function (session, result) {
        if (result.resume) {
            session.send('Well, I\'m corn-fused! 🤔 Can you please ask that again?');
            builder.Prompts.choice(session,
                'I can help you with queries regarding the PR form.',
                [VendorStatus, PRForm, POStatus, Help],
                { listStyle: builder.ListStyle.button });
            session.reset();
        }
    }
]);


// You can provide your own model by specifing the 'LUIS_MODEL_URL' environment variable
// This Url can be obtained by uploading or creating your model from the LUIS portal: https://www.luis.ai/
var recognizer = new builder.LuisRecognizer(process.env.LUIS_MODEL_URL);
bot.recognizer(recognizer);

var firstMessage = true;


// const request = require('request');

// request.get({
//     url: process.env.LUIS_MODEL_URL + '&q=Search for hotels near Seattle',
//     proxy: 'http://1420100:TATA1Ch%40k.ree@proxy.tcs.com:8080',
//     headers: {
//       'User-Agent': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Safari/537.36.'
//     },
//     agentOptions: {
//         secureProtocol: 'SSLv2_method'
//     },
//     auth: {
//         username: 'srichakra3nsr3@gmail.com',
//         password: 'Changeme@01'
//       },
// }).on('response', function(response) {
//     console.log('response', response.toJSON());
// }).on('error', function(err) {
//     console.log(err)
// });

// request({
//   url: process.env.LUIS_MODEL_URL,
//   proxy: 'https://10.138.89.95:3128/',
//   headers: {
//     'User-Agent': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Safari/537.36.'
//   }
// })
// .then(function (response) {
// console.log(response);
// })
// .catch(function (error) {
// console.log("===========********========= ERROR ===========********=========", error);
// });

    // var request = {
    //     // `url` is the server URL that will be used for the request
    //     url: process.env.LUIS_MODEL_URL,

    //     // `method` is the request method to be used when making the request
    //     method: 'get', // default

    //     proxy: {
    //         host: 'https://1420100:TATA1Ch%40k.ree@proxy.tcs.com',
    //         port: 8080
    //     }

    // }
    // // Make a request with LUIS url
    // axios.get(process.env.LUIS_MODEL_URL, request)
    // .then(function (response) {
    // console.log(response);
    // })
    // .catch(function (error) {
    // console.log("===========********========= ERROR ===========********=========", error);
    // });
// bot.on('conversationUpdate', function(session){
//     bot.beginDialog(session.address, "*:/");
//     bot.beginDialog(session.address, "Help");
// });

bot.on('conversationUpdate', (message) => {
    if (message.membersAdded && firstMessage) {
        const hello = new builder.Message()
            .address(message.address)
            .text("Hello! Welcome to the Purchase Helper Bot.");
        bot.send(hello);
        bot.beginDialog(message.address, '*:/');
        firstMessage = false;
    }
});

bot.dialog('Vendor Availability', [
    function (session, args, next) {

        // try extracting entities
        var systemEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'System');
        var supplierEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'Supplier');
        if (systemEntity && !supplierEntity) {
            // Supplier entity not detected, ask the user
            session.dialogData.searchType = 'Supplier';
            session.dialogData.system = systemEntity.entity;
            builder.Prompts.text(session, 'Which supplier / vendor do you want to know about?');
        } else if (!systemEntity && supplierEntity) {
            // System entity not detected, ask the user
            session.dialogData.searchType = 'System';
            session.dialogData.supplier = supplierEntity.entity;
            builder.Prompts.text(session, 'in which system?');
        } else if (!systemEntity && !supplierEntity) {
            // no entities detected, ask user for inputs
            session.dialogData.searchType = 'Supplier-n-System';
            builder.Prompts.text(session, 'Please enter supplier name and system name...');
        } else {
            // Both the entities are present. Go to the next step
            next({ response: [systemEntity.entity, supplierEntity.entity], next: next });
        }
    },
    function (session, results, next) {
        console.log("Response: ", results.response);

        switch(session.dialogData.searchType){
            case "Supplier":
                next({ response: [session.dialogData.system, results.response] });
            break;
            case "System":
                next({ response: [results.response, session.dialogData.supplier] });
            break;
            case "Supplier-n-System":
                console.log("Response for supplier and system ----**######***--->", results.response);
                next({ response: ["Poppulo", "SAP"] });
            break;
            default:
                next({ response: results.response });
            break;

        }
    },
    function (session, results) {
        var system = results.response[0];
        var supplier = results.response[1];

        var message = 'Looking for the setup...';

        console.log("results: --------> ", results);

        session.send(message);

        var setup = Math.random() >= 0.5;

        if(setup)
            message = "Yes! Setup has been identified."
        else
            message = "There is no setup in " + system + " for " + supplier;
        
        session.send(message);
        session.endDialog();
    }
]).triggerAction({
    matches: 'Vendor Availability',
    onInterrupted: function (session) {
        session.send('Please provide supplier name and system name');
    }
});

bot.dialog('Help', [
    function (session) {
        builder.Prompts.choice(session,
            'Try asking me things like:',
            [EmailQuotes, VendorStatus, PRForm, POStatus],
            { listStyle: builder.ListStyle.button });
    },
    function (session, result) {
        if (result.response) {
            switch (result.response.entity) {
                case EmailQuotes:
                    session.beginDialog('Email Quote');
                    session.reset();
                break;
                case POStatus:
                    session.send('This functionality is not yet implemented! First two options are working.');
                    session.reset();
                    break;
                case VendorStatus:
                    session.beginDialog('Vendor Availability');
                    break;
                case PRForm:
                    session.send('This functionality is not yet implemented! First two options are working. Stay tuned for the awesomeness.');
                    session.reset();
                    break;
                case VendorStatus:
                    session.beginDialog('Help');
                    break;
            }
        } else {
            session.send('Sorry, I did not understand \'%s\'. Type \'help\' if you need assistance.', session.message.text);
        }
    },
    function (session, result) {
        if (result.resume) {
            session.send('I\'m corn-fused! 🤔 Can you please ask that again?');
            builder.Prompts.choice(session,
                'I can help you with queries regarding the PR form.',
                [VendorStatus, PRForm, POStatus],
                { listStyle: builder.ListStyle.button });
            session.reset();
        }
    }
]).triggerAction({
    matches: 'Help'
});

bot.dialog('Greeting', function (session) {
    session.send('Hi. I\'m a bot. I can help you with queries regarding the PR form.');
    session.beginDialog('Help');
}).triggerAction({
    matches: 'Greeting'
});

bot.dialog('Email Quote', function (session) {
    if(acceptEmailQuotes)
    session.endDialog('Yes. We accept email quotes.');
    else
    session.endDialog('No. We don\'t accept email quotes.');
})

// Spell Check
if (process.env.IS_SPELL_CORRECTION_ENABLED === 'true') {
    bot.use({
        botbuilder: function (session, next) {
            spellService
                .getCorrectedText(session.message.text)
                .then(function (text) {
                    session.message.text = text;
                    next();
                })
                .catch(function (error) {
                    console.error(error);
                    next();
                });
        }
    });
}