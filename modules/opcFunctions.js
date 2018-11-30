const opcua = require("node-opcua");
const async = require("async");
const path = require('path');
const fs = require('fs');
const readline = require('readline');
let the_session;
let the_subscription;
let client = new opcua.OPCUAClient();

let endpointUrl = 'opc.tcp://172.20.60.39:4840';
let loginInfo = {
    userName: 'admin',
    password: 'loytec4u'
}

let nodeId = "";

// step 1 : connect to
exports.createConnection = (callback) => {
    client.connect(endpointUrl, function(err) {
        if (err) {
            console.log(" cannot connect to endpoint :", endpointUrl);
        } else {
            console.log("connected !");
        }
        callback(err);
    });
}

// step 2 : createSession
exports.createSession = (callback) => {
    client.createSession(loginInfo, function(err, session) {
        if (!err) {
            the_session = session;
        }
        callback(err);
    });
}

// step 3 : browse
exports.browse = (callback) => {
    the_session.browse("RootFolder", function(err, browseResult) {
        if (!err) {
            browseResult.references.forEach(function(reference) {
                console.log(reference.browseName.toString());
            });
        }
        callback(err);
    });
}

// step 4 : read a variable with readVariableValuerr
exports.readValue = () => {
    let arr = ["ns=1;i=372400", "ns=1;i=368000"]
    the_session.readVariableValue(arr, function(err, dataValue) {
        if (!err) {
            for (let i = 0; i < arr.length; i++) {
                console.log("after update value = " +
                    dataValue[i].value.value.toString());
                //console.log("after update value = ", dataValue.value.value.toString());
            }
        }
        // callback(err);
    });
}

// step 5: install a subscription and install a monitored item for 10 seconds
exports.installsubscription = (callback) => {
    the_subscription = new opcua.ClientSubscription(the_session, {
        requestedPublishingInterval: 1000,
        requestedLifetimeCount: 10,
        requestedMaxKeepAliveCount: 2,
        maxNotificationsPerPublish: 10,
        publishingEnabled: true,
        priority: 10
    });

    the_subscription.on("started", function() {
        console.log("subscription started for 2 seconds - subscriptionId=", the_subscription.subscriptionId);
    }).on("keepalive", function() {
        //console.log("keepalive");
    }).on("terminated", function() {});

    // setTimeout(function() {
    //     the_subscription.terminate(callback);
    // }, 10000);

    // install monitored item
    var monitoredItem = the_subscription.monitor({
            nodeId: opcua.resolveNodeId(nodeId),
            attributeId: opcua.AttributeIds.Value
        }, {
            samplingInterval: 100,
            discardOldest: true,
            queueSize: 10
        },
        opcua.read_service.TimestampsToReturn.Both
    );
    console.log("----------------------------------------------------------------");

    monitoredItem.on("changed", function(dataValue) {
        console.log("value change = ", dataValue.value.value);
    });
}

//step 6 close session
exports.closeSession = (callback) => {
    the_session.close(function(err) {
        if (err) {
            console.log("session closed failed ?");
        }
        callback();
    });
}

//step 7 disconnection
exports.disConnection = (err) => {
    if (err) {
        console.log(" failure ", err);
    } else {
        console.log("done!");
    }
    client.disconnect(function() {});
}



exports.the_session;
exports.the_subscription;
exports.client;