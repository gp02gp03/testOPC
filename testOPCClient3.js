const opcua = require("node-opcua");
const async = require("async");
const fs = require('fs');
const readline = require('readline');
const mqtt = require('mqtt');
const url = require('url');

const AttributeIds = opcua.AttributeIds;
const OPCUAClient = opcua.OPCUAClient;

let nodeId = "";

// let endpointUrl = '';
// let nodeIdArr = [];
// let loginInfo = {};

function readCsvFile() {
    const path = './OPC/NodeID-info/';
    //const path = './NodeID-info/';
    let promiseArr = [];
    fs.readdir(path, function(err, files) {
        if (err) {
            console.log(err);
            return;
        }
        for (let i = 0; i < files.length; i++) {
            try {
                let connetInfo = {
                    endpointUrl: '',
                    loginInfo: {},
                    nodeIdArr: []
                }
                const myPromise = new Promise(function(resolve, reject) {
                    const rl = readline.createInterface({
                        input: fs.createReadStream(path + files[i])
                    });
                    rl.on('line', (line) => {
                        nodeId = line.split(",")[4];
                        if (nodeId !== 'NodeId') {
                            //console.log(nodeId);
                            connetInfo.nodeIdArr.push(nodeId);
                            connetInfo.endpointUrl = line.split(",")[0];
                            connetInfo.loginInfo.userName = line.split(",")[1];
                            connetInfo.loginInfo.password = line.split(",")[2];
                            //console.log(connetInfo);
                            resolve(connetInfo);
                        }
                    })
                })
                promiseArr.push(myPromise);
            } catch (err) {
                console.log("err:" + err);
                continue;
            } finally {
                console.log("read file:" + files[i] + " ok!");
            }
        }
        Promise.all(promiseArr).then(values => {
            //console.log(values);

            dataInitial(values);
        });
    });
}

async function creatConnection(connetInfo, action) {
    //console.log(connetInfo);
    for (let i = 0; i < connetInfo.length; i++) {
        const client = new OPCUAClient();
        await client.connect(connetInfo[i].endpointUrl);
        //console.log(connetInfo[i].endpointUrl);
        let username = connetInfo[i].loginInfo.userName;
        let password = connetInfo[i].loginInfo.password
        if (username === '' || password === '') {
            session = await client.createSession();
        } else {
            session = await client.createSession(connetInfo[i].loginInfo);
        }

        // console.log("session:" + session);
        //action = "write";

        action == 'read' ? await readData(connetInfo[i], client, session) : await writeData(connetInfo[i], client, session);

    }
}

//read data need input nodeId array
async function readData(connetInfo, client, session) {
    //console.log(connetInfo);

    let nodeId = "";
    for (let i = 0; i < connetInfo.nodeIdArr.length; i++) {
        nodeId = connetInfo.nodeIdArr[i].toString();
        //console.log("nodeId:" + nodeId);
        const dataValue = await session.readVariableValue(nodeId);
        console.log("nodeId:" + nodeId + "/value=", dataValue.value.value.toString() + " => read OK!");
    }

    // session.readVariableValue(connetInfo.nodeIdArr, function(err, dataValue) {
    //     if (!err) {
    //         for (let i = 0; i < connetInfo.nodeIdArr.length; i++) {
    //             console.log("nodeId:" + nodeId + "/value=", dataValue[i].value.value.toString() + " => read OK!");
    //         }
    //     } else {
    //         console.log("err:" + err);
    //     }
    // });

    await closeConnection(client, session);

}

// to write value to multi node
async function writeData(connetInfo, client, session) {
    let nodesToWriteArr = [];
    let count = 0;
    let nodeId = '';
    let message = '';
    let nodeIdMap = new Map();
    nodeIdMap.set("ns=1;i=368000", "0.0");
    nodeIdMap.set("ns=1;i=372400", "0.0");

    //create nodeToWrite Object 
    nodeIdMap.forEach(function(value, key) {
        //console.log(key, value);
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
    session.write(nodesToWriteArr, function(err, statusCodes) {
        if (!err) {
            for (let i = 0; i < nodesToWriteArr.length; i++) {
                //console.log(statusCodes);
                nodeId = nodesToWriteArr[i].nodeId;
                message = "nodeId:" + nodeId + "/value=" + nodesToWriteArr[i].value.value.value.toString() + " => write OK!";
                console.log("write data message:" + message);
                nodesToWriteArr[i] = null;
            }
            nodesToWriteArr = null;
        } else {
            let message = err;
        }

        //透過MQTT回傳寫入成功訊息
        mqttHandler('mqtt://172.29.36.13:1883', 'presence', message);
    });

    await closeConnection(client, session);
}

async function closeConnection(client, session) {
    await client.closeSession(session, true);
    await client.disconnect(function() {});


    // session.close(function(err) {
    //     if (err) {
    //         console.log("session closed failed ?");
    //     } else {
    //         console.log("session has closed done!");
    //         client.disconnect(function() {});
    //     }
    // });

}

const dataInitial = (arr) => {
    let allConnetInfo = arr; //初始化所有的server連線資訊
    //console.log(connetInfo);


    //讀取所有server資料點資料
    creatConnection(allConnetInfo, "read");

}

//找尋要讀/寫的連線資訊 (如果只傳回nodeId跟value的話)
const findConnetInfo = () => {

}

const mqttHandler = (brokerp_path, topic, message) => {
    let url = brokerp_path;
    let options = {
        port: 1883,
        clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
        username: 'opcua',
        password: '<dhvac1@#>',
    };

    // Create a client connection
    let client = mqtt.connect(url, options);

    client.on('connect', function() { // When connected

        // subscribe to a topic
        client.subscribe(topic, function() {
            console.log("Message is subscribed");
            // when a message arrives, do something with it
            client.on('message', function(topic, message, packet) {
                console.log("Received:'" + message + "' on '" + topic + "'");

                /*收到資料後進行處理解析後
                 1. 若只收到nodeId跟value值要進行endpointUrl的反查
                 2. creatConnection
                 3. 查出endpointUrl後
                 4. 帶入action(write) =>writeData
                 5. closeConnection
                */

            });
        });

        // publish a message to a topic
        client.publish(topic, message, function() {
            console.log("Message is published");
            client.end(); // Close the connection when published
        });
    });

}

(function main() {

    readCsvFile();

})();