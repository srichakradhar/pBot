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

var bot = new builder.UniversalBot(connector);
// , function (session) {
//     // clearTimeout(busyTimer);
//     session.endDialog('Sorry, I did not understand \'%s\'. Type \'help\' if you need assistance.', session.message.text);
// }

// You can provide your own model by specifing the 'LUIS_MODEL_URL' environment variable
// This Url can be obtained by uploading or creating your model from the LUIS portal: https://www.luis.ai/
var recognizer = new builder.LuisRecognizer(process.env.LUIS_MODEL_URL);
// bot.recognizer(recognizer);
var regExHwRU = new builder.RegExpRecognizer('How are you', /.*how are you.*/i); 
var regExThx = new builder.RegExpRecognizer('Thank You', /.*thank( you|s).*/i); 
var regVendorID = new builder.RegExpRecognizer('Vendor ID Lookup', /.*vendor id lookup.*/i); 
var regVendorName = new builder.RegExpRecognizer('Vendor Name Lookup', /.*vendor Name lookup.*/i); 
var regPRPODetails = new builder.RegExpRecognizer('Vendor Name Lookup', /.*pr po details.*/i); 
var regPODetails = new builder.RegExpRecognizer('Vendor Name Lookup', /.*(?!pr) po details.*/i); 

var intents = new builder.IntentDialog({ recognizers: [regExHwRU, regExThx, regVendorID, regVendorName, regPRPODetails, regPODetails, recognizer],
    recognizeOrder: 'series' })
.matches('How are you',(session,args)=>{
    console.log(args);
    session.endDialog('Very excited to talk to you! 🙂');
})
.matches('Thank You',(session,args)=>{
    console.log(args);
    session.endDialog('My Pleasure 😊');
}).matches('Greeting', 'Greeting')
.matches('Help', 'Help')
.matches('Vendor Availability', 'Vendor Availability')
.matches('Email Quote', 'Email Quote')
.matches('PO Status', 'PO Status')
.matches('Latest PR Form', 'Latest PR Form')
.matches('Vendor ID Lookup', 'Vendor ID Lookup')
.matches('Vendor Name Lookup', 'Vendor Name Lookup')
.matches('Domain Contact', 'Domain Contact')
.matches('PR PO Details', 'PR PO Details')
.matches('PO Details', 'PO Details');

bot.dialog('/', intents).onDefault(session => session.send('no match found'));

bot.use({
    botbuilder: function (session, next) {
        session.send(); // it doesn't work without this..
        session.sendTyping();
        next();
    }
    // send: function (event, next) {
    //     myMiddleware.logOutgoingMessage(event, next);
    // }
});

// const PRForm = 'I need information on PR Form';
const POStatus = 'PR Status';
const EmailQuotes = 'Email Quotes';
const VendorAvailability = 'Vendor Setup';
const VendorIDLookup = 'Vendor ID lookup';
const VendorNameLookup = 'Vendor Name lookup';
const LatestPRForm = 'Latest PR Form';
const Help = 'Help';
var firstMessage = true;
var firstConversationUpdate = true;
const runningLocally = false;

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
    if (message.membersAdded && firstConversationUpdate) {
        // const hello = new builder.Message()
        //     .address(message.address)
        //     .text("Hello! Welcome to the Purchase Helper Bot.");
        // bot.send(hello);
        bot.beginDialog(message.address, 'Greeting');
        firstConversationUpdate = false;
    }
});
// var firstMessage = true;
// var busyTimer;
// bot.on('conversationUpdate', (message) => {
//     if (message.membersAdded && firstMessage){
//         const hello = new builder.Message()
//             .address(message.address)
//             .text("Hello! Welcome to the considerate bot...");
//         bot.send(hello);
//         busyTimer = setTimeout(() => {
//             bot.send(new builder.Message()
//                 .address(message.address)
//                 .text("oops you are busy bye bye!"));
//         }, 10000);
//         firstMessage = false;
//     }
// });
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
var vendorParams = {};
var availableSystems = ['ariba', 'sap', 'unix'];
var availableSuppliers = ['poppulo', 'ibm', 'tcs', 'amazon'];
bot.dialog('Vendor Availability', [
    function (session, args, next) {

        var systemEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'System');
        var supplierEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'Supplier');
        var locationEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'Location');
        vendorParams = session.privateConversationData.vendorParams;

        if(!session.privateConversationData.hasOwnProperty('vendorParams')){
            vendorParams = {};
            if(systemEntity !== null) vendorParams.System = systemEntity.entity;
            if(supplierEntity !== null) vendorParams.Supplier = supplierEntity.entity;
            if(locationEntity !== null) vendorParams.Location = locationEntity.entity;
        }else{
            if(vendorParams.hasOwnProperty('System') && vendorParams.System !== null)
                systemEntity = vendorParams.System
            else
                systemEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'System');
            if(vendorParams.hasOwnProperty('Supplier') && vendorParams.Supplier !== null)
                supplierEntity = vendorParams.Supplier
            else
                supplierEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'Supplier');
            if(vendorParams.hasOwnProperty('Location') && vendorParams.Location !== null)
                locationEntity = vendorParams.Location;
            else
                locationEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'Location');
        }

        if(!vendorParams.hasOwnProperty('Supplier'))
            builder.Prompts.text(session, 'Which supplier / vendor do you want to know about?');
        else
            next();

    },
    // function (session, results, next) {

    //     console.log("### User reply for the Supplier query: ", results);

    //     if(results.hasOwnProperty('response')){
    //         vendorParams.Supplier = results.response;
    //         if(!results.response in availableSuppliers) next({ resumed: builder.ResumeReason.back })
    //     }

    //     if(!vendorParams.hasOwnProperty('System'))
    //         builder.Prompts.choice(session, 'in which system?',
    //                             ["Ariba", "mySupply"],
    //                             { listStyle: builder.ListStyle.button });
    //     else
    //         next();

    // },
    function (session, results) {

        console.log("### User reply for the System query: ", results);

        if(results.hasOwnProperty('response')){
            vendorParams.System = results.response;

            // if the system is registered proceed, else go back.
            if(!results.response in availableSystems) next({ resumed: builder.ResumeReason.back });
        }

        var systemEntity = vendorParams.System
        var supplierEntity = vendorParams.Supplier
        var locationEntity = vendorParams.Location
        var availableCountries = ['in', 'us', 'uk'];
        
        session.sendTyping();
        if(runningLocally){
            axios.post('http://10.138.89.49:8080/chatbot/getdata', {"system": systemEntity.entity, "supplier": "poppulo"})
            .then(function (response) {
                console.log(response);
                session.send("Here you go! " + response);
                availableCountries = response.countries;

                if(vendorParams.hasOwnProperty('Location')  && vendorParams.Location !== null){
                    // check for System, Supplier and Location
                    if (locationEntity in availableCountries){
                        session.send("Yes");
                    }else{
                        session.send("Sorry. We have the setup only for " + availableCountries);
                    }
                }
                else{
                    // list all the available countries
                    session.send("Yes! We have the supplier " + vendorParams.Supplier + 
                    " providing services in these countries: " + availableCountries.map(function(x) { return x.toUpperCase(); }));                
                }
        
                session.endDialog();
            })
            .catch(function (error) {
                console.log("===========********========= ERROR ===========********=========", error);
                session.endDialog("REST Server is not available! Please come back later.");
            });
            
        }else{
            console.log(vendorParams);
            if(vendorParams.hasOwnProperty('Location')  && vendorParams.Location !== null){
                // check for System, Supplier and Location
                if (locationEntity in availableCountries){
                    session.endDialog("Yes");
                }else{
                    session.endDialog("Sorry. We have the setup only for " + availableCountries.map(function(x) { return x.toUpperCase(); }));
                }
            }
            else{
                // list all the available countries
                session.endDialog("Yes! We have the supplier " + vendorParams.Supplier + 
                " providing services in these countries: " + availableCountries.map(function(x) { return x.toUpperCase(); }));
            }
        }
    }
]).triggerAction({
    matches: 'Vendor Availability',
    onInterrupted: function (session) {
        session.send('Please provide supplier name and system name');
    }
});

var greetings = ['Hi 👋 I can help you with the Purchase Request form related queries.','Hi. I can assist you with the PR Form queries', 'Hi. Ask me your queries on PR Form.', 'Hi. I just finshed my traning. Please go ahead and test me with your PR Form queries.', 'Hi .I\'m Paro the PR bot. Memory 12GB. Speed 2.4GHz. dot.'];
bot.dialog('Help', [
    function (session) {
        builder.Prompts.choice(session,
            greetings[Math.floor(Math.random() * greetings.length)],
            [VendorAvailability, POStatus, LatestPRForm, VendorIDLookup, VendorNameLookup],
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
                case VendorAvailability:
                    session.beginDialog('Vendor Availability', result);
                    break;
                // case PRForm:
                //     session.send('This functionality is not yet implemented! Try resetting your password.');
                //     session.reset();
                //     break;
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
                [VendorAvailability, POStatus, EmailQuotes],
                { listStyle: builder.ListStyle.button });
            session.reset();
        }
    }
]).triggerAction({
    matches: 'Help'
});

bot.dialog('Greeting', function (session) {
    if(!firstMessage)
        session.beginDialog('Help');
    else{
        session.endDialog('Hello there! Good day. I am Paro, the PR helper bot.');
        firstMessage = false;
    }
    session.endDialog();
}).triggerAction({
    matches: 'Greeting'
});

const acceptEmailQuotes = true;
bot.dialog('Email Quote', function (session) {
    if(acceptEmailQuotes)
        session.send('Yes. We accept email quotes.');
    else
        session.send('No. We don\'t accept email quotes.');
    session.endDialog();
}).triggerAction({
    matches: 'Email Quote'
});

bot.dialog('PO Status', [
    function (session, args, next) {
        var PREntity = builder.EntityRecognizer.findEntity(args.entities, 'PR Number');
        if(session.privateConversationData.hasOwnProperty('PREntity') && session.privateConversationData.PREntity !== null){
            next();
        }else{
            if(PREntity !== null) next({ response: PREntity.entity });
            else builder.Prompts.text(session, 'What is the PR number?');
        }
    },
    function (session, results) {
        PO_Statuses = ['pending with the vendor.', 'pending with the purchase team.', 'approved!', 'awaiting renee glenn approval.'];
        var POStatus = PO_Statuses[Math.floor(Math.random() * PO_Statuses.length)];
        session.send(results.response + ' is ' + POStatus);
        session.endDialog();
    }
]).triggerAction({
    matches: 'PO Status'
});

bot.dialog('Latest PR Form', function (session) {
    session.send("Here is the latest version of the PR Form.");
    session.endDialog(new builder.Message(session)
    .addAttachment({
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        contentUrl: 'http://sites.tcs.com/investorsdocs/TCS_Data_Sheet.xlsx',
        name: 'latest PR Form.xlsx'
    }));
}).triggerAction({
    matches: 'Latest PR Form'
});

bot.dialog('Domain Contact', [
    function (session, args, next) {
        fieldEntity = builder.EntityRecognizer.findEntity(args.entities, 'Field');
        if(fieldEntity.entity.toLowerCase() == "rff id" || fieldEntity.entity.toLowerCase() == "rffid" )
            session.send("The RFF ID is associated with the IT Rolling Financial Forecast. Each IT Domain has an RFF. If you are not familiar with the RFF or don't know the correct ID, please work with your Business Manager.");
        builder.Prompts.choice(session,
            'To get the you business manager contact, please provide the domain:',
            ["Cyber Security", "Enterprise IT Solutions & Architechture", "Manufacturing IT Solutions", "Mergers & Aquisitions and OCIO", "R&D IT Solutions", "Infrastrucure IT Solutions"],
            { listStyle: builder.ListStyle.button });
        },

    function (session, result) {

        if (result.response) {
            var contact = '';
            switch (result.response.entity) {
                case "Cyber Security":
                    contact = 'Sylvia Lang';
                    break;
                case "Enterprise IT Solutions & Architechture":
                    contact = 'Cindy Mays';
                    break;
                case "Manufacturing IT Solutions":
                    contact = 'Michelle Ortiz';
                    break;
                case "Mergers & Aquisitions and OCIO":
                    contact = 'Lynn Buehlr';
                    break;
                case "R&D IT Solutions":
                    contact = 'Sylvia Lang';
                    break;
                case "Infrastrucure IT Solutions":
                    contact = "Gaylene Covarrubias & Lu Ann Summers"
            }
            session.endDialog("Please contact " + contact + ".")
        } else {
            session.endDialog('Sorry, I did not understand \'%s\'. Type \'help\' if you need assistance.', session.message.text);
        }
    }
]).triggerAction({
    matches: 'Domain Contact'
});

var vendorIDs = {'poppulo': 804147852, 'tcs': 984802354, 'amazon': 94246758, 'ibm': 456873154};
bot.dialog('Vendor ID Lookup', function (session, args) {
    vendorID = builder.EntityRecognizer.findEntity(args.intent.entities, 'Supplier').entity;
    if(vendorID in vendorIDs)
        session.endDialog("It is " + vendorIDs[vendorID]);
    else
        session.endDialog("Sorry. This vendor is not available in our system. Please make sure you have spelt the vendor name correctly.");
}).triggerAction({
    matches: 'Vendor ID Lookup'
});

var vendorNumbers = {804147852: 'poppulo', 984802354: 'tcs', 94246758: 'amazon', 456873154: 'ibm'};
bot.dialog('Vendor Name Lookup', [ function (session, args, next) {
    var vendorNumberEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'Vendor Number');
    
    if(vendorNumberEntity == null)
        builder.Prompts.text("May I know the Vendor ID please?");
    else
        next({response: vendorNumberEntity.entity});
},
function (session, results) {

    var vendorNumber = results.response;

    if(vendorNumber in vendorNumbers)
        session.endDialog("It is " + vendorNumbers[vendorNumber]);
    else
        session.endDialog("Sorry. This vendor id is not available in our system. Please make sure you have provided the vendor id correctly.");

}]).triggerAction({
    matches: 'Vendor Name Lookup'
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
