const { initializeApp, cert } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");
const mqtt = require("mqtt");

const serviceAccount = require("./serviceAccountKey.json");

initializeApp({
  credential: cert(serviceAccount)
});

console.log("FIREBASE ADMIN INITIALIZED");

// USE THE SAME WORKING TOKEN FROM testToken.js
const deviceToken = "dEfwVPonTqCGCt76Ke7Cj3:APA91bHLe65lUGLvPAjMAsJtL6IMbn66_EmUdiSImccar_oSI3lM9kPIrkPdEwk6YiEA63x-TJTItFe2aDW_OptTWymWCn1-C8_o9emyAbo2fQO7-kOzo6w";

const client = mqtt.connect(
  "mqtts://0b7a0207350e48139ae6644afb704499.s1.eu.hivemq.cloud:8883",
  {
    username: "gasproject",
    password: "PritamGasproject@2003"
  }
);

let gasLeak = false;
let appOpened = false;
let alertTimer = null;


client.on("connect", () => {

  console.log("MQTT CONNECTED");

  client.subscribe("pritam/gas/#", (error) => {

    if (error) {

      console.log("MQTT SUBSCRIBE ERROR:", error);

    } else {

      console.log("LISTENING: pritam/gas/#");

    }

  });

});


async function sendGasAlert() {

  if (!gasLeak || appOpened) {

    return;

  }

  const fcmMessage = {

    notification: {

      title: "GAS LEAK ALERT",

      body: "DANGER! Gas leakage detected. Open the app immediately."

    },

    android: {

      priority: "high",

      notification: {

        sound: "default",

        defaultVibrateTimings: true,

        priority: "max"

      }

    },

    token: deviceToken

  };


  try {

    const response = await getMessaging().send(fcmMessage);

    console.log("FCM ALERT SENT");

    console.log(response);

  } catch (error) {

    console.log("FCM ERROR CODE:", error.code);

    console.log("FCM ERROR MESSAGE:", error.message);

  }

}


function startRepeatedAlerts() {

  if (alertTimer) {

    clearInterval(alertTimer);

  }

  sendGasAlert();

  alertTimer = setInterval(() => {

    sendGasAlert();

  }, 5000);

}


function stopRepeatedAlerts() {

  if (alertTimer) {

    clearInterval(alertTimer);

    alertTimer = null;

  }

  console.log("REPEATED NOTIFICATIONS STOPPED");

}


client.on("message", async (topic, message) => {

  const value = message.toString().trim();

  console.log("TOPIC:", topic);

  console.log("MESSAGE:", value);


  // GAS STATUS

  if (topic === "pritam/gas/status") {

    if (value === "LEAK") {

      if (!gasLeak) {

        console.log("GAS LEAK STARTED");

        gasLeak = true;

        appOpened = false;

        startRepeatedAlerts();

      }

    }


    if (value === "SAFE") {

      console.log("GAS SAFE");

      gasLeak = false;

      appOpened = false;

      stopRepeatedAlerts();

    }

  }


  // APP OPEN SIGNAL

  if (topic === "pritam/gas/app") {

    if (value === "APP_OPEN") {

      console.log("APP OPENED");

      appOpened = true;

      stopRepeatedAlerts();

    }

  }

});


client.on("error", (error) => {

  console.log("MQTT ERROR:", error);

});
