var opcua = require("node-opcua");
var async = require("async");



//var endpointUrl = "opc.tcp://172.16.174.95:4334"; //change
var the_session = null;

var opc_items = new Array();
var items_idx = 0;
var monitored_items = new Array();

var opc_start = 'ns=1;s=161744'; //change

var newDP = null;
// var client = new opcua.OPCUAClient();

let endpointUrl = 'opc.tcp://commsvr.com:51234/UA/CAS_UA_Server';
async.series([
        // step 1 : connect to
        function(callback) {
            let endpointUrlArr = ['opc.tcp://opcuademo.sterfive.com:26543', 'opc.tcp://commsvr.com:51234/UA/CAS_UA_Server']

            for (let i = 0; i < endpointUrlArr.length; i++) {
                let client = new opcua.OPCUAClient();
                endpointUrl = endpointUrlArr[i];
                console.log("endpointUrl:" + endpointUrl);
                client.connect(endpointUrl, function(err) {
                    if (err) {
                        console.log(" cannot connect to endpoint :", endpointUrl);
                    } else {
                        console.log("connected !");
                    }
                    //callback(err);
                });

            }
        },

        // step 2 : createSession
        function(callback) {
            client.createSession(function(err, session) {
                if (!err) {
                    the_session = session;
                    //console.log("session:" + session);
                }
                callback(err);
            });
        },

        // // step 3 : browse
        // function(callback) {
        //     the_session.browse("RootFolder", function(err, browseResult) {
        //         if (!err) {
        //             browseResult.references.forEach(function(reference) {
        //                 console.log(reference.browseName.toString());
        //             });
        //         }
        //         callback(err);
        //     });
        // },

        // step 4' : read a variable with read
        // async function(callback) {
        //     var maxAge = 0;
        //     var nodeToRead = {
        //         nodeId: nodeId,
        //         attributeId: opcua.AttributeIds.Value
        //     };

        //     let val = await the_session.read(nodeToRead);
        //     console.log("before update:" + val);

        // dataToWrite = {
        //     dataType: "Double",
        //     value: 25.0
        // }

        // let risultato = await the_session.writeSingleNode(nodeId, dataToWrite)
        // console.log("risultato:" + risultato);

        // val = await the_session.read({
        //     nodeId: nodeId
        // })
        // console.log("after update:" + val.value.value)



        //},

        // function(callback) {
        //     the_session.readVariableValue(nodeId, function(err, dataValue) {
        //         if (!err) {
        //             console.log("value = ", dataValue.value.value.toString());
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

        // // close session
        // function(callback) {
        //     the_session.close(function(err) {
        //         if (err) {
        //             console.log("session closed failed ?");
        //         }
        //         callback();
        //     });
        // }
    ],
    function(err) {
        if (err) {
            console.log(" failure ", err);
        } else {
            console.log("done!");
        }
        client.disconnect(function() {});
    });