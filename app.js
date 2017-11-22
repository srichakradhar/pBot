// This loads the environment variables from the .env file
require('dotenv-extended').load();

var builder = require('botbuilder');
var restify = require('restify');
var Store = require('./store');
var spellService = require('./spell-service');
var axios = require('axios');

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

// You can provide your own model by specifing the 'LUIS_MODEL_URL' environment variable
// This Url can be obtained by uploading or creating your model from the LUIS portal: https://www.luis.ai/
var recognizer = new builder.LuisRecognizer(process.env.LUIS_MODEL_URL);
bot.recognizer(recognizer);

const PRForm = 'I need information on PR Form';
const POStatus = 'What is the status of P0 for PR396316';
const EmailQuotes = 'Do we accept email quotes from suppliers?';
const VendorStatus = 'Can you tell me if the supplier Poppulo is set up in SAP for NL location?';
const Help = 'Help';
var firstMessage = true;

// Create a custom prompt
var prompt = new builder.Prompt({ defaultRetryPrompt: "I'm sorry. I didn't recognize your search." })
    .onRecognize(function (context, callback) {
        // Call prompts recognizer
        recognizer.recognize(context, function (err, result) {
            // If the intent returned isn't the 'None' intent return it
            // as the prompts response.
            if (result && result.intent !== 'None') {
                callback(null, result.score, result);
            } else {
                callback(null, 0.0);
            }
        });
    });

// Add your prompt as a dialog to your bot
bot.dialog('myLuisPrompt', prompt);

// Add function for calling your prompt from anywhere
builder.Prompts.myLuisPrompt = function (session, prompt, options) {
    var args = options || {};
    args.prompt = prompt || options.prompt;
    session.beginDialog('myLuisPrompt', args);
}

bot.on('conversationUpdate', (message) => {
    if (message.membersAdded && firstMessage) {
        const hello = new builder.Message()
            .address(message.address)
            .text("Hello! Welcome to the Purchase Helper Bot.");
        bot.send(hello);
        bot.beginDialog(message.address, 'Help');
        firstMessage = false;
    }
});

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

// bot.dialog('Vendor Availability', [
//     function (session, args, next) {
//         session.sendTyping();

//         // try extracting entities
//         var systemEntity, supplierEntity, locationEntity;

//         if(session.privateConversationData.hasOwnProperty('System'))
//             systemEntity = session.privateConversationData.System
//         else
//             systemEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'System');
//         if(session.privateConversationData.hasOwnProperty('Supplier'))
//             supplierEntity = session.privateConversationData.Supplier
//         else
//             systemEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'Supplier');
//         if(session.privateConversationData.hasOwnProperty('Location'))
//             locationEntity = session.privateConversationData.Location;
//         else
//             systemEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'Location');

//         if (systemEntity && !supplierEntity) {
//             // Supplier entity not detected, ask the user
//             session.privateConversationData.searchType = 'Supplier';
//             session.privateConversationData.system = systemEntity.entity;
//             builder.Prompts.text(session, 'Which supplier / vendor do you want to know about?');
//         } else if (!systemEntity && supplierEntity) {
//             // System entity not detected, ask the user
//             session.privateConversationData.searchType = 'System';
//             session.privateConversationData.supplier = supplierEntity.entity;
//             builder.Prompts.text(session, 'in which system?');
//         } else if (!systemEntity && !supplierEntity) {
//             // no entities detected, ask user for inputs
//             session.privateConversationData.searchType = 'Supplier-n-System';
//             builder.Prompts.text(session, 'Please enter supplier name and system name...');
//         } else {
//             // Both the entities are present. Check if country is given. Else ask for country.
//             if(!locationEntity){
//                 // list all the available countries
//                 axios.post('10.138.89.49', {"system": systemEntity, "supplier": supplierEntity, "location": locationEntity})
//                 .then(function (response) {
//                     console.log(response);
//                     session.send("Here you go! " + response);
//                 })
//                 .catch(function (error) {
//                     console.log("===========********========= ERROR ===========********=========", error);
//                 });

//             }else{
//                 // proceed with System, Supplier and Location
//                 next({ response: [systemEntity.entity, supplierEntity.entity, locationEntity.entity], next: next });
//             }
//         }
//     },
//     function (session, results, next) {
//         console.log("Response: ", results.response);

//         switch(session.privateConversationData.searchType){
//             case "Supplier":
//                 next({ response: [session.privateConversationData.system, results.response] });
//             break;
//             case "System":
//                 next({ response: [results.response, session.privateConversationData.supplier] });
//             break;
//             case "Supplier-n-System":
//                 console.log("Response for supplier and system ----**######***--->", results.response);
//                 next({ response: ["Poppulo", "SAP"] });
//             break;
//             default:
//                 next({ response: results.response });
//             break;

//         }
//     },
//     function (session, results) {
//         var system = results.response[0];
//         var supplier = results.response[1];

//         var message = 'Looking for the setup...';

//         console.log("results: --------> ", results);

//         session.send(message);

//         var setup = Math.random() >= 0.5;

//         if(setup)
//             message = "Yes! Setup has been identified."
//         else
//             message = "There is no setup in " + system + " for " + supplier;
//         session.send(message);
//         session.endDialog();
//     }
// ])
// .triggerAction({
//     matches: 'Vendor Availability',
//     onInterrupted: function (session) {
//         session.send('Please provide supplier name and system name');
//     }
// });

bot.dialog('Vendor Availability', [
    function (session, args, next) {
        session.sendTyping();

        if(!session.privateConversationData.hasOwnProperty('vendorParams')){
            session.privateConversationData.vendorParams = {};
            session.privateConversationData.vendorParams.System = builder.EntityRecognizer.findEntity(args.intent.entities, 'System').entity;
            session.privateConversationData.vendorParams.Supplier = builder.EntityRecognizer.findEntity(args.intent.entities, 'Supplier').entity;
            session.privateConversationData.vendorParams.Location = builder.EntityRecognizer.findEntity(args.intent.entities, 'Location').entity;
        }

        if(!session.privateConversationData.vendorParams.hasOwnProperty('Supplier'))
            builder.Prompts.text(session, 'Which supplier / vendor do you want to know about?');
        else
            next();

    },
    function (session, results, next) {
        session.sendTyping();

        console.log("### User reply for the Supplier query: ", results);

        if(results.hasOwnProperty('response')){
            session.privateConversationData.vendorParams.Supplier = results.response;
        }

        if(!session.privateConversationData.vendorParams.hasOwnProperty('System'))
            builder.Prompts.text(session, 'in which system?');
        else
            next();

    },
    function (session, results) {
        session.sendTyping();

        console.log("### User reply for the System query: ", results);

        if(results.hasOwnProperty('response')){
            session.privateConversationData.vendorParams.System = results.response;
        }

        var systemEntity = session.privateConversationData.vendorParams.System
        var supplierEntity = session.privateConversationData.vendorParams.Supplier
        var locationEntity = session.privateConversationData.vendorParams.Location
        var availableCountries = [];
        
        axios.post('http://10.138.89.49', {"system": systemEntity, "supplier": supplierEntity})
        .then(function (response) {
            console.log(response);
            session.send("Here you go! " + response);
            availableCountries = response.location;
        })
        .catch(function (error) {
            console.log("===========********========= ERROR ===========********=========", error);
        });

        if(!session.privateConversationData.vendorParams.hasOwnProperty('Location')){
            // list all the available countries
            session.send("Yes! The setup is avilable for " + response);
        }
        else{
            
            // check for System, Supplier and Location
            if (locationEntity in response.location){
                session.send("Yes");
            }else{
                session.send("Sorry. Not available.");
            }
            
        }

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
            [VendorStatus, PRForm, EmailQuotes, POStatus],
            { listStyle: builder.ListStyle.button });
        session.endDialog();
    },
    function (session, result) {
        if (result.response) {
            switch (result.response.entity) {
                case POStatus:
                    session.send('This functionality is not yet implemented! Try resetting your password.');
                    session.reset();
                    break;
                case VendorStatus:
                    session.beginDialog('Vendor Availability', result);
                    break;
                case PRForm:
                    session.send('This functionality is not yet implemented! Try resetting your password.');
                    session.reset();
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
                [VendorStatus, PRForm, POStatus, EmailQuotes],
                { listStyle: builder.ListStyle.button });
            session.reset();
        }
    }
]).triggerAction({
    matches: /^help$/i
});

bot.dialog('Greeting', function (session) {
    session.send('Hi. I\'m a bot. I can help you with queries regarding the PR form.');
    session.beginDialog('Help');
}).triggerAction({
    matches: /^greeting$/i
});

bot.dialog('PO Status', function (session) {
    PO_Statuses = ['pending with the vendor.', 'pending with the purchase team.', 'approved!'];
    var POStatus = PO_Statuses[Math.floor(Math.random() * PO_Statuses.length)];
    session.send('It is ' + POStatus);
    session.endDialog();
}).triggerAction({
    matches: 'PO Status'
});

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

// Helpers
function hotelAsAttachment(hotel) {
    return new builder.HeroCard()
        .title(hotel.name)
        .subtitle('%d stars. %d reviews. From $%d per night.', hotel.rating, hotel.numberOfReviews, hotel.priceStarting)
        .images([new builder.CardImage().url(hotel.image)])
        .buttons([
            new builder.CardAction()
                .title('More details')
                .type('openUrl')
                .value('https://www.bing.com/search?q=hotels+in+' + encodeURIComponent(hotel.location))
        ]);
}

function reviewAsAttachment(review) {
    return new builder.ThumbnailCard()
        .title(review.title)
        .text(review.text)
        .images([new builder.CardImage().url(review.image)]);
}
