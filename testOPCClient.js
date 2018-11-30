'use strict'
const opcua = require("node-opcua");
const async = require("async");
const path = require('path');
const fs = require('fs');

const readline = require('readline');

let the_session;
let the_subscription;

let loginInfo = {
    userName: 'admin',
    password: 'loytec4u'
}

let client = new opcua.OPCUAClient();

// const endpointUrl = 'opc.tcp://172.20.60.39:4840';
// let nodeId = "ns=1;i=368000";

const endpointUrl = 'opc.tcp://172.16.174.95:4840';
let nodeId = "";

// const endpointUrl = 'opc.tcp://SGMSAZDEVUWEB01.delta.corp:4334/UA/MyLittleServer';
// const nodeId = "ns=1;b=1020FFAA";

// console.log("endpointUrl:" + endpointUrl);

async.series([
        // step 1 : connect to
        function(callback) {
            client.connect(endpointUrl, function(err) {
                if (err) {
                    console.log(" cannot connect to endpoint :", endpointUrl);
                } else {
                    console.log("connected !");
                }
                callback(err);
            });
        },

        // step 2 : createSession
        function(callback) {
            client.createSession(loginInfo, function(err, session) {
                if (!err) {
                    the_session = session;
                }
                callback(err);
            });
        },

        // step 3 : browse
        function(callback) {
            the_session.browse("RootFolder", function(err, browseResult) {
                if (!err) {
                    browseResult.references.forEach(function(reference) {
                        console.log(reference.browseName.toString());
                    });
                }
                callback(err);
            });
        },

        // step 4 : read a variable with readVariableValue
        function(callback) {
            let DP_Path = '';
            let nodeIdList = [];
            let lineCount = 0;
            let rowColumn = 0;
            const rl = readline.createInterface({
                input: fs.createReadStream('./NodeID-info/DEJ-Node-ID.csv')
            });
            rl.on('line', (line) => {
                lineCount += 1;
                //console.log('Line from file:', line.split(",")[1]); //csv first column (NodeId)
                if (lineCount === 1) {
                    rowColumn = line.split(",").length;
                    //console.log("rowColumn:" + rowColumn);
                } else {
                    setInterval(function() {
                        for (let i = 0; i < rowColumn; i++) {
                            if (i === rowColumn - 1) { //nodeId at last column
                                nodeId = line.split(",")[rowColumn - 1].toString().trim();
                                //console.log("nodeId:" + nodeId);
                                (function(nodeId) {
                                    the_session.readVariableValue(nodeId, function(err, dataValue) {
                                        if (!err) {
                                            console.log("nodeId:" + nodeId + "/value= ", dataValue.value.value.toString());
                                        }
                                        //callback(err);
                                    });
                                })(nodeId);
                            }
                        }
                    }, 3000);
                }
            });
        },

        // // step 4' : read a variable with read
        // function(callback) {
        //     var maxAge = 0;
        //     var nodeToRead = {
        //         nodeId: nodeId,
        //         attributeId: opcua.AttributeIds.Value
        //     };
        //     the_session.read(nodeToRead, maxAge, function(err, dataValue) {
        //         if (!err) {
        //             console.log("value % = ", dataValue.toString());
        //             console.log("get first value = " + dataValue.value.value);
        //         }
        //         callback(err);
        //     });

        // },

        // // step 5: install a subscription and install a monitored item for 10 seconds
        // function(callback) {
        //     the_subscription = new opcua.ClientSubscription(the_session, {
        //         requestedPublishingInterval: 1000,
        //         requestedLifetimeCount: 10,
        //         requestedMaxKeepAliveCount: 2,
        //         maxNotificationsPerPublish: 10,
        //         publishingEnabled: true,
        //         priority: 10
        //     });

        //     the_subscription.on("started", function() {
        //         console.log("subscription started for 2 seconds - subscriptionId=", the_subscription.subscriptionId);
        //     }).on("keepalive", function() {
        //         //console.log("keepalive");
        //     }).on("terminated", function() {});

        //     // setTimeout(function() {
        //     //     the_subscription.terminate(callback);
        //     // }, 10000);

        //     // install monitored item
        //     var monitoredItem = the_subscription.monitor({
        //             nodeId: opcua.resolveNodeId(nodeId),
        //             attributeId: opcua.AttributeIds.Value
        //         }, {
        //             samplingInterval: 100,
        //             discardOldest: true,
        //             queueSize: 10
        //         },
        //         opcua.read_service.TimestampsToReturn.Both
        //     );
        //     console.log("----------------------------------------------------------------");

        //     monitoredItem.on("changed", function(dataValue) {
        //         console.log("value change = ", dataValue.value.value);
        //     });
        // },

        // close session
        function(callback) {
            the_session.close(function(err) {
                if (err) {
                    console.log("session closed failed ?");
                }
                callback();
            });
        }
    ],
    function(err) {
        if (err) {
            console.log(" failure ", err);
        } else {
            console.log("done!");
        }
        client.disconnect(function() {});
    });