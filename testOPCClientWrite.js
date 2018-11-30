'use strict'
const opcua = require("node-opcua");
const async = require("async");
const path = require('path');

const DataType = opcua.DataType;
const AttributeIds = opcua.AttributeIds;
const client = new opcua.OPCUAClient();
const endpointUrl = 'opc.tcp://172.20.60.39:4840';

let the_session;
let the_subscription;
// let nodeId = "ns=1;i=372448";

let loginInfo = {
    userName: 'admin',
    password: 'loytec4u'
}

let nodeIdMap = new Map();
nodeIdMap.set("ns=1;i=368000", "0.0");
nodeIdMap.set("ns=1;i=372400", "0.0");

let nodesToWriteArr = [];

let arr = ["ns=1;i=372400", "ns=1;i=368000"]

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

        //step 4 : before write to read
        function(callback) {
            the_session.readVariableValue(arr, function(err, dataValue) {
                if (!err) {
                    for (let i = 0; i < arr.length; i++) {
                        console.log("before write to read:" + dataValue[i].value.value.toString());
                        //console.log("after update value = ", dataValue.value.value.toString());
                    }
                }
                callback(err);
            });
        },

        // step 5: to write value to multi node
        function(callback) {
            nodesToWriteArr = [];
            let count = 0;

            //create nodeToWrite Object 
            nodeIdMap.forEach(function(value, key) {
                console.log(key, value);
                nodesToWriteArr.push({});
                nodesToWriteArr[count].nodeId = key;
                nodesToWriteArr[count].attributeId = opcua.AttributeIds.Value;
                nodesToWriteArr[count].indexRange = null;
                nodesToWriteArr[count].value = {
                    value: {
                        dataType: opcua.DataType.Double,
                        value: value
                    }
                }
                count++;
            });

            //console.log(nodesToWriteArr);
            the_session.write(nodesToWriteArr, function(err, statusCodes) {
                if (!err) {
                    for (let i = 0; i < nodesToWriteArr.length; i++) {
                        //console.log(statusCodes);
                        nodesToWriteArr[i] = null;
                    }
                    nodesToWriteArr = null;
                }
                callback(err);
            });
        },

        function(callback) {
            the_session.readVariableValue(arr, function(err, dataValue) {
                if (!err) {
                    for (let i = 0; i < arr.length; i++) {
                        console.log("after update value = " +
                            dataValue[i].value.value.toString());

                        //console.log("after update value = ", dataValue.value.value.toString());
                    }
                }
                callback(err);
            });
        },

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